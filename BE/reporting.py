"""Module xuất báo cáo kiểm toán tài chính PDF chuẩn A4 bằng ReportLab hỗ trợ tiếng Việt Unicode & Biểu đồ trực quan."""

import io
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from BE.config import load_settings
from BE.schemas import ChannelMetric, PnLSummary, RunInfo


def setup_pdf_fonts():
    """Đăng ký font DejaVuSans để hiển thị hoàn hảo dấu tiếng Việt."""
    settings = load_settings()
    font_reg = settings.font_regular
    font_bold = settings.font_bold
    try:
        pdfmetrics.registerFont(TTFont("DejaVuSans", font_reg))
        pdfmetrics.registerFont(TTFont("DejaVuSans-Bold", font_bold))
    except Exception:
        pass


def format_currency(val: float) -> str:
    if val is None or val == 0:
        return "0 ₫"
    return f"{int(round(val)):,} ₫".replace(",", ".")


def generate_channel_profit_chart(channels: list[ChannelMetric]) -> io.BytesIO:
    """Biểu đồ thanh ngang: Lợi nhuận ròng đóng góp theo kênh bán (Net Profit by Channel)."""
    fig, ax = plt.subplots(figsize=(7.2, 1.8), dpi=180)
    fig.patch.set_facecolor("#FAF8FC")
    ax.set_facecolor("#FAF8FC")

    names = [ch.channel for ch in channels]
    profits = [ch.contribution_profit / 1e6 for ch in channels]
    bar_cols = ["#079DD9" if p >= 0 else "#D93848" for p in profits]

    bars = ax.barh(names, profits, color=bar_cols, height=0.45, edgecolor="#057AA8", linewidth=0.5)
    for bar in bars:
        w = bar.get_width()
        offset = max(profits) * 0.02 if profits and max(profits) > 0 else 1.0
        ax.text(
            w + offset,
            bar.get_y() + bar.get_height() / 2,
            f"{w:+.1f}M ₫",
            va="center",
            ha="left" if w >= 0 else "right",
            fontsize=7.5,
            fontweight="bold",
            color="#1E1B2E",
        )

    max_p = max(profits) if profits else 10.0
    min_p = min(profits) if profits else 0.0
    ax.set_xlim(min(0.0, min_p * 1.15) - 5.0, max(10.0, max_p * 1.25))
    ax.set_title("2. Lợi Nhuận Ròng Đóng Góp Theo Kênh (Net Profit by Channel - Triệu ₫)", fontsize=8.5, fontweight="bold", color="#4D2678", pad=6)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color("#BEB6F2")
    ax.spines["bottom"].set_color("#BEB6F2")
    ax.xaxis.grid(True, linestyle="--", alpha=0.5, color="#BEB6F2")
    ax.set_axisbelow(True)

    plt.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", dpi=180)
    plt.close(fig)
    buf.seek(0)
    return buf


