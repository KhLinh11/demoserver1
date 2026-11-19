"""FastAPI Application và REST API endpoints cho Vitara Data Platform."""

import io
from pathlib import Path
from typing import Annotated

import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

from BE.config import REPO_DIR, Settings, load_settings
from BE.copilot import ask_vitara_copilot, db_store
from BE.engine import calculate_pnl_summary, parse_and_validate_file
from BE.reporting import generate_pdf_report
from BE.schemas import (
    DataPage,
    ErrorResponse,
    HitlApprovalRequest,
    PnLSummary,
    RunInfo,
    WhatIfRequest,
)
from BE.storage import Store
from pydantic import BaseModel
from typing import Optional, List, Dict, Any


settings = load_settings()
store = Store(settings.db_path)

app = FastAPI(
    title="Vitara Data Platform - Decision Intelligence API",
    description="Hệ thống đối soát dữ liệu đa kênh, gán công tiếp thị và phân tích P&L 12 dòng chuẩn kế toán quản trị.",
    version="1.0.0",
)

# Cấu hình CORS để Frontend gọi trực tiếp
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["Trạng thái"])
def health_check():
    """Kiểm tra trạng thái máy chủ BE và các ngưỡng giới hạn."""
    return {
        "status": "healthy",
        "max_input_rows": settings.max_input_rows,
        "max_upload_bytes": settings.max_upload_bytes,
        "storage": "sqlite_wal",
        "pdf_engine": "reportlab_unicode",
    }


@app.get("/api/sample-data", tags=["Dữ liệu mẫu"])
def get_sample_data():
    """Tải tệp dữ liệu mẫu doanh nghiệp chuẩn (dưới 1.000 dòng)."""
    sample_path = REPO_DIR / "sample_data.csv"
    if not sample_path.exists():
        sample_path = REPO_DIR / "public/sample_data.csv"
    if not sample_path.exists():
        raise HTTPException(404, "Không tìm thấy tệp sample_data.csv.")
    return FileResponse(
        sample_path,
        media_type="text/csv",
        filename="sample_data.csv",
    )


