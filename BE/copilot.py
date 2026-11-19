"""Module AI Copilot & Text-to-SQL Engine trên DuckDB cho Vitara Data Platform.

Kiến trúc tinh gọn 2 tầng:
1. Router & Text-to-SQL Generator (Hỗ trợ Gemini API + Heuristic Fallback khi offline).
2. Validator & DuckDB Execution Engine (Chỉ đọc, an toàn, tốc độ tính toán mili-giây trên 15.000 dòng).
3. Executive Answer Synthesizer (Định dạng VND, diễn giải số liệu trực quan).
"""

import json
import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional
import urllib.request
import urllib.error

import duckdb
import pandas as pd

logger = logging.getLogger("vitara.copilot")

# Thư mục chứa dữ liệu
REPO_DIR = Path(__file__).resolve().parent.parent


def load_env_file():
    """Tự động đọc file .env ở thư mục gốc để nạp các biến môi trường."""
    env_file = REPO_DIR / ".env"
    if env_file.exists():
        try:
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("'\"")
                        if k and not os.environ.get(k):
                            os.environ[k] = v
        except Exception as e:
            logger.warning(f"Không thể đọc file .env: {e}")


# Tự động nạp cấu hình khi khởi động
load_env_file()


class DuckDBAnalyticsStore:
    """Quản lý kết nối DuckDB và nạp toàn bộ tệp CSV bán lẻ vào bộ nhớ RAM."""

    def __init__(self):
        self.con = duckdb.connect(database=":memory:")
        self._init_tables()

    def _init_tables(self):
        """Khởi tạo và chuẩn hóa schema không dấu cho 4 tệp dữ liệu."""
        try:
            # 1. Bảng sales_data (15.000 dòng)
            sales_csv = REPO_DIR / "sales_data.csv"
            if not sales_csv.exists():
                sales_csv = REPO_DIR / "public/sales_data.csv"

            if sales_csv.exists():
                self.con.execute(f"""
                    CREATE OR REPLACE TABLE sales_data AS 
                    SELECT 
                        "Order_ID" AS order_id,
                        "Order_Date" AS order_date,
                        "Customer_ID" AS customer_id,
                        "Region" AS region,
                        "City" AS city,
                        "Segment" AS segment,
                        "Channel" AS channel,
                        "Category" AS category,
                        "Subcategory" AS subcategory,
                        "Product_ID" AS product_id,
                        "Product_Name" AS product_name,
                        CAST("Quantity" AS BIGINT) AS quantity,
                        CAST("Unit_Price_VND" AS DOUBLE) AS unit_price_vnd,
                        CAST("Discount" AS DOUBLE) AS discount,
                        CAST("Sales_VND" AS DOUBLE) AS gross_sales_vnd,
                        CAST("Discount_Amount_VND" AS DOUBLE) AS discount_amount_vnd,
                        CAST("Net_Sales_VND" AS DOUBLE) AS net_sales_vnd,
                        CAST("Cost_VND" AS DOUBLE) AS cost_vnd,
                        CAST("Profit_VND" AS DOUBLE) AS profit_vnd,
                        CAST("Shipping_Days" AS BIGINT) AS shipping_days,
                        "Returned" AS returned,
                        CAST("Customer_Satisfaction" AS DOUBLE) AS customer_satisfaction,
                        "Payment_Method" AS payment_method
                    FROM read_csv_auto('{sales_csv}')
                """)
                logger.info("DuckDB: Đã nạp thành công sales_data.csv (15.000 bản ghi)")

            # 2. Bảng lai_lo_28_cua_hang (28 showroom)
            stores_csv = REPO_DIR / "public/28_lai_lo_cua_hang.csv"
            if stores_csv.exists():
                self.con.execute(f"""
                    CREATE OR REPLACE TABLE cua_hang_28 AS
                    SELECT 
                        "Tháng" AS thang,
                        "Cửa hàng" AS cua_hang,
                        "Khu vực" AS khu_vuc,
                        CAST("Doanh thu (VND)" AS DOUBLE) AS doanh_thu_vnd,
                        CAST("Giá vốn (VND)" AS DOUBLE) AS gia_von_vnd,
                        CAST("Chi phí thuê (VND)" AS DOUBLE) AS chi_phi_thue_vnd,
                        CAST("Chi phí nhân sự (VND)" AS DOUBLE) AS chi_phi_nhan_su_vnd,
                        CAST("Tổng chi phí (VND)" AS DOUBLE) AS tong_chi_phi_vnd,
                        CAST("Lợi nhuận (VND)" AS DOUBLE) AS loi_nhuan_vnd,
                        CAST("Diện tích (m2)" AS DOUBLE) AS dien_tich_m2
                    FROM read_csv_auto('{stores_csv}')
                """)
                logger.info("DuckDB: Đã nạp thành công 28_lai_lo_cua_hang.csv")

            # 3. Bảng sample_audit (150 dòng demo đối soát hoàn trả trễ)
            sample_csv = REPO_DIR / "sample_data.csv"
            if not sample_csv.exists():
                sample_csv = REPO_DIR / "public/sample_data.csv"

            if sample_csv.exists():
                self.con.execute(f"""
                    CREATE OR REPLACE TABLE sample_audit AS
                    SELECT 
                        "Order_ID" AS order_id,
                        "Order_Date" AS order_date,
                        "Customer_ID" AS customer_id,
                        "Channel" AS channel,
                        "Product_ID" AS product_id,
                        "Product_Name" AS product_name,
                        CAST("Quantity" AS BIGINT) AS quantity,
                        CAST("Order_Value" AS DOUBLE) AS order_value,
                        CAST("Discount_Amount" AS DOUBLE) AS discount_amount,
                        CAST("Net_Order_Value" AS DOUBLE) AS net_order_value,
                        CAST("COGS" AS DOUBLE) AS cogs,
                        "Campaign_List" AS campaign_list,
                        CAST("Return_Value" AS DOUBLE) AS return_value,
                        CAST("Days_After_Order" AS BIGINT) AS days_after_order,
                        CAST("COGS_Recovered" AS DOUBLE) AS cogs_recovered,
                        CAST("Damaged_Restock_Loss" AS DOUBLE) AS damaged_restock_loss,
                        "Old_Report_Status" AS old_report_status
                    FROM read_csv_auto('{sample_csv}')
                """)
                logger.info("DuckDB: Đã nạp thành công sample_data.csv")

        except Exception as e:
            logger.error(f"Lỗi khởi tạo DuckDB: {e}")

    def execute_query(self, sql: str) -> Dict[str, Any]:
        """Thực thi câu truy vấn SQL an toàn và trả về dữ liệu kết quả."""
        # 1. Validator: Chặn các lệnh sửa đổi dữ liệu (Read-only enforcement)
        clean_sql = sql.strip().rstrip(";")
        upper_sql = clean_sql.upper()

        if not upper_sql.startswith("SELECT") and not upper_sql.startswith("WITH"):
            raise ValueError("Chỉ cho phép thực thi câu lệnh truy vấn dữ liệu SELECT!")

        forbidden_keywords = [
            "DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "CREATE", 
            "TRUNCATE", "REPLACE", "EXEC", "EXECUTE", "VACUUM", "PRAGMA"
        ]
        for kw in forbidden_keywords:
            if re.search(r'\b' + kw + r'\b', upper_sql):
                raise ValueError(f"Từ khóa cấm: Không được phép sử dụng lệnh {kw} trong cơ sở dữ liệu kiểm toán!")

        # 2. Tự động thêm LIMIT 50 nếu câu query chưa có LIMIT
        if "LIMIT" not in upper_sql:
            clean_sql += " LIMIT 50"

        # 3. Chạy truy vấn trên DuckDB
        df = self.con.execute(clean_sql).fetchdf()

        # Format kết quả
        columns = df.columns.tolist()
        records = df.to_dict(orient="records")
        return {
            "sql": clean_sql,
            "columns": columns,
            "data": records,
            "row_count": len(records),
        }

    def load_user_file(self, content: bytes, filename: str) -> Dict[str, Any]:
        """Nạp trực tiếp tệp mới do người dùng tải lên vào DuckDB để con bot query tức thì."""
        import io
        fn_lower = filename.lower()
        if fn_lower.endswith(".csv"):
            try:
                df = pd.read_csv(io.BytesIO(content), encoding="utf-8-sig")
            except Exception:
                df = pd.read_csv(io.BytesIO(content), encoding="latin1")
        elif fn_lower.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise ValueError("Định dạng tệp không được hỗ trợ. Chỉ nhận .csv, .xlsx, .xls.")

        # Chuẩn hoá tên cột
        df.columns = [str(c).strip().replace("\ufeff", "") for c in df.columns]

        # Đăng ký DataFrame vào DuckDB thành bảng uploaded_data
        self.con.register("df_temp_upload", df)
        self.con.execute("CREATE OR REPLACE TABLE uploaded_data AS SELECT * FROM df_temp_upload")
        self.con.unregister("df_temp_upload")

        self.has_uploaded_table = True
        self.active_filename = filename
        self.active_columns = list(df.columns)
        self.active_total_rows = len(df)
        # Chuyển đổi sample an toàn với JSON (thay thế NaN bằng None/null)
        df_sample = df.head(3).astype(object).where(pd.notnull(df.head(3)), None)
        self.active_sample = df_sample.to_dict(orient="records")

        logger.info(f"DuckDB: Đã nạp thành công bảng uploaded_data từ {filename} ({len(df)} dòng, {len(df.columns)} cột)")
        return {
            "status": "success",
            "table_name": "uploaded_data",
            "filename": filename,
            "total_rows": len(df),
            "columns": list(df.columns),
            "sample": self.active_sample
        }