def generate_erosion_and_cost_charts(pnl_summary: PnLSummary, channels: list[ChannelMetric]) -> io.BytesIO:
    """Biểu đồ ghép: Bào mòn doanh thu do Voucher/Hoàn trả & Cơ cấu phân bổ chi phí (Donut)."""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(7.2, 1.8), dpi=180)
    fig.patch.set_facecolor("#FAF8FC")
    ax1.set_facecolor("#FAF8FC")
    ax2.set_facecolor("#FAF8FC")

    # 1. Stacked Bar Chart
    names = [ch.channel for ch in channels]
    audited = [ch.audited_net / 1e6 for ch in channels]
    vouchers = [max(0.0, (ch.gross_revenue - ch.reported_net)) / 1e6 for ch in channels]
    returns = [max(0.0, (ch.reported_net - ch.audited_net)) / 1e6 for ch in channels]

    ax1.bar(names, audited, label="Doanh thu thuần", color="#8F60BF", width=0.45)
    ax1.bar(names, vouchers, bottom=audited, label="Voucher", color="#BEB6F2", width=0.45)
    b2 = [audited[i] + vouchers[i] for i in range(len(names))]
    ax1.bar(names, returns, bottom=b2, label="Hoàn trả", color="#ECD8F2", width=0.45)
    ax1.set_title("Bào Mòn Doanh Thu & Voucher (Triệu ₫)", fontsize=8.0, fontweight="bold", color="#4D2678")
    ax1.legend(loc="upper right", fontsize=5.5, frameon=False)
    ax1.spines["top"].set_visible(False)
    ax1.spines["right"].set_visible(False)
    ax1.spines["left"].set_color("#BEB6F2")
    ax1.spines["bottom"].set_color("#BEB6F2")
    ax1.yaxis.grid(True, linestyle="--", alpha=0.5, color="#BEB6F2")
    ax1.set_axisbelow(True)

    # 2. Donut Chart - Cost Allocation
    cogs_val = next((l.audited_actual for l in pnl_summary.lines if l.line_no == 7), 0.0)
    ads_val = next((l.audited_actual for l in pnl_summary.lines if l.line_no == 10), 0.0)
    opex_val = next((l.audited_actual for l in pnl_summary.lines if l.line_no == 11), 0.0)
    loss_val = next((l.audited_actual for l in pnl_summary.lines if l.line_no == 8), 0.0)

    cost_labels = ["Giá vốn COGS", "Chi phí Ads", "Vận hành OpEx", "Hao hụt hoàn"]
    cost_vals = [max(0.0, v) for v in [cogs_val, ads_val, opex_val, loss_val]]
    if sum(cost_vals) == 0:
        cost_vals = [1.0, 1.0, 1.0, 1.0]

    wedges, texts, autotexts = ax2.pie(
        cost_vals,
        labels=None,
        autopct="%1.0f%%",
        colors=["#8F60BF", "#079DD9", "#BEB6F2", "#ECD8F2"],
        startangle=140,
        pctdistance=0.75,
        wedgeprops=dict(width=0.42, edgecolor="white", linewidth=1.2),
    )
    for at in autotexts:
        at.set_fontsize(7.0)
        at.set_weight("bold")
    ax2.legend(wedges, cost_labels, loc="center left", bbox_to_anchor=(0.92, 0.5), fontsize=6.0, frameon=False)
    ax2.set_title("Cơ Cấu Phân Bổ Chi Phí", fontsize=8.0, fontweight="bold", color="#4D2678")

    plt.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", dpi=180)
    plt.close(fig)
    buf.seek(0)
    return buf