@app.post(
    "/api/runs",
    response_model=RunInfo,
    status_code=201,
    tags=["Lần chạy đối soát"],
    responses={413: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
)
async def create_run(
    file: Annotated[UploadFile, File(description="Tệp CSV hoặc Excel (.xlsx, .xls) tối đa 1.000 dòng.")],
    company_name: Annotated[str, Form(description="Tên doanh nghiệp")] = "Công ty Cổ phần Gia dụng Gia Hòa",
    painpoints: Annotated[str, Form(description="Nỗi đau vận hành / thâm hụt")] = "",
    expectations: Annotated[str, Form(description="Kỳ vọng đối soát")] = "",
):
    """
    Tải lên tệp dữ liệu giao dịch:
    - Kiểm tra định dạng (.csv, .xlsx, .xls) và kích thước tệp.
    - Giới hạn nghiêm ngặt tối đa 1.000 dòng theo yêu cầu.
    - Tự động làm sạch, khử trùng đa chạm và khởi tạo bảng P&L 12 dòng.
    """
    content = await file.read(settings.max_upload_bytes + 1)
    await file.close()

    if len(content) > settings.max_upload_bytes:
        raise HTTPException(
            413,
            f"Tệp vượt quá dung lượng tối đa cho phép ({settings.max_upload_bytes // (1024 * 1024)} MiB).",
        )

    filename = Path(file.filename or "input.csv").name
    try:
        df, stats, orders, extra_meta = parse_and_validate_file(
            content=content,
            filename=filename,
            max_input_rows=settings.max_input_rows,
        )
    except ValueError as e:
        raise HTTPException(422, str(e)) from None

    # Sinh mã định danh lần chạy
    import uuid
    run_id = uuid.uuid4().hex

    # Lưu tệp raw vào uploads_dir
    save_file_path = settings.uploads_dir / f"{run_id}_{filename}"
    with open(save_file_path, "wb") as f:
        f.write(content)

    # Lưu thông tin run và các đơn hàng vào SQLite
    run_info = store.create_run(
        run_id=run_id,
        filename=filename,
        total_rows=len(orders),
        company_name=company_name,
        painpoints=painpoints,
        expectations=expectations,
        stats=stats,
    )
    store.save_orders(run_id, orders)

    # Khởi tạo bảng P&L mặc định
    default_pnl = calculate_pnl_summary(orders, WhatIfRequest(attribution_model="data_driven", return_factor=1.0))
    store.save_pnl_snapshot(run_id, default_pnl)

    # Tự động nạp tệp mới vào DuckDB Analytics Store để AI Copilot truy vấn tức thì
    try:
        db_store.load_user_file(content, filename)
    except Exception as e:
        pass

    return run_info


@app.get("/api/runs", response_model=list[RunInfo], tags=["Lần chạy đối soát"])
def list_runs(limit: int = Query(20, ge=1, le=100)):
    """Lấy danh sách các lần đối soát đã thực hiện."""
    return store.list_runs(limit)


@app.get("/api/runs/{run_id}", response_model=RunInfo, tags=["Lần chạy đối soát"])
def get_run(run_id: str):
    """Lấy thông tin chi tiết một lần đối soát."""
    run = store.get_run(run_id)
    if not run:
        raise HTTPException(404, "Không tìm thấy lần chạy đối soát.")
    return run


@app.get("/api/runs/{run_id}/data", response_model=DataPage, tags=["Dữ liệu đã làm sạch"])
def get_cleaned_data(
    run_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=5, le=200),
    status: str | None = Query(None, description="Lọc theo trạng thái"),
    search: str | None = Query(None, description="Tìm kiếm mã đơn, sản phẩm, kênh"),
):
    """Lấy dữ liệu đơn hàng đã qua xử lý (phân trang, tìm kiếm, lọc trạng thái)."""
    run = store.get_run(run_id)
    if not run:
        raise HTTPException(404, "Không tìm thấy lần chạy đối soát.")

    offset = (page - 1) * page_size
    items, total = store.get_orders(
        run_id=run_id,
        offset=offset,
        limit=page_size,
        status_filter=status,
        search=search,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return DataPage(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@app.post("/api/runs/{run_id}/approve", response_model=RunInfo, tags=["Bước 2: Phê duyệt HITL"])
def approve_cleansing(run_id: str, request: HitlApprovalRequest):
    """Chốt chặn HITL (Human-in-the-Loop): Người dùng phê duyệt kế hoạch chuẩn hoá dữ liệu."""
    run = store.get_run(run_id)
    if not run:
        raise HTTPException(404, "Không tìm thấy lần chạy đối soát.")

    new_status = "approved" if request.decision == "approved" else "modified"
    store.update_run_status(run_id, new_status)
    return store.get_run(run_id)


@app.post("/api/runs/{run_id}/what-if", response_model=PnLSummary, tags=["Bước 4: Mô phỏng What-If"])
def run_what_if(run_id: str, req: WhatIfRequest):
    """Mô phỏng thay đổi mô hình Attribution và hệ số hoàn hàng để tính lại P&L và dịch chuyển thứ hạng."""
    run = store.get_run(run_id)
    if not run:
        raise HTTPException(404, "Không tìm thấy lần chạy đối soát.")

    orders, _ = store.get_orders(run_id, offset=0, limit=settings.max_input_rows)
    pnl = calculate_pnl_summary(orders, req)
    store.save_pnl_snapshot(run_id, pnl)
    return pnl


@app.get("/api/runs/{run_id}/pnl", response_model=PnLSummary, tags=["Bước 5: Báo cáo P&L"])
def get_pnl(run_id: str):
    """Lấy báo cáo P&L 12 dòng và hiệu quả theo kênh."""
    run = store.get_run(run_id)
    if not run:
        raise HTTPException(404, "Không tìm thấy lần chạy đối soát.")

    pnl = store.get_pnl_snapshot(run_id)
    if not pnl:
        orders, _ = store.get_orders(run_id, offset=0, limit=settings.max_input_rows)
        pnl = calculate_pnl_summary(orders, WhatIfRequest())
        store.save_pnl_snapshot(run_id, pnl)
    return pnl


@app.api_route("/api/runs/{run_id}/export/pdf", methods=["GET", "HEAD"], tags=["Xuất báo cáo PDF"])
def export_pdf(run_id: str):
    """Tải báo cáo kiểm toán tài chính PDF chuẩn A4 đầy đủ bảng P&L, biểu đồ và chữ ký số."""
    run = store.get_run(run_id)
    if not run:
        raise HTTPException(404, "Không tìm thấy lần chạy đối soát.")

    pnl = store.get_pnl_snapshot(run_id)
    if not pnl:
        orders, _ = store.get_orders(run_id, offset=0, limit=settings.max_input_rows)
        pnl = calculate_pnl_summary(orders, WhatIfRequest())
        store.save_pnl_snapshot(run_id, pnl)

    pdf_bytes = generate_pdf_report(run, pnl)
    filename = f"Bao_Cao_Kiem_Toan_{run.id[:8].upper()}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.api_route("/api/runs/{run_id}/export/csv", methods=["GET", "HEAD"], tags=["Xuất tệp CSV"])
def export_csv(run_id: str):
    """Xuất toàn bộ dữ liệu đơn hàng đã qua chuẩn hoá làm sạch dưới dạng file CSV."""
    run = store.get_run(run_id)
    if not run:
        raise HTTPException(404, "Không tìm thấy lần chạy đối soát.")

    orders, _ = store.get_orders(run_id, offset=0, limit=settings.max_input_rows)
    data = [o.model_dump() for o in orders]
    df = pd.DataFrame(data)

    stream = io.StringIO()
    df.to_csv(stream, index=False, encoding="utf-8-sig")
    return Response(
        content=stream.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="Cleaned_Data_{run.id[:8].upper()}.csv"'},
    )


class CopilotChatRequest(BaseModel):
    query: str
    history: Optional[List[Dict[str, Any]]] = None


@app.post("/api/copilot/chat", tags=["Trợ lý AI Copilot"])
def copilot_chat(req: CopilotChatRequest):
    """Xử lý câu hỏi phân tích dữ liệu bán hàng qua DuckDB Analytics Engine."""
    if not req.query or not req.query.strip():
        raise HTTPException(400, "Nội dung câu hỏi không được để trống.")
    try:
        res = ask_vitara_copilot(req.query.strip())
        return {
            "status": "success",
            "reply": res.get("reply", ""),
            "sql": res.get("sql"),
            "data": res.get("data", []),
            "source_table": res.get("source_table"),
            "intent": res.get("intent")
        }
    except Exception as e:
        return {
            "status": "error",
            "reply": f"Hệ thống gặp sự cố khi xử lý câu hỏi: {str(e)}",
            "sql": None,
            "data": []
        }


@app.post("/api/copilot/load-dataset", tags=["Trợ lý AI Copilot"])
async def copilot_load_dataset(file: UploadFile = File(...)):
    """Nạp trực tiếp file CSV hoặc Excel mới vào DuckDB Analytics Store để Copilot truy vấn tức thì."""
    if not file.filename:
        raise HTTPException(400, "Vui lòng chọn tệp.")
    content = await file.read()
    filename = Path(file.filename).name
    try:
        result = db_store.load_user_file(content, filename)
        return result
    except Exception as e:
        raise HTTPException(400, f"Không thể nạp tệp vào DuckDB: {str(e)}")


# Phục vụ favicon trực tiếp, tránh lỗi 404 trên trình duyệt
@app.api_route("/favicon.ico", methods=["GET", "HEAD"], include_in_schema=False)
def favicon():
    svg_icon = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#8F60BF"/>
  <path d="M18 20 L32 46 L46 20" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>"""
    return Response(content=svg_icon, media_type="image/svg+xml")


# Phục vụ giao diện tĩnh index.html trực tiếp từ BE (nếu chạy all-in-one)
@app.api_route("/", methods=["GET", "HEAD"], include_in_schema=False)
def serve_index():
    index_path = REPO_DIR / "index.html"
    return FileResponse(index_path, media_type="text/html")