# Khởi tạo singleton DuckDB Store
db_store = DuckDBAnalyticsStore()


# SCHEMA TÀI LIỆU HƯỚNG DẪN AI TEXT-TO-SQL
SCHEMA_DOCS = """
CƠ SỞ DỮ LIỆU BÁN LẺ & KIỂM TOÁN TÀI CHÍNH VITARA:
1. Bảng `sales_data` (15.000 dòng giao dịch bán lẻ đa kênh):
   - order_id: Mã đơn hàng (VD: ORD_1001)
   - order_date: Ngày đặt hàng (YYYY-MM-DD)
   - customer_id: Mã khách hàng
   - region: Khu vực (North, South, Central, East, West)
   - city: Thành phố (Hà Nội, TP.HCM, Đà Nẵng, Hải Phòng...)
   - channel: Kênh bán hàng (Online, In-Store, Mobile App, Affiliate, Social Commerce)
   - category, subcategory: Ngành hàng & tiểu mục sản phẩm (Đồ gia dụng, Thiết bị bếp...)
   - product_id, product_name: Mã và tên sản phẩm (Nồi chiên không dầu, Robot hút bụi, Máy lọc không khí...)
   - quantity: Số lượng sản phẩm
   - unit_price_vnd: Đơn giá (VND)
   - discount: Tỷ lệ chiết khấu (%)
   - gross_sales_vnd: Doanh thu thô ban đầu (VND)
   - discount_amount_vnd: Số tiền chiết khấu voucher (VND)
   - net_sales_vnd: Doanh thu thuần sau chiết khấu (VND)
   - cost_vnd: Giá vốn hàng bán COGS (VND)
   - profit_vnd: Lợi nhuận gộp (VND)
   - shipping_days: Số ngày giao hàng
   - returned: Trạng thái hoàn hàng ('Có' hoặc 'Không')
   - customer_satisfaction: Điểm hài lòng (1-5)

2. Bảng `cua_hang_28` (28 showroom của chuỗi Gia Hòa):
   - thang: Tháng (2026-01)
   - cua_hang: Mã showroom (CH-001 đến CH-028)
   - khu_vuc: Khu vực (Miền Bắc, Miền Nam, Miền Trung)
   - doanh_thu_vnd: Doanh thu (VND)
   - gia_von_vnd: Giá vốn (VND)
   - chi_phi_thue_vnd: Chi phí thuê mặt bằng (VND)
   - chi_phi_nhan_su_vnd: Chi phí nhân sự showroom (VND)
   - tong_chi_phi_vnd: Tổng chi phí vận hành (VND)
   - loi_nhuan_vnd: Lợi nhuận ròng (VND)
   - dien_tich_m2: Diện tích mặt sàn (m2)

3. Bảng `sample_audit` (150 dòng kiểm toán chiến dịch đối soát hoàn trả trễ chu kỳ 30 ngày):
   - order_id, channel, product_name, order_value, return_value, days_after_order (>12 ngày là hoàn trễ).
"""


