"use client";

import React from "react";
import { PnLSummary } from "@/types";
import { formatVND } from "@/lib/format";

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  totalRows: number;
  pnl: PnLSummary | null;
  onDownloadBackendPdf: () => void;
}

export function ExecutiveReportModal({
  isOpen,
  onClose,
  companyName,
  totalRows,
  pnl,
  onDownloadBackendPdf,
}: ExecutiveReportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        id="print-executive-container"
        className="bg-white rounded-2xl max-w-2xl w-full border border-[#ECD8F2] p-6 space-y-5 shadow-2xl my-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECD8F2] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="px-2.5 py-1 rounded-lg bg-[#8F60BF] text-white font-bold text-xs">
              VITARA
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E1B2E]">
                BÁO CÁO KIỂM TOÁN TÀI CHÍNH &amp; HIỆU QUẢ KINH DOANH
              </h3>
              <p className="text-[10px] text-[#5C5570]">
                {companyName} · Mã định danh:{" "}
                <span className="font-mono font-semibold text-[#8F60BF]">
                  AUDIT-EXEC-2026-GH08
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#5C5570] hover:text-[#1E1B2E] no-print text-sm p-1"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Executive Summary */}
        <div className="p-4 rounded-xl bg-[#FAF6FD] border border-[#ECD8F2] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8F60BF] uppercase tracking-wider">
              Tóm tắt điều hành (Executive Summary)
            </span>
            <span className="text-[11px] font-mono font-semibold bg-white text-[#4D2678] px-2.5 py-0.5 rounded-md border border-[#ECD8F2]">
              {totalRows.toLocaleString()} đơn đối soát (Tối đa 1.000 mẫu)
            </span>
          </div>
          <p className="text-xs text-[#1E1B2E] leading-relaxed">
            Hệ thống đối soát đã bóc tách toàn diện chu kỳ 30 ngày cho <strong>{companyName}</strong>. 
            Phát hiện tỷ lệ hoàn hàng trễ sau chiến dịch và nhận vơ doanh thu giữa các kênh gây thâm hụt 
            dòng tiền thực tế so với báo cáo ban đầu.
          </p>
        </div>

        {/* Comparison KPI Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-[#FAF8FC] rounded-xl border border-[#ECD8F2]">
            <span className="text-[10px] text-[#5C5570] uppercase font-bold block">
              Doanh Thu Thuần Danh Nghĩa
            </span>
            <span className="text-base font-extrabold font-mono text-[#1E1B2E]">
              {formatVND(pnl?.total_gross)}
            </span>
            <span className="text-[10px] text-[#5C5570] block">Con số Marketing báo cáo</span>
          </div>
          <div className="p-3 bg-[#FAF6FD] rounded-xl border border-[#8F60BF]/40">
            <span className="text-[10px] text-[#8F60BF] uppercase font-bold block">
              Dòng Tiền Thực Thu Sau Đối Soát
            </span>
            <span className="text-base font-extrabold font-mono text-[#8F60BF]">
              {formatVND(pnl?.total_net_audited)}
            </span>
            <span className="text-[10px] text-[#079DD9] font-semibold block">
              Đã trừ hoàn trễ 30d &amp; khử trùng đa chạm
            </span>
          </div>
        </div>

        {/* Strategic Recommendations */}
        <div className="p-3 bg-white rounded-xl border border-[#ECD8F2] text-xs space-y-1.5">
          <div className="font-bold text-[#1E1B2E] flex items-center space-x-1.5">
            <i className="fa-solid fa-triangle-exclamation text-amber-500" />
            <span>Khuyến nghị trọng yếu dành cho Ban Giám Đốc:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-[#5C5570] text-[11px]">
            <li>Dừng ngay kênh có tỷ lệ hoàn trễ vượt 20% và thâm hụt đóng góp âm.</li>
            <li>Tái phân bổ ngân sách sang Kênh Khách VIP và các chiến dịch có tỷ lệ hoàn thấp.</li>
            <li>Đóng sổ đối soát sau 30 ngày thay vì đóng sổ sau ngày thứ 7 của chiến dịch.</li>
          </ul>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#ECD8F2]">
          <span className="text-[11px] text-[#5C5570]">
            Xuất bản chuẩn hoá · Hỗ trợ in trình duyệt &amp; ReportLab PDF
          </span>
          <div className="flex items-center space-x-2 no-print">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-[#ECD8F2] text-xs font-bold text-[#5C5570] hover:text-[#1E1B2E]"
            >
              Đóng
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl border border-[#8F60BF] text-xs font-bold text-[#8F60BF] hover:bg-[#FAF6FD] transition flex items-center space-x-1.5 shadow-xs"
            >
              <i className="fa-solid fa-print" />
              <span>In / Lưu PDF Trình Duyệt</span>
            </button>
            <button
              onClick={onDownloadBackendPdf}
              className="px-4 py-1.5 rounded-xl bg-[#8F60BF] hover:bg-[#7b4fa8] text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <i className="fa-solid fa-file-pdf" />
              <span>Tải File PDF A4</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