def generate_pdf_report(run_info: RunInfo, pnl_summary: PnLSummary) -> bytes:
    """Tạo tệp PDF A4 báo cáo kiểm toán điều hành 2 trang chuẩn dành cho Ban Giám Đốc."""
    setup_pdf_fonts()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=30,
        bottomMargin=30,
    )

    styles = getSampleStyleSheet()

    # Định nghĩa các style tiếng Việt
    title_style = ParagraphStyle(
        "VNTitle",
        fontName="DejaVuSans-Bold",
        fontSize=13.5,
        leading=16.5,
        textColor=colors.HexColor("#4D2678"),
        alignment=1,  # Center
    )

    subtitle_style = ParagraphStyle(
        "VNSubtitle",
        fontName="DejaVuSans",
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#5C5570"),
        alignment=1,
    )

    h2_style = ParagraphStyle(
        "VNH2",
        fontName="DejaVuSans-Bold",
        fontSize=9.5,
        leading=12.5,
        textColor=colors.HexColor("#8F60BF"),
        spaceBefore=6,
        spaceAfter=3,
    )

    body_style = ParagraphStyle(
        "VNBody",
        fontName="DejaVuSans",
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#1E1B2E"),
    )

    callout_style = ParagraphStyle(
        "VNCallout",
        fontName="DejaVuSans",
        fontSize=7.2,
        leading=9.5,
        textColor=colors.HexColor("#4D2678"),
    )

    cell_header = ParagraphStyle(
        "VNCellHeader",
        fontName="DejaVuSans-Bold",
        fontSize=7.5,
        leading=9,
        textColor=colors.white,
        alignment=1,
    )

    cell_body = ParagraphStyle(
        "VNCellBody",
        fontName="DejaVuSans",
        fontSize=7,
        leading=8.5,
        textColor=colors.HexColor("#1E1B2E"),
    )

    cell_num = ParagraphStyle(
        "VNCellNum",
        fontName="DejaVuSans",
        fontSize=7,
        leading=8.5,
        textColor=colors.HexColor("#1E1B2E"),
        alignment=2,  # Right
    )

    cell_num_bold = ParagraphStyle(
        "VNCellNumBold",
        fontName="DejaVuSans-Bold",
        fontSize=7,
        leading=8.5,
        textColor=colors.HexColor("#8F60BF"),
        alignment=2,
    )

    elements = []

    # ==========================================================
    # TRANG 1: TIÊU ĐỀ, KPI, BẢNG P&L 12 DÒNG & RANK SHIFT
    # ==========================================================
    elements.append(Paragraph("VITARA DATA PLATFORM - ENTERPRISE DECISION SYSTEM", subtitle_style))
    elements.append(Spacer(1, 2))
    elements.append(Paragraph("BÁO CÁO KIỂM TOÁN TÀI CHÍNH & TỐI ƯU HÓA P&L DOANH NGHIỆP", title_style))
    elements.append(Spacer(1, 2))

    company = run_info.company_name or "Công ty Cổ phần Gia dụng Gia Hòa"
    code = f"AUDIT-{run_info.id[:8].upper()}"
    elements.append(
        Paragraph(
            f"Đơn vị: <b>{company}</b> &nbsp;|&nbsp; Mã xác thực: <b>{code}</b> &nbsp;|&nbsp; Quy mô: <b>{run_info.total_rows:,} mẫu đối soát</b>",
            subtitle_style,
        )
    )
    elements.append(Spacer(1, 4))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#BEB6F2"), spaceAfter=6))

    # Khối tổng quan chỉ số điều hành
    leakage = pnl_summary.total_gross - pnl_summary.total_net_audited
    kpi_data = [
        [
            Paragraph("<b>TỔNG DOANH THU GỘP</b>", cell_header),
            Paragraph("<b>DOANH THU THỰC NHẬN</b>", cell_header),
            Paragraph("<b>THÂM HỤT & RÒ RỈ DÒNG TIỀN</b>", cell_header),
            Paragraph("<b>LỢI NHUẬN RÒNG THỰC TẾ</b>", cell_header),
        ],
        [
            Paragraph(format_currency(pnl_summary.total_gross), cell_num_bold),
            Paragraph(format_currency(pnl_summary.total_net_audited), cell_num_bold),
            Paragraph(format_currency(leakage), cell_num_bold),
            Paragraph(format_currency(pnl_summary.total_net_profit), cell_num_bold),
        ],
    ]
    t_kpi = Table(kpi_data, colWidths=[130, 130, 130, 130])
    t_kpi.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#8F60BF")),
                ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#FAF6FD")),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#ECD8F2")),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    elements.append(t_kpi)
    elements.append(Spacer(1, 6))

    # Bảng P&L 12 dòng
    elements.append(Paragraph("I. BẢNG ĐỐI SOÁT P&L 12 DÒNG (BÁO CÁO CŨ VS THỰC TẾ ĐỐI SOÁT)", h2_style))
    pnl_table_data = [
        [
            Paragraph("<b>Chỉ tiêu P&L</b>", cell_header),
            Paragraph("<b>Báo cáo cũ</b>", cell_header),
            Paragraph("<b>Thực tế sau đối soát</b>", cell_header),
            Paragraph("<b>Chênh lệch</b>", cell_header),
            Paragraph("<b>Ghi chú kiểm toán</b>", cell_header),
        ]
    ]

    for item in pnl_summary.lines:
        is_highlight = item.line_no in [6, 9, 12]
        style_n = cell_num_bold if is_highlight else cell_num
        style_c = cell_body
        pnl_table_data.append(
            [
                Paragraph(item.name, style_c),
                Paragraph(format_currency(item.old_reported), style_n),
                Paragraph(format_currency(item.audited_actual), style_n),
                Paragraph(f"{format_currency(item.variance)} ({item.variance_percent:+.1f}%)", style_n),
                Paragraph(item.note, style_c),
            ]
        )

    t_pnl = Table(pnl_table_data, colWidths=[160, 85, 95, 90, 90])
    t_pnl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4D2678")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#ECD8F2")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAF8FC")]),
                ("LINEBELOW", (0, 6), (-1, 6), 1.0, colors.HexColor("#8F60BF")),
                ("LINEBELOW", (0, 9), (-1, 9), 1.0, colors.HexColor("#8F60BF")),
                ("LINEBELOW", (0, 12), (-1, 12), 1.5, colors.HexColor("#4D2678")),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    elements.append(t_pnl)
    elements.append(Spacer(1, 6))

    # Bảng kênh & Rank shift
    elements.append(Paragraph("II. HIỆU QUẢ ĐÓNG GÓP THEO KÊNH BÁN & THỨ HẠNG THỰC TẾ (RANK SHIFT)", h2_style))
    chan_data = [
        [
            Paragraph("<b>Kênh bán hàng</b>", cell_header),
            Paragraph("<b>Doanh số gộp</b>", cell_header),
            Paragraph("<b>Thực thu đối soát</b>", cell_header),
            Paragraph("<b>Tỷ lệ hoàn</b>", cell_header),
            Paragraph("<b>Lợi nhuận ròng</b>", cell_header),
            Paragraph("<b>Hạng cũ</b>", cell_header),
            Paragraph("<b>Hạng mới</b>", cell_header),
            Paragraph("<b>Đánh giá</b>", cell_header),
        ]
    ]

    for ch in pnl_summary.channels:
        chan_data.append(
            [
                Paragraph(ch.channel, cell_body),
                Paragraph(format_currency(ch.gross_revenue), cell_num),
                Paragraph(format_currency(ch.audited_net), cell_num),
                Paragraph(f"{ch.return_rate:.1f}%", cell_num),
                Paragraph(format_currency(ch.contribution_profit), cell_num_bold),
                Paragraph(f"#{ch.rank_old}", cell_body),
                Paragraph(f"<b>#{ch.rank_new}</b>", cell_num_bold),
                Paragraph(ch.status, cell_body),
            ]
        )

    t_chan = Table(chan_data, colWidths=[95, 70, 75, 50, 75, 45, 45, 65])
    t_chan.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#8F60BF")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#ECD8F2")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAF8FC")]),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    elements.append(t_chan)

    # ==========================================================
    # TRANG 2: BIỂU ĐỒ TRỰC QUAN ĐỐI SOÁT & LỘ TRÌNH HÀNH ĐỘNG
    # ==========================================================
    elements.append(PageBreak())
    elements.append(Paragraph("III. BIỂU ĐỒ TRỰC QUAN ĐỐI SOÁT & PHÂN BỔ DÒNG TIỀN (VISUAL CHARTS)", h2_style))
    elements.append(
        Paragraph(
            "Phản ánh trực quan cơ cấu đóng góp lợi nhuận ròng theo kênh bán và mức độ xói mòn doanh thu do Voucher & Hoàn trả trễ chu kỳ.",
            subtitle_style,
        )
    )
    elements.append(Spacer(1, 4))

    # Biểu đồ 1: Lợi nhuận ròng theo kênh
    try:
        c1_buf = generate_channel_profit_chart(pnl_summary.channels)
        elements.append(Image(c1_buf, width=520, height=130))
        elements.append(Spacer(1, 2))
        c1_box = Table(
            [[
                Paragraph(
                    "• <b>Phân cực hiệu quả:</b> Kênh có lợi nhuận ròng vượt trội đóng góp dòng tiền dương bền vững cho chuỗi.<br/>"
                    "• <b>Tái phân bổ nguồn lực:</b> Cắt giảm ngân sách Ads &amp; chiết khấu từ các kênh âm sâu để tái cấp vốn vào các kênh có hiệu quả thực tế.",
                    callout_style,
                )
            ]],
            colWidths=[520],
        )
        c1_box.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FAF6FD")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#BEB6F2")),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        elements.append(c1_box)
        elements.append(Spacer(1, 6))
    except Exception as e:
        print("Lỗi tạo biểu đồ 1:", e)

    # Biểu đồ 2: Cơ cấu bào mòn doanh thu & Phân bổ chi phí
    try:
        c2_buf = generate_erosion_and_cost_charts(pnl_summary, pnl_summary.channels)
        elements.append(Image(c2_buf, width=520, height=135))
        elements.append(Spacer(1, 2))
        c2_box = Table(
            [[
                Paragraph(
                    "• <b>Cơ chế xói mòn:</b> Chiết khấu voucher khuyến mãi kết hợp cùng hao hụt bao bì hoàn trả làm suy giảm đáng kể biên lợi nhuận gộp toàn chuỗi.<br/>"
                    "• <b>Tối ưu định mức:</b> Khống chế trần chiết khấu đa tầng ≤ 10% doanh thu thuần; áp dụng cửa sổ kiểm toán 30 ngày chặn rò rỉ dòng tiền.",
                    callout_style,
                )
            ]],
            colWidths=[520],
        )
        c2_box.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FAF6FD")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#BEB6F2")),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        elements.append(c2_box)
        elements.append(Spacer(1, 8))
    except Exception as e:
        print("Lỗi tạo biểu đồ 2:", e)

    # IV. Lộ trình khuyến nghị & Chữ ký
    elements.append(Paragraph("IV. LỘ TRÌNH KHUYẾN NGHỊ BAN GIÁM ĐỐC (30 - 60 - 90 NGÀY)", h2_style))
    roadmap_text = """
    • <b>30 Ngày đầu:</b> Dừng ngay ngân sách các nhóm chiến dịch Flash Sale có tỷ lệ hoàn trễ vượt 20%. Áp dụng quy tắc đối soát chốt sổ 30 ngày thay vì đóng sổ sau ngày 7.<br/>
    • <b>60 Ngày tiếp theo:</b> Tái cơ cấu phân bổ ngân sách sang các kênh có dòng tiền dương thực tế (Showroom bán lẻ & Khai xuân Combo); siết chặt chính sách đổi trả hàng nguyên tem.<br/>
    • <b>90 Ngày hoàn thiện:</b> Đồng bộ dữ liệu ERP / POS tự động vào Vitara Platform, áp dụng mô hình gán công tiếp thị đa chạm (Data-driven Multi-touch Attribution).
    """
    elements.append(Paragraph(roadmap_text, body_style))
    elements.append(Spacer(1, 10))

    # Chữ ký phê duyệt
    sig_data = [
        [
            Paragraph("<b>ĐẠI DIỆN ĐỘI KIỂM TOÁN DỮ LIỆU</b><br/><i>(Lead Data Steward &amp; Senior BI)</i><br/><br/><br/><b>ĐÃ KÝ ĐIỆN TỬ</b>", subtitle_style),
            Paragraph("<b>BAN GIÁM ĐỐC CÔNG TY</b><br/><i>(Tổng Giám Đốc / Giám Đốc Tài Chính CFO)</i><br/><br/><br/><b>ĐÃ PHÊ DUYỆT &amp; CHỐT SỔ</b>", subtitle_style),
        ]
    ]
    t_sig = Table(sig_data, colWidths=[260, 260])
    t_sig.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(t_sig)

    doc.build(elements)
    return buffer.getvalue()