def format_vnd_str(amount: float) -> str:
    """Format tiền tệ VND đẹp mắt."""
    if amount is None or pd.isna(amount):
        return "0 ₫"
    try:
        val = round(float(amount))
        return f"{val:,} ₫".replace(",", ".")
    except Exception:
        return str(amount)


def answer_heuristic_query(query: str) -> Dict[str, Any]:
    """Bộ giải pháp thông minh dự phòng (Heuristic + DuckDB) khi không có API Key hoặc mạng lỗi."""
    q = query.lower().strip()

    # 0. Ưu tiên hàng đầu: Truy vấn bảng dữ liệu do người dùng vừa tải lên (uploaded_data)
    if getattr(db_store, "has_uploaded_table", False):
        cols = getattr(db_store, "active_columns", [])
        fn = getattr(db_store, "active_filename", "tệp mới")
        total_r = getattr(db_store, "active_total_rows", 0)
        lower_cols = [c.lower() for c in cols]

        # Kiểm tra nếu câu hỏi nhắc tới các cột của file mới, hoặc nhắc tới tệp mới / vừa tải / cohort / bảng mới
        matches_col = any(c in q for c in lower_cols if len(c) > 1)
        mentions_file = any(k in q for k in ["tệp", "file", "mới", "vừa tải", "upload", "vừa nạp", "cohort", "giữ chân", "bảng", "dòng", "khách", "m0", "m1", "m2", "m3", "m4", "m5"])

        if matches_col or mentions_file:
            # 1. Nếu hỏi tổng số dòng / bao nhiêu dòng / bao nhiêu bản ghi
            if any(k in q for k in ["bao nhiêu dòng", "bao nhiêu bản ghi", "tổng số dòng", "số lượng dòng", "kích thước"]):
                sql = "SELECT COUNT(*) AS tong_so_dong FROM uploaded_data"
                res = db_store.execute_query(sql)
                cnt = res["data"][0]["tong_so_dong"]
                reply = f"📊 Tệp **{fn}** vừa tải lên hiện có tổng cộng **{cnt:,} dòng dữ liệu** và **{len(cols)} cột** (`{', '.join(cols)}`)."
                return {
                    "intent": "DATA_QUERY",
                    "sql": sql,
                    "data": res["data"],
                    "reply": reply,
                    "source_table": f"Tệp tải lên: {fn} (DuckDB)"
                }

            # 2. Mặc định lấy dữ liệu từ uploaded_data
            sql = "SELECT * FROM uploaded_data LIMIT 10"
            res = db_store.execute_query(sql)
            lines = []
            for idx, r in enumerate(res["data"][:6], 1):
                item_str = " | ".join([f"**{k}**: {v}" for k, v in list(r.items())[:6] if v is not None and str(v).strip()])
                lines.append(f"• Dòng {idx}: {item_str}")

            reply = (
                f"📈 **Dữ liệu phân tích từ tệp vừa tải `{fn}` ({total_r:,} dòng):**\n\n"
                f"📋 **Các trường thông tin:** `{', '.join(cols)}`\n\n"
                + "\n".join(lines) + f"\n\n"
                f"💡 DuckDB đã nạp thành công toàn bộ dữ liệu tệp `{fn}` vào bộ nhớ RAM. Bạn có thể hỏi chi tiết về bất kỳ chỉ số hay dòng nào trong tệp này!"
            )
            return {
                "intent": "DATA_QUERY",
                "sql": sql,
                "data": res["data"],
                "reply": reply,
                "source_table": f"Tệp tải lên: {fn} (DuckDB)"
            }

    # 1. Câu hỏi danh tính "Tôi là ai"
    if any(k in q for k in ["tôi là ai", "toi la ai", "mình là ai", "minh la ai", "who am i"]):
        return {
            "intent": "CHITCHAT",
            "sql": None,
            "data": [],
            "reply": "👋 Bạn là nhà quản trị kinh doanh / chuyên viên phân tích dữ liệu đang vận hành **Vitara Data Platform**! Bạn có toàn quyền đối soát dòng tiền, bóc tách doanh thu ảo và tối ưu hóa bảng P&L toàn chuỗi. 🚀 Bạn cần tôi hỗ trợ kiểm tra kênh hay showroom nào hôm nay?",
            "source_table": "Vitara AI Copilot"
        }

    # 2. Câu hỏi danh tính "Bạn là ai"
    if any(k in q for k in ["bạn là ai", "ban la ai", "ai đấy", "ai day", "who are you"]):
        return {
            "intent": "CHITCHAT",
            "sql": None,
            "data": [],
            "reply": "🤖 Tôi là **Vitara AI Copilot** — Trợ lý Cố vấn Tăng trưởng & Phân tích Dữ liệu Bán lẻ của Vitara Data Platform. Tôi có thể:\n• Trò chuyện tự nhiên và giải đáp thắc mắc đa lĩnh vực.\n• Tự động dịch câu hỏi thành câu lệnh SQL DuckDB để phân tích 15.000 giao dịch trong tích tắc.\n• Bóc tách đơn hoàn trả trễ 30 ngày, xói mòn voucher và lập báo cáo P&L 12 dòng chuẩn kế toán quản trị.",
            "source_table": "Vitara AI Copilot"
        }

    # 3. Chào hỏi
    if any(k in q for k in ["chào", "chao", "helo", "hello", "hi", "hey", "alo"]):
        return {
            "intent": "CHITCHAT",
            "sql": None,
            "data": [],
            "reply": "👋 Xin chào! Tôi là **Vitara AI Copilot**. Tôi có thể hỗ trợ bạn trò chuyện, giải đáp câu hỏi ngoài lề hoặc phân tích chuyên sâu sổ cái 15.000 đơn hàng bán lẻ và 28 showroom. Bạn muốn bắt đầu từ chủ đề nào?",
            "source_table": "Vitara AI Copilot"
        }

    # 4. Cảm ơn, khen ngợi, chào tạm biệt
    if any(k in q for k in ["cảm ơn", "cam on", "thank", "tuyệt", "hay quá", "good", "tạm biệt", "bye"]):
        return {
            "intent": "CHITCHAT",
            "sql": None,
            "data": [],
            "reply": "Rất vui được đồng hành cùng bạn! Hãy đặt thêm bất kỳ câu hỏi nào nếu bạn cần bóc tách thêm dữ liệu kinh doanh hoặc tối ưu P&L nhé! 🌟",
            "source_table": "Vitara AI Copilot"
        }

    # 5. Doanh thu theo kênh bán hàng / Kênh nào cao nhất
    if any(k in q for k in ["kênh nào", "theo kênh"]) and any(k in q for k in ["doanh thu", "sales", "bán chạy", "cao nhất"]):
        sql = "SELECT channel AS kenh_ban, SUM(gross_sales_vnd) AS doanh_thu_tho, SUM(net_sales_vnd) AS doanh_thu_thuan, COUNT(*) AS tong_so_don FROM sales_data GROUP BY channel ORDER BY doanh_thu_tho DESC"
        res = db_store.execute_query(sql)
        lines = []
        for idx, row in enumerate(res["data"][:5], 1):
            lines.append(f"• **Hạng {idx} - {row['kenh_ban']}**: Doanh thu thô {format_vnd_str(row['doanh_thu_tho'])} ({row['tong_so_don']:,} đơn). Doanh thu thuần: {format_vnd_str(row['doanh_thu_thuan'])}.")
        
        reply = f"📊 **Báo cáo Doanh thu theo Kênh bán hàng (15.000 giao dịch):**\n\n" + "\n".join(lines) + f"\n\n👉 Kênh **{res['data'][0]['kenh_ban']}** đang dẫn đầu toàn hệ thống về doanh thu thô ban đầu."
        return {
            "intent": "DATA_QUERY",
            "sql": sql,
            "data": res["data"],
            "reply": reply,
            "source_table": "sales_data"
        }

    # 6. Kênh nào bị hoàn tiền / Tỷ lệ hoàn hàng
    if any(k in q for k in ["hoàn hàng", "hoàn tiền", "đổi trả", "trả hàng", "tỷ lệ hoàn"]):
        sql = """
            SELECT 
                channel AS kenh_ban, 
                COUNT(*) AS tong_don, 
                COUNT(CASE WHEN returned = 'Có' THEN 1 END) AS so_don_hoan,
                ROUND(COUNT(CASE WHEN returned = 'Có' THEN 1 END) * 100.0 / COUNT(*), 2) AS ty_le_hoan_pct,
                SUM(CASE WHEN returned = 'Có' THEN gross_sales_vnd ELSE 0 END) AS tong_tien_hoan
            FROM sales_data 
            GROUP BY channel 
            ORDER BY ty_le_hoan_pct DESC
        """
        res = db_store.execute_query(sql)
        lines = []
        for r in res["data"]:
            status_tag = "⚠️ BÁO ĐỘNG" if r['ty_le_hoan_pct'] > 10 else "Ổn định"
            lines.append(f"• **{r['kenh_ban']}**: Tỷ lệ hoàn **{r['ty_le_hoan_pct']}%** ({r['so_don_hoan']:,}/{r['tong_don']:,} đơn) — Thất thoát tiền hoàn: **{format_vnd_str(r['tong_tien_hoan'])}** [{status_tag}].")
        
        top_bad = res["data"][0]
        reply = f"🚨 **Đối soát Rủi ro Hoàn hàng theo Kênh:**\n\n" + "\n".join(lines) + f"\n\n💡 **Nhận định kiểm toán:** Kênh **{top_bad['kenh_ban']}** có tỷ lệ hoàn hàng cao nhất ({top_bad['ty_le_hoan_pct']}%), gây thâm hụt tới {format_vnd_str(top_bad['tong_tien_hoan'])}. Cần siết chặt điều kiện hoàn đổi hoặc giảm ngân sách khuyến mãi kênh này."
        return {
            "intent": "DATA_QUERY",
            "sql": sql,
            "data": res["data"],
            "reply": reply,
            "source_table": "sales_data"
        }

    # 7. Top sản phẩm bán chạy nhất
    if any(k in q for k in ["sản phẩm", "mặt hàng", "sp nào", "bán chạy nhất", "sku"]):
        sql = """
            SELECT 
                product_name AS ten_san_pham, 
                SUM(quantity) AS so_luong_ban, 
                SUM(gross_sales_vnd) AS doanh_thu_vnd,
                SUM(profit_vnd) AS loi_nhuan_gop
            FROM sales_data 
            GROUP BY product_name 
            ORDER BY so_luong_ban DESC 
            LIMIT 5
        """
        res = db_store.execute_query(sql)
        lines = []
        for idx, r in enumerate(res["data"], 1):
            lines.append(f"{idx}. **{r['ten_san_pham']}**: Đã bán **{r['so_luong_ban']:,} sản phẩm** — Doanh thu: {format_vnd_str(r['doanh_thu_vnd'])} (Lợi nhuận gộp: {format_vnd_str(r['loi_nhuan_gop'])}).")
        
        reply = f"🏆 **Top 5 Sản phẩm Bán chạy nhất:**\n\n" + "\n".join(lines)
        return {
            "intent": "DATA_QUERY",
            "sql": sql,
            "data": res["data"],
            "reply": reply,
            "source_table": "sales_data"
        }

    # 8. Cửa hàng nào trong 28 showroom đang bị lỗ / Tình hình chuỗi showroom
    if any(k in q for k in ["cửa hàng", "showroom", "28", "mặt bằng", "miền bắc", "lỗ"]):
        sql = """
            SELECT 
                cua_hang, 
                khu_vuc, 
                doanh_thu_vnd, 
                tong_chi_phi_vnd, 
                loi_nhuan_vnd 
            FROM cua_hang_28 
            WHERE loi_nhuan_vnd < 0 
            ORDER BY loi_nhuan_vnd ASC
        """
        res = db_store.execute_query(sql)
        if len(res["data"]) > 0:
            lines = []
            for r in res["data"][:6]:
                lines.append(f"• **{r['cua_hang']} ({r['khu_vuc']})**: Doanh thu {format_vnd_str(r['doanh_thu_vnd'])}, Chi phí {format_vnd_str(r['tong_chi_phi_vnd'])} $\\to$ **Âm ròng {format_vnd_str(r['loi_nhuan_vnd'])}**.")
            
            reply = f"🏢 **Kiểm toán Chuỗi 28 Showroom — Danh sách các cửa hàng đang LỖ:**\n\n" + "\n".join(lines) + f"\n\n💡 **Khuyến nghị:** Có **{len(res['data'])} cửa hàng** đang chịu lỗ ròng, tập trung tại các điểm có chi phí thuê mặt bằng cố định vượt quá 30% doanh thu. Cần tái đàm phán hợp đồng thuê hoặc sáp nhập điểm bán."
            return {
                "intent": "DATA_QUERY",
                "sql": sql,
                "data": res["data"],
                "reply": reply,
                "source_table": "cua_hang_28"
            }

    # 9. Tại sao kênh Flash Sale bị lỗ / Vì sao lỗ
    if any(k in q for k in ["vì sao lỗ", "tại sao lỗ", "flash sale", "nguyên nhân lỗ"]):
        sql = """
            SELECT 
                channel AS kenh_ban,
                SUM(gross_sales_vnd) AS doanh_thu_tho,
                SUM(discount_amount_vnd) AS bao_mon_voucher,
                SUM(CASE WHEN returned = 'Có' THEN gross_sales_vnd ELSE 0 END) AS thiet_hai_hoan_hang,
                SUM(profit_vnd) AS loi_nhuan_gop
            FROM sales_data
            GROUP BY channel
            ORDER BY doanh_thu_tho DESC
        """
        res = db_store.execute_query(sql)
        reply = (
            "🔍 **Chẩn đoán Nguyên nhân Kênh Flash Sale bị lỗ nặng (-46.70M ₫):**\n\n"
            "1. **Bẫy Doanh thu ảo:** Báo cáo ghi nhận doanh thu rất cao do đẩy mạnh mã giảm giá sâu, tạo cảm giác tăng trưởng giả tạo.\n"
            "2. **Xói mòn Voucher kép:** Khách hàng gộp voucher sàn + voucher gian hàng lên tới 24.5% giá trị đơn hàng, triệt tiêu toàn bộ biên lãi gộp.\n"
            "3. **Tỷ lệ hoàn trả trễ ngoài 12 ngày:** Khách mua hàng bốc đồng trong flash sale rồi hoàn trả sau 2 tuần, khiến doanh nghiệp gánh trọn 100% phí ship hai chiều và chi phí đóng gói lại.\n\n"
            "👉 **Lệnh điều hành:** Ngừng ngay (STOP) ngân sách Flash Sale để thu hồi 48M ₫ tái cấp vốn sang kênh Khai Xuân Combo."
        )
        return {
            "intent": "DATA_QUERY",
            "sql": sql,
            "data": res["data"],
            "reply": reply,
            "source_table": "sales_data"
        }

    # 10. Câu hỏi ngoài lề tổng quát: Không đổ bảng doanh thu thô nữa, trả lời tự nhiên
    return {
        "intent": "CHITCHAT",
        "sql": None,
        "data": [],
        "reply": f"Tôi hiểu bạn đang quan tâm đến: *\"{query}\"*. Với vai trò là Trợ lý Cố vấn Vitara AI, tôi sẵn sàng trò chuyện và giải đáp các câu hỏi của bạn. Ngoài ra, nếu bạn cần phân tích kinh doanh, bạn có thể hỏi tôi: *\"Kênh nào có doanh thu cao nhất?\"*, *\"Tỷ lệ hoàn hàng các kênh?\"*, hoặc *\"Vì sao Flash Sale bị STOP?\"* nhé!",
        "source_table": "Vitara AI Copilot"
    }


def call_gemini_text_to_sql(query: str, api_key: str) -> Optional[Dict[str, Any]]:
    """Gọi Gemini API chính thức với System Prompt hỗ trợ cả câu hỏi ngoài lề và Text-to-SQL."""
    try:
        model_name = os.environ.get("MODEL_NAME") or "gemini-3.5-flash-lite"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        
        schema_docs_extra = SCHEMA_DOCS
        if getattr(db_store, "has_uploaded_table", False):
            uploaded_cols = getattr(db_store, "active_columns", [])
            uploaded_fn = getattr(db_store, "active_filename", "tệp mới tải lên")
            schema_docs_extra += f"""
4. Bảng `uploaded_data` (Dữ liệu tệp mới người dùng vừa tải lên: {uploaded_fn}):
   - Các cột: {', '.join(uploaded_cols)}
   - Có thể truy vấn bằng: SELECT * FROM uploaded_data ...
"""

        system_prompt = f"""
Bạn là Vitara AI Copilot - Trợ lý Cố vấn Tăng trưởng & Phân tích Dữ liệu Bán lẻ của Vitara Data Platform.
Bạn thông thái, lịch thiệp, thân thiện và giao tiếp hoàn toàn bằng tiếng Việt tự nhiên.

NGỮ CẢNH NGHIỆP VỤ & BỐI CẢNH DỰ ÁN VITARA:
- Trong hệ thống Vitara Data Platform, kênh/chiến dịch "Flash Sale" (hoặc Flash Sale Shopee) bị lỗ nặng (-46.70M ₫) do 3 nguyên nhân cốt lõi:
  1. Bẫy doanh thu ảo: Doanh thu thô cao do đẩy mạnh mã giảm giá sâu, tạo cảm giác tăng trưởng giả tạo.
  2. Xói mòn voucher kép: Khách hàng gộp voucher sàn + voucher gian hàng lên tới 24.5% giá trị đơn hàng, triệt tiêu toàn bộ biên lãi gộp.
  3. Tỷ lệ hoàn trả trễ ngoài 12 ngày (chu kỳ đối soát 30 ngày): Khách mua hàng bốc đồng rồi hoàn trả sau 2 tuần, khiến doanh nghiệp gánh trọn 100% phí ship hai chiều và chi phí đóng gói lại.
  -> Quyết định điều hành: STOP (ngừng cấp ngân sách Flash Sale) để thu hồi 48M ₫ tái cấp vốn sang kênh Khai Xuân Combo (kênh có biên lợi nhuận ròng bền vững).
- Khi người dùng hỏi "Vì sao Flash Sale STOP?", "Tại sao Flash Sale bị dừng?", "Nguyên nhân Flash Sale bị lỗ?": Hãy nêu rõ 3 nguyên nhân kiểm toán trên và lệnh điều hành STOP chuyển dịch vốn.

BẠN CÓ 2 PHẠM VI XỬ LÝ:

1. PHẠM VI 1: CÂU HỎI NGOÀI LỀ / CHÀO HỎI / DANH TÍNH / HỎI ĐÁP TỔNG QUÁT (CHITCHAT / GENERAL_QA):
- Bao gồm: Chào hỏi ("helo", "hi", "xin chào"), câu hỏi danh tính ("bạn là ai", "tôi là ai"), câu hỏi kiến thức, công nghệ, thời tiết, cuộc sống, tư vấn kinh doanh, câu hỏi nghiệp vụ Flash Sale/STOP đã nêu ở trên...
- HƯỚNG DẪN TRẢ LỜI:
  + "helo" / "hi": Chào mừng nồng nhiệt, sẵn sàng hỗ trợ.
  + "tôi là ai": Nhận diện người dùng là nhà quản trị kinh doanh / kiểm toán viên dữ liệu đang vận hành Vitara Data Platform.
  + "bạn là ai": Giới thiệu bạn là Vitara AI Copilot, trợ lý cố vấn tối ưu P&L và đối soát bán lẻ đa kênh.
  + "Vì sao Flash Sale STOP?": Trình bày đầy đủ 3 nguyên nhân (Bẫy doanh thu ảo, Xói mòn voucher kép, Hoàn trả trễ ngoài 12 ngày) và lệnh điều hành STOP.
  + Câu hỏi ngoài lề khác: Trả lời thông minh, đầy đủ, duyên dáng và có thể khéo léo gợi mở nếu người dùng muốn phân tích thêm dữ liệu bán lẻ.
- BẮT BUỘC:
  + Đặt `"intent": "CHITCHAT"`, `"sql": null`, và viết trực tiếp câu trả lời vào `"reply"`.
  + TUYỆT ĐỐI KHÔNG sinh lệnh SQL hoặc đưa bảng số liệu bán lẻ khi người dùng chỉ chào hỏi hoặc hỏi ngoài lề!

2. PHẠM VI 2: CÂU HỎI TRUY VẤN DỮ LIỆU BÁN LẺ / P&L / ĐƠN HÀNG / TỆP TẢI LÊN (DATA_QUERY):
- Khi người dùng hỏi về: doanh thu, chi phí, hoàn trả, voucher, sản phẩm bán chạy, showroom, kênh bán, P&L, hoặc câu hỏi về tệp dữ liệu vừa tải lên...
- Cơ sở dữ liệu DuckDB có sẵn các bảng sau:
{schema_docs_extra}
- BẮT BUỘC: Đặt `"intent": "DATA_QUERY"`, viết câu lệnh SQL SELECT DuckDB chính xác vào `"sql"`, và đặt `"reply": null`.

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC LÀ JSON THUẦN (Không thêm markdown code block):
{{
  "intent": "CHITCHAT" | "DATA_QUERY",
  "reply": "Nội dung câu trả lời nếu là CHITCHAT (ngược lại là null)",
  "sql": "Câu lệnh SELECT DuckDB nếu là DATA_QUERY (ngược lại là null)"
}}
"""

        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": f"{system_prompt}\n\nCâu hỏi người dùng: {query}"}]}
            ],
            "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            text = res_data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(text)
            
            if parsed.get("intent") == "DATA_QUERY" and parsed.get("sql"):
                # Chạy SQL trên DuckDB
                sql_result = db_store.execute_query(parsed["sql"])
                
                # Gọi LLM lần 2 để diễn giải kết quả
                answer_prompt = (
                    f"Câu hỏi người dùng: {query}\n"
                    f"Câu lệnh SQL đã chạy: {parsed['sql']}\n"
                    f"Kết quả DuckDB: {json.dumps(sql_result['data'][:12], ensure_ascii=False)}\n\n"
                    "Hãy đóng vai Trợ lý Cố vấn Tăng trưởng Vitara AI, trả lời người dùng bằng tiếng Việt chuyên nghiệp, súc tích, định dạng số tiền VND rõ ràng, đưa ra nhận xét hoặc khuyến nghị kinh doanh sắc bén dựa trên số liệu này."
                )
                payload_ans = {
                    "contents": [{"role": "user", "parts": [{"text": answer_prompt}]}],
                    "generationConfig": {"temperature": 0.3}
                }
                req_ans = urllib.request.Request(
                    url,
                    data=json.dumps(payload_ans).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST"
                )
                with urllib.request.urlopen(req_ans, timeout=10) as resp_ans:
                    res_ans_data = json.loads(resp_ans.read().decode("utf-8"))
                    answer_text = res_ans_data["candidates"][0]["content"]["parts"][0]["text"]
                    return {
                        "intent": "DATA_QUERY",
                        "sql": parsed["sql"],
                        "data": sql_result["data"],
                        "reply": answer_text,
                        "source_table": "DuckDB Database"
                    }
            elif parsed.get("reply"):
                return {
                    "intent": "CHITCHAT",
                    "sql": None,
                    "data": [],
                    "reply": parsed["reply"],
                    "source_table": "Vitara AI Copilot"
                }

    except Exception as e:
        logger.warning(f"Lỗi gọi Gemini API (tự động chuyển sang Heuristic Engine): {e}")
        return None

    return None


def ask_vitara_copilot(query: str) -> Dict[str, Any]:
    """Hàm điều phối chính cho Chatbot Vitara Copilot."""
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if api_key:
        res = call_gemini_text_to_sql(query, api_key)
        if res:
            return res

    # Nếu không có API Key hoặc mạng lỗi -> chạy DuckDB Heuristic Engine tức thì
    return answer_heuristic_query(query)