def generate_step5_executive_pdf(step5_data: dict) -> bytes:
    """Tạo báo cáo điều hành Bước 5 toàn diện chuẩn A4 sắc nét bằng ReportLab, nhúng 4 biểu đồ và P&L."""
    setup_pdf_fonts()
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=32,
        rightMargin=32,
        topMargin=32,
        bottomMargin=32,
    )

    import base64
    styles = getSampleStyleSheet()

    def get_style(name, font="DejaVuSans", size=9, leading=12, color=colors.HexColor("#1E1B2E"), bold=False):
        fn = "DejaVuSans-Bold" if bold else "DejaVuSans"
        return ParagraphStyle(name, fontName=fn, fontSize=size, leading=leading, textColor=color)

    title_style = get_style("DocTitle", size=15, leading=18, color=colors.HexColor("#4D2678"), bold=True)
    subtitle_style = get_style("DocSub", size=8.5, leading=11, color=colors.HexColor("#5C5570"))
    h2_style = get_style("H2", size=11, leading=14, color=colors.HexColor("#8F60BF"), bold=True)
    body_style = get_style("Body", size=8.5, leading=12, color=colors.HexColor("#1E1B2E"))
    callout_style = get_style("Callout", size=8, leading=11, color=colors.HexColor("#4D2678"))
    small_style = get_style("Small", size=7.5, leading=10, color=colors.HexColor("#5C5570"))

    elements = []

    # =========================================================================
    # TRANG 1: HEADER BANNER + 4 KPI CARDS + BIỂU ĐỒ 1 (BAR CHART)
    # =========================================================================
    dataset_title = step5_data.get("dataset_title", "Báo Cáo Tổng Kết & Phân Tích Điều Hành Ban Giám Đốc")
    header_data = [
        [
            Paragraph("<b>VITARA GROWTH AUDITOR</b><br/><font size=7 color='#5C5570'>Hệ Thống Kiểm Toán Dòng Tiền & Quản Trị Rủi Ro Đa Kênh</font>", body_style),
            Paragraph(f"<b>BÁO CÁO ĐIỀU HÀNH BƯỚC 5</b><br/><font size=7 color='#079DD9'>Dữ liệu thực tế: {dataset_title}</font>", get_style("HeadR", size=9, leading=12, color=colors.HexColor("#8F60BF"), bold=True)),
        ]
    ]
    t_head = Table(header_data, colWidths=[280, 250])
    t_head.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(t_head)
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#8F60BF"), spaceBefore=4, spaceAfter=10))

    # 4 Thẻ KPI điều hành
    kpis = step5_data.get("kpis", [])
    if kpis:
        kpi_cells = []
        for k in kpis[:4]:
            t = k.get("title", "Chỉ Số")
            v = k.get("value", "0 ₫")
            s = k.get("subtext", "")
            cell_p = Paragraph(f"<b><font size=7.5 color='#5C5570'>{t.upper()}</font></b><br/><font size=12 color='#8F60BF'><b>{v}</b></font><br/><font size=7 color='#5C5570'>{s}</font>", body_style)
            kpi_cells.append(cell_p)

        while len(kpi_cells) < 4:
            kpi_cells.append(Paragraph("", body_style))

        kpi_table = Table([[kpi_cells[0], kpi_cells[1], kpi_cells[2], kpi_cells[3]]], colWidths=[132, 132, 132, 132])
        kpi_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FAF8FC")),
            ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#ECD8F2")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#ECD8F2")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(kpi_table)
        elements.append(Spacer(1, 12))

    # Biểu đồ 1: Bar Chart
    charts = step5_data.get("charts", [])
    c1 = next((c for c in charts if c.get("id") == "chart_1"), None) or (charts[0] if charts else None)
    if c1 and "image_base64" in c1:
        elements.append(Paragraph(f"<b>I. {c1.get('title', 'Biểu Đồ Cột So Sánh Doanh Thu & Lợi Nhuận')}</b>", h2_style))
        elements.append(Spacer(1, 4))
        try:
            raw_b64 = c1["image_base64"].split(",", 1)[1] if "," in c1["image_base64"] else c1["image_base64"]
            img_data = base64.b64decode(raw_b64)
            img_buf = io.BytesIO(img_data)
            img_flow = Image(img_buf, width=530, height=225)
            elements.append(img_flow)
            elements.append(Spacer(1, 4))
        except Exception as e:
            logger.warning(f"Lỗi nhúng biểu đồ 1 vào PDF: {e}")

        c1_box = Table(
            [[
                Paragraph(
                    f"• <b>Quy luật dữ liệu:</b> {c1.get('trend_observation', '')}<br/>"
                    f"• <b>Chỉ đạo điều hành:</b> {c1.get('actionable_directive', '')}",
                    callout_style
                )
            ]],
            colWidths=[530]
        )
        c1_box.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FAF6FD")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#BEB6F2")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(c1_box)

    elements.append(PageBreak())

    # =========================================================================
    # TRANG 2: BIỂU ĐỒ 2 (DONUT) + BIỂU ĐỒ 3 (TIME SERIES)
    # =========================================================================
    elements.append(Paragraph("<b>II. PHÂN TÍCH CƠ CẤU DANH MỤC & XU HƯỚNG CHUỖI THỜI GIAN</b>", h2_style))
    elements.append(Spacer(1, 6))

    c2 = next((c for c in charts if c.get("id") == "chart_2"), None)
    if c2 and "image_base64" in c2:
        try:
            raw_b64 = c2["image_base64"].split(",", 1)[1] if "," in c2["image_base64"] else c2["image_base64"]
            img_data = base64.b64decode(raw_b64)
            img_buf = io.BytesIO(img_data)
            elements.append(Paragraph(f"<b>2. {c2.get('title', 'Cơ Cấu Tỷ Trọng Danh Mục')}</b>", get_style("H3", size=9.5, leading=12, color=colors.HexColor("#1E1B2E"), bold=True)))
            elements.append(Image(img_buf, width=530, height=210))
            elements.append(Spacer(1, 4))
            c2_box = Table([[Paragraph(f"• <b>Nhận xét:</b> {c2.get('trend_observation', '')}", small_style)]], colWidths=[530])
            c2_box.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FAF8FC")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#ECD8F2")),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]))
            elements.append(c2_box)
            elements.append(Spacer(1, 10))
        except Exception as e:
            logger.warning(f"Lỗi nhúng biểu đồ 2 vào PDF: {e}")

    c3 = next((c for c in charts if c.get("id") == "chart_3"), None)
    if c3 and "image_base64" in c3:
        try:
            raw_b64 = c3["image_base64"].split(",", 1)[1] if "," in c3["image_base64"] else c3["image_base64"]
            img_data = base64.b64decode(raw_b64)
            img_buf = io.BytesIO(img_data)
            elements.append(Paragraph(f"<b>3. {c3.get('title', 'Xu Hướng Chuỗi Thời Gian')}</b>", get_style("H3", size=9.5, leading=12, color=colors.HexColor("#1E1B2E"), bold=True)))
            elements.append(Image(img_buf, width=530, height=210))
            elements.append(Spacer(1, 4))
            c3_box = Table([[Paragraph(f"• <b>Chỉ đạo:</b> {c3.get('actionable_directive', '')}", small_style)]], colWidths=[530])
            c3_box.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FAF8FC")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#ECD8F2")),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]))
            elements.append(c3_box)
        except Exception as e:
            logger.warning(f"Lỗi nhúng biểu đồ 3 vào PDF: {e}")

    elements.append(PageBreak())

    # =========================================================================
    # TRANG 3: BIỂU ĐỒ 4 (MA TRẬN RỦI RO) + 4 BIỆN PHÁP XỬ LÝ TRỌNG YẾU
    # =========================================================================
    elements.append(Paragraph("<b>III. MA TRẬN ĐÁNH GIÁ RỦI RO & ĐỀ XUẤT XỬ LÝ TRỌNG YẾU</b>", h2_style))
    elements.append(Spacer(1, 6))

    c4 = next((c for c in charts if c.get("id") == "chart_4"), None)
    if c4 and "image_base64" in c4:
        try:
            raw_b64 = c4["image_base64"].split(",", 1)[1] if "," in c4["image_base64"] else c4["image_base64"]
            img_data = base64.b64decode(raw_b64)
            img_buf = io.BytesIO(img_data)
            elements.append(Image(img_buf, width=530, height=215))
            elements.append(Spacer(1, 4))
            c4_box = Table([[Paragraph(f"• <b>Phán quyết rủi ro:</b> {c4.get('trend_observation', '')}", small_style)]], colWidths=[530])
            c4_box.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FDEEED")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#FCA5A5")),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]))
            elements.append(c4_box)
            elements.append(Spacer(1, 10))
        except Exception as e:
            logger.warning(f"Lỗi nhúng biểu đồ 4 vào PDF: {e}")

    # 4 Biện pháp xử lý trọng yếu
    actions = step5_data.get("corrective_actions", [])
    if actions:
        elements.append(Paragraph("<b>4 BIỆN PHÁP HÀNH ĐỘNG CẤP BÁCH BAN GIÁM ĐỐC:</b>", get_style("H3", size=9.5, leading=12, color=colors.HexColor("#4D2678"), bold=True)))
        elements.append(Spacer(1, 4))
        action_rows = []
        for a in actions[:4]:
            t = a.get("title", "")
            s = a.get("summary", "")
            dets = "<br/>".join([f"  - {d}" for d in a.get("details", [])[:2]])
            action_rows.append([
                Paragraph(f"<b><font color='#8F60BF'>{t}</font></b><br/>{s}<br/>{dets}", body_style)
            ])
        t_actions = Table(action_rows, colWidths=[530])
        t_actions.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FAF8FC")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#ECD8F2")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#ECD8F2")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(t_actions)

    elements.append(PageBreak())

    # =========================================================================
    # TRANG 4: BẢNG SỔ CÁI P&L + LỘ TRÌNH 30-60-90 + CHỮ KÝ ĐIỆN TỬ HITL-2
    # =========================================================================
    elements.append(Paragraph("<b>IV. SỔ CÁI QUẢN TRỊ P&L, LỘ TRÌNH & PHÊ DUYỆT ĐIỀU HÀNH</b>", h2_style))
    elements.append(Spacer(1, 6))

    # Bảng P&L
    f_tbl = step5_data.get("financial_table", {})
    if f_tbl and "columns" in f_tbl and "rows" in f_tbl:
        tbl_headers = [Paragraph(f"<b>{c}</b>", get_style("TH", size=7.5, leading=9, color=colors.HexColor("#4D2678"), bold=True)) for c in f_tbl["columns"]]
        tbl_data = [tbl_headers]
        for r in f_tbl["rows"][:8]:
            r_name = Paragraph(f"<b>{r.get('name', '')}</b>" if r.get("is_highlight") else r.get("name", ""), small_style)
            r_vals = [Paragraph(str(v), small_style) for v in r.get("values", [])]
            tbl_data.append([r_name] + r_vals)

        col_w = [140] + [int(390 / max(1, len(f_tbl["columns"]) - 1))] * (len(f_tbl["columns"]) - 1)
        pnl_tbl = Table(tbl_data, colWidths=col_w)
        pnl_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#FAF6FD")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#BEB6F2")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#ECD8F2")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ]))
        elements.append(pnl_tbl)
        elements.append(Spacer(1, 10))

    # Lộ trình 30-60-90 ngày
    elements.append(Paragraph("<b>LỘ TRÌNH TRIỂN KHAI 30 - 60 - 90 NGÀY:</b>", get_style("H3", size=9, leading=11, color=colors.HexColor("#8F60BF"), bold=True)))
    roadmap = step5_data.get("roadmap_30_60_90", {})
    r_text = f"""
    • <b>Giai đoạn 1 (1–30 Ngày):</b> {roadmap.get('days_1_30', {}).get('title', '')} — {roadmap.get('days_1_30', {}).get('description', '')}<br/>
    • <b>Giai đoạn 2 (31–60 Ngày):</b> {roadmap.get('days_31_60', {}).get('title', '')} — {roadmap.get('days_31_60', {}).get('description', '')}<br/>
    • <b>Giai đoạn 3 (61–90 Ngày):</b> {roadmap.get('days_61_90', {}).get('title', '')} — {roadmap.get('days_61_90', {}).get('description', '')}
    """
    elements.append(Paragraph(r_text, small_style))
    elements.append(Spacer(1, 15))

    # Khối chữ ký số
    sig_data = [
        [
            Paragraph("<b>ĐẠI DIỆN ĐỘI NGŨ KIỂM TOÁN DỮ LIỆU</b><br/><i>(Lead Data Steward &amp; Lead AI Auditor)</i><br/><br/><br/><b>ĐÃ KÝ ĐIỆN TỬ VERIFIED</b>", subtitle_style),
            Paragraph("<b>BAN GIÁM ĐỐC &amp; HỘI ĐỒNG QUẢN TRỊ</b><br/><i>(Tổng Giám Đốc CEO / Giám Đốc Tài Chính CFO)</i><br/><br/><br/><b>ĐÃ PHÊ DUYỆT &amp; BAN HÀNH QUY CHẾ</b>", subtitle_style),
        ]
    ]
    t_sig = Table(sig_data, colWidths=[265, 265])
    t_sig.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEABOVE", (0, 0), (-1, 0), 0.5, colors.HexColor("#ECD8F2")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(t_sig)

    doc.build(elements)
    return buffer.getvalue()

