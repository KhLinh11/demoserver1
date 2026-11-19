"use client";

import React, { useState } from "react";
import { AttributionModel, ChannelMetric } from "@/types";
import { formatVND } from "@/lib/format";

interface Step4SimulationProps {
  channels: ChannelMetric[];
  attributionModel: AttributionModel;
  onModelChange: (model: AttributionModel) => void;
  returnFactor: number;
  onReturnFactorChange: (factor: number) => void;
  availableDimensions?: string[];
  activeDimension?: string;
  onDimensionChange?: (dim: string) => void;
  onProceedToStep5: () => void;
  onBackToStep3?: () => void;
  step4Data?: any;
  onRefreshStep4?: () => void;
  isRefreshingStep4?: boolean;
}

export function Step4Simulation({
  channels,
  attributionModel,
  onModelChange,
  returnFactor,
  onReturnFactorChange,
  availableDimensions = ["Kênh bán"],
  activeDimension = "Kênh bán",
  onDimensionChange,
  onProceedToStep5,
  onBackToStep3,
  step4Data,
  onRefreshStep4,
  isRefreshingStep4 = false,
}: Step4SimulationProps) {
  // What-If Sliders State
  const [cutPercent, setCutPercent] = useState<number>(100);
  const [returnReduction, setReturnReduction] = useState<number>(30);
  const [reinvestPercent, setReinvestPercent] = useState<number>(80);

  const worstChannel = channels.length > 0 ? channels[channels.length - 1] : null;
  const bestChannel = channels.length > 0 ? channels[0] : null;

  // Calculate dynamic projected net profit
  const baseNet = channels.reduce((s, c) => s + c.contribution_profit, 0);
  const worstLoss = worstChannel && worstChannel.contribution_profit < 0 ? Math.abs(worstChannel.contribution_profit) : 0;
  const totalReturns = channels.reduce((s, c) => s + (c.gross_revenue * (c.return_rate / 100)), 0);
  const bestProfit = bestChannel && bestChannel.contribution_profit > 0 ? bestChannel.contribution_profit : 10000000;

  const simulatedNet =
    baseNet +
    worstLoss * (cutPercent / 100) +
    totalReturns * 0.3 * (returnReduction / 100) +
    bestProfit * (reinvestPercent / 100) * 0.35;

  const isSimulatedPositive = simulatedNet >= 0;

  // Extract AI Dynamic Data if available
  const rootCauses = step4Data?.root_causes;
  const fiveWhys = step4Data?.five_whys;
  const auditEvidences = step4Data?.audit_evidences;
  const comparisonTable = step4Data?.comparison_table;
  const rankShiftTable = step4Data?.rank_shift_table;
  const datasetTitle = step4Data?.dataset_title || "Phân Tích Căn Nguyên & Bằng Chứng Kiểm Toán Thực Nghiệm";

  return (
    <div className="space-y-6">
      {/* AI Root Cause Top Bar */}
      <div className="p-4 rounded-2xl bg-[#FAF6FD] border border-[#ECD8F2] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <span className="px-2.5 py-1 rounded-lg bg-[#8F60BF] text-white text-[11px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-xs">
            <i className="fa-solid fa-brain text-[#99D9F2]" />
            <span>AI Root Cause Copilot</span>
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#1E1B2E]">
            {datasetTitle}
          </span>
        </div>
        <div>
          <button
            onClick={onRefreshStep4}
            disabled={isRefreshingStep4}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF8FC] border border-[#BEB6F2] text-[#8F60BF] text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <i className={`fa-solid fa-rotate text-[#079DD9] ${isRefreshingStep4 ? "fa-spin" : ""}`} />
            <span>AI Phân Tích Lại Bước 4</span>
          </button>
        </div>
      </div>

      {/* 3 NGUYÊN NHÂN CỐT LÕI (ROOT CAUSES) */}
      {rootCauses && rootCauses.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {rootCauses.map((c: any, idx: number) => {
            const causeNum = c.cause_number || idx + 1;
            const tagColor = (c.tag_color || "").toLowerCase();
            let borderClass = "border-[#ECD8F2]";
            let badgeClass = "bg-[#ECD8F2] text-[#8F60BF]";
            let textTagColor = "text-[#8F60BF]";
            let conclusionColor = "text-[#8F60BF]";

            if (tagColor === "red" || tagColor === "danger" || idx === 1) {
              borderClass = "border-[#BEB6F2]";
              badgeClass = "bg-[#FDEEED] text-[#D93848]";
              textTagColor = "text-[#8F60BF]";
              conclusionColor = "text-[#D93848]";
            } else if (tagColor === "blue" || tagColor === "cyan" || tagColor === "info" || idx === 2) {
              borderClass = "border-[#99D9F2]";
              badgeClass = "bg-[#EBF6FC] text-[#079DD9]";
              textTagColor = "text-[#079DD9]";
              conclusionColor = "text-[#079DD9]";
            }

            return (
              <div key={idx} className={`p-5 rounded-2xl bg-white border ${borderClass} shadow-sm space-y-2.5`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold ${textTagColor} uppercase`}>
                    NGUYÊN NHÂN {causeNum}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}>
                    {c.tag || "CỐT LÕI"}
                  </span>
                </div>
                <h5 className="text-sm sm:text-base font-extrabold text-[#1E1B2E]">
                  {c.title}
                </h5>
                <div className="p-3 rounded-xl bg-[#FAF6FD] border border-[#ECD8F2] space-y-1 text-xs font-mono">
                  {(c.metrics || []).map((m: any, mIdx: number) => (
                    <div key={mIdx} className="flex justify-between text-[#5C5570]">
                      <span>{m.label}:</span>
                      <strong className="text-[#1E1B2E]">{m.value}</strong>
                    </div>
                  ))}
                  {c.conclusion && (
                    <div className={`text-[11px] font-bold ${conclusionColor} pt-1 border-t border-[#ECD8F2]`}>
                      {c.conclusion}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Fallback khi chưa có dữ liệu AI */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8F60BF] uppercase">NGUYÊN NHÂN 1</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ECD8F2] text-[#8F60BF]">BẪY CHIẾT KHẤU</span>
            </div>
            <h5 className="text-sm sm:text-base font-extrabold text-[#1E1B2E]">Khuyến Mãi Quá Đạt Trần</h5>
            <div className="p-3 rounded-xl bg-[#FAF6FD] border border-[#ECD8F2] space-y-1 text-xs font-mono">
              <div className="flex justify-between text-[#5C5570]"><span>Voucher vượt trần:</span><strong className="text-[#8F60BF]">-33.32M ₫</strong></div>
              <div className="text-[11px] font-bold text-[#8F60BF] pt-1 border-t border-[#ECD8F2]">&rarr; Biên gộp không bù nổi chi phí bán lẻ</div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-[#BEB6F2] shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8F60BF] uppercase">NGUYÊN NHÂN 2</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FDEEED] text-[#D93848]">BẪY HOÀN HÀNG</span>
            </div>
            <h5 className="text-sm sm:text-base font-extrabold text-[#1E1B2E]">Hoàn Hàng Sau Đối Soát</h5>
            <div className="p-3 rounded-xl bg-[#FAF6FD] border border-[#ECD8F2] space-y-1 text-xs font-mono">
              <div className="flex justify-between text-[#5C5570]"><span>Tỷ lệ hoàn trễ:</span><strong className="text-[#D93848]">19.3%</strong></div>
              <div className="text-[11px] font-bold text-[#D93848] pt-1 border-t border-[#ECD8F2]">&rarr; Chi phí đảo chiều nuốt sạch lãi</div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-[#99D9F2] shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#079DD9] uppercase">NGUYÊN NHÂN 3</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EBF6FC] text-[#079DD9]">BẪY TÍNH TRÙNG</span>
            </div>
            <h5 className="text-sm sm:text-base font-extrabold text-[#1E1B2E]">Trùng Lặp Đa Chạm Tiếp Thị</h5>
            <div className="p-3 rounded-xl bg-[#FAF6FD] border border-[#ECD8F2] space-y-1 text-xs font-mono">
              <div className="flex justify-between text-[#5C5570]"><span>Doanh thu ảo tính đè:</span><strong className="text-[#079DD9]">124.45M ₫</strong></div>
              <div className="text-[11px] font-bold text-[#079DD9] pt-1 border-t border-[#ECD8F2]">&rarr; Ghi nhận đè doanh thu tự nhiên</div>
            </div>
          </div>
        </div>
      )}

      {/* SƠ ĐỒ 5 TẦNG NGUYÊN NHÂN CỐT LÕI (5-WHYS DEEP DIVE) */}
      <div className="p-5 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#ECD8F2]">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-[#1E1B2E] uppercase tracking-wide flex items-center space-x-2">
              <i className="fa-solid fa-sitemap text-[#8F60BF]" />
              <span>Mô Hình 5-Whys: Bóc Tách Từ Hiện Tượng Đến Bản Chất Quản Trị</span>
            </h4>
            <p className="text-xs text-[#5C5570] mt-0.5">
              Truy xuất chuỗi nguyên nhân khiến doanh thu báo cáo tăng nhưng giá trị thực nhận bị sụt giảm.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-[#FAF6FD] text-[#8F60BF] px-3 py-1 rounded-lg border border-[#ECD8F2]">
            5-WHYS DEEP DIVE
          </span>
        </div>

        {fiveWhys && fiveWhys.length > 0 ? (
          <div className="space-y-3 text-xs">
            {fiveWhys.map((w: any, idx: number) => {
              const whyColors = [
                { badge: "bg-[#ECD8F2] text-[#8F60BF]", bg: "bg-[#FAF6FD]", border: "border-[#ECD8F2]" },
                { badge: "bg-[#BEB6F2]/30 text-[#8F60BF]", bg: "bg-[#FAF8FC]", border: "border-[#ECD8F2]" },
                { badge: "bg-[#EBF6FC] text-[#079DD9]", bg: "bg-[#FAF6FD]", border: "border-[#ECD8F2]" },
                { badge: "bg-[#EBF6FC] text-[#079DD9]", bg: "bg-[#FAF8FC]", border: "border-[#ECD8F2]" },
                { badge: "bg-[#8F60BF] text-white", bg: "bg-gradient-to-r from-[#FAF6FD] to-[#EBF6FC]", border: "border-2 border-[#8F60BF] shadow-xs" },
              ];
              const cfg = whyColors[idx] || whyColors[whyColors.length - 1];
              const isLast = idx === fiveWhys.length - 1;

              return (
                <div key={idx} className={`p-3.5 rounded-xl ${cfg.bg} border ${cfg.border} flex items-start space-x-3`}>
                  <span className={`px-2.5 py-1 rounded-lg ${cfg.badge} font-mono font-bold text-[11px] flex-shrink-0`}>
                    {w.level || `WHY ${idx + 1}`}
                  </span>
                  <div>
                    <strong className={isLast ? "text-[#8F60BF] text-xs" : "text-[#1E1B2E] text-xs"}>
                      {w.question}
                    </strong>
                    <p className={isLast ? "text-[#1E1B2E] font-medium mt-0.5" : "text-[#5C5570] mt-0.5"}>
                      {w.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-[#5C5570] bg-[#FAF8FC] rounded-xl border border-[#ECD8F2]">
            Đang phân tích 5-Whys cho tệp dữ liệu...
          </div>
        )}
      </div>

      {/* BẢNG BẰNG CHỨNG ĐỐI SOÁT KIỂM TOÁN THỰC NGHIỆM (AUDIT EVIDENCE LEDGER) */}
      {auditEvidences && auditEvidences.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#ECD8F2]">
            <div>
              <h4 className="text-sm sm:text-base font-bold text-[#1E1B2E] uppercase tracking-wide flex items-center space-x-2">
                <i className="fa-solid fa-receipt text-[#079DD9]" />
                <span>Bảng Bằng Chứng Đối Soát Kiểm Toán Thực Nghiệm (Audit Evidence Ledger)</span>
              </h4>
              <p className="text-xs text-[#5C5570] mt-0.5">
                Các bằng chứng cụ thể trích xuất trực tiếp từ sổ dữ liệu giao dịch minh chứng cho tổn thất dòng tiền.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-[#EBF6FC] text-[#079DD9] px-3 py-1 rounded-lg border border-[#99D9F2]/50 self-start sm:self-auto">
              EVIDENCE VERIFIED
            </span>
          </div>

          <div className="overflow-x-auto border border-[#ECD8F2] rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF8FC] text-[#5C5570] border-b border-[#ECD8F2] font-mono uppercase text-[11px]">
                  <th className="p-3">Mã Bằng Chứng</th>
                  <th className="p-3">Nhóm Vi Phạm / Rủi Ro</th>
                  <th className="p-3">Số Liệu Thực Chứng &amp; Chứng Từ</th>
                  <th className="p-3 text-right">Tác Động Thâm Hụt</th>
                  <th className="p-3 text-center">Phán Quyết Quản Trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECD8F2]">
                {auditEvidences.map((ev: any, idx: number) => {
                  const vType = (ev.verdict_type || "").toLowerCase();
                  let badgeClass = "bg-[#ECD8F2] text-[#8F60BF]";
                  let codeColor = "text-[#8F60BF]";
                  let impactColor = "text-[#8F60BF]";

                  if (vType === "danger" || vType === "red") {
                    badgeClass = "bg-[#FDEEED] text-[#D93848]";
                    impactColor = "text-[#D93848]";
                  } else if (vType === "blue" || vType === "cyan" || vType === "info") {
                    badgeClass = "bg-[#EBF6FC] text-[#079DD9]";
                    codeColor = "text-[#079DD9]";
                    impactColor = "text-[#079DD9]";
                  } else if (vType === "warning" || vType === "amber") {
                    badgeClass = "bg-amber-100 text-amber-800";
                    impactColor = "text-amber-800";
                  } else if (vType === "neutral" || vType === "gray") {
                    badgeClass = "bg-[#FAF6FD] text-[#5C5570] border border-[#ECD8F2]";
                    codeColor = "text-[#5C5570]";
                    impactColor = "text-[#5C5570]";
                  }

                  return (
                    <tr key={idx} className="hover:bg-[#FAF8FC] transition">
                      <td className={`p-3 font-mono font-bold ${codeColor}`}>
                        {ev.code || `EV-${idx + 1}`}
                      </td>
                      <td className="p-3 font-semibold text-[#1E1B2E]">
                        {ev.risk_group || "-"}
                      </td>
                      <td className="p-3 text-[#5C5570] font-sans">
                        {ev.evidence_detail || "-"}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${impactColor}`}>
                        {ev.financial_impact || "-"}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${badgeClass}`}>
                          {ev.verdict || "KIỂM TOÁN"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MA TRẬN SO SÁNH / KIỂM ĐỊNH ĐỘ NHẠY (COMPARISON / SENSITIVITY MATRIX) */}
      {comparisonTable && comparisonTable.columns && (
        <div className="p-5 rounded-2xl bg-[#FAF6FD] border border-[#ECD8F2] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#ECD8F2]">
            <span className="text-xs sm:text-sm font-bold text-[#1E1B2E] uppercase">
              {comparisonTable.title || "Ma Trận So Sánh Kiểm Định Độ Nhạy"}
            </span>
            <span className="text-[11px] font-mono text-[#079DD9] font-bold">
              {comparisonTable.badge || "SENSITIVITY MATRIX"}
            </span>
          </div>

          <div className="overflow-x-auto border border-[#ECD8F2] rounded-xl bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF8FC] text-[#5C5570] border-b border-[#ECD8F2] font-mono uppercase text-[11px]">
                  {comparisonTable.columns.map((c: string, cIdx: number) => {
                    const align = cIdx === 0 ? "text-left" : cIdx === comparisonTable.columns.length - 1 ? "text-center" : "text-right";
                    return (
                      <th key={cIdx} className={`p-3 ${align}`}>
                        {c}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECD8F2] font-mono">
                {(comparisonTable.rows || []).map((r: any, rIdx: number) => {
                  const cType = (r.conclusion_type || "").toLowerCase();
                  let badgeClass = "bg-[#ECD8F2] text-[#8F60BF]";
                  if (cType === "danger" || cType === "red") badgeClass = "bg-[#FDEEED] text-[#D93848]";
                  else if (cType === "warning" || cType === "amber") badgeClass = "bg-amber-100 text-amber-800";
                  else if (cType === "safe" || cType === "green") badgeClass = "bg-[#EBF6FC] text-[#079DD9]";
                  else if (cType === "neutral") badgeClass = "bg-[#FAF6FD] text-[#5C5570] border border-[#ECD8F2]";

                  return (
                    <tr key={rIdx} className="hover:bg-[#FAF8FC]">
                      <td className="p-3 font-semibold font-sans text-[#1E1B2E]">
                        {r.target}
                      </td>
                      {(r.values || []).map((v: string, vIdx: number) => (
                        <td key={vIdx} className="p-3 text-right text-[#1E1B2E]">
                          {v}
                        </td>
                      ))}
                      <td className="p-3 text-center font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}>
                          {r.conclusion}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BẢNG DỊCH CHUYỂN THỨ HẠNG HIỆU QUẢ THỰC TẾ (RANK SHIFT ANALYSIS) */}
      <div className="p-5 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#ECD8F2]">
          <div>
            <span className="text-sm font-bold text-[#1E1B2E] uppercase">
              {rankShiftTable?.title || "Bảng Dịch Chuyển Thứ Hạng Hiệu Quả Thực Tế (Rank Shift Analysis)"}
            </span>
            <p className="text-xs text-[#5C5570]">
              {rankShiftTable?.subtitle || "So sánh thứ hạng quy mô ban đầu với hiệu quả thực tế sau kiểm toán."}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#8F60BF] bg-[#FAF6FD] px-3 py-1 rounded-lg border border-[#ECD8F2] self-start sm:self-auto">
            {rankShiftTable?.rule_badge || "Rule: Audited Value Performance"}
          </span>
        </div>

        {rankShiftTable && rankShiftTable.rows && rankShiftTable.rows.length > 0 ? (
          <div className="overflow-x-auto border border-[#ECD8F2] rounded-xl shadow-xs">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-[#FAF8FC] text-[#5C5570] border-b border-[#ECD8F2] font-mono text-[11px]">
                  {(rankShiftTable.columns || ["Đối Tượng", "Hạng Ban Đầu", "Hạng Thực Tế", "Dịch Chuyển", "Chỉ Số Cốt Lõi", "Khuyến Nghị Quản Trị"]).map((col: string, cIdx: number) => {
                    const align = cIdx === 0 ? "text-left" : cIdx === 4 ? "text-right" : "text-center";
                    return (
                      <th key={cIdx} className={`p-3 ${align}`}>
                        {col}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECD8F2]">
                {rankShiftTable.rows.map((r: any, rIdx: number) => {
                  const dir = (r.shift_direction || "").toLowerCase();
                  let shiftColor = "text-[#5C5570]";
                  if (dir === "up" || dir === "tang") shiftColor = "text-[#079DD9]";
                  else if (dir === "down" || dir === "tut") shiftColor = "text-[#8F60BF]";

                  const rec = r.recommendation || "";
                  let recBadgeClass = "bg-white text-[#5C5570] border border-[#ECD8F2]";
                  if (rec.includes("DỪNG") || rec.includes("KHẨN CẤP") || rec.includes("CẮT") || rec.includes("STOP")) {
                    recBadgeClass = "bg-[#ECD8F2] text-[#8F60BF]";
                  } else if (rec.includes("MỞ RỘNG") || rec.includes("TỐI ƯU") || rec.includes("EXPAND")) {
                    recBadgeClass = "bg-[#EBF6FC] text-[#079DD9]";
                  }

                  return (
                    <tr key={rIdx} className="hover:bg-[#FAF8FC] transition">
                      <td className="p-3.5 font-semibold text-[#1E1B2E]">{r.name}</td>
                      <td className="p-3.5 text-center font-mono font-medium text-[#5C5570]">{r.rank_old || "-"}</td>
                      <td className="p-3.5 text-center font-mono font-bold text-[#8F60BF]">{r.rank_new || "-"}</td>
                      <td className={`p-3.5 text-center font-bold ${shiftColor}`}>{r.shift_label || "↔ Giữ nguyên"}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-[#1E1B2E]">{r.actual_metric || "-"}</td>
                      <td className="p-3.5 text-center font-sans">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${recBadgeClass}`}>
                          {rec}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Fallback bảng kênh bán lẻ nếu không có dữ liệu rank shift động */
          <div className="overflow-x-auto rounded-xl border border-[#ECD8F2]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF8FC] text-[#5C5570] font-semibold border-b border-[#ECD8F2]">
                <tr>
                  <th className="p-3">{activeDimension}</th>
                  <th className="p-3 text-center">Hạng DT Cũ</th>
                  <th className="p-3 text-center">Hạng Lãi Mới</th>
                  <th className="p-3 text-center">Biến Động Hạng</th>
                  <th className="p-3 text-right">Lợi Nhuận Thực Tế</th>
                  <th className="p-3 text-center">Khuyến Nghị Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECD8F2]">
                {channels.map((ch) => {
                  const shift = ch.rank_old - ch.rank_new;
                  const isLoss = ch.contribution_profit < 0;
                  let rec = "MAINTAIN (Duy trì)";
                  let recClass = "bg-white border border-[#ECD8F2] text-[#5C5570]";
                  if (isLoss) {
                    rec = "STOP (Cắt giảm)";
                    recClass = "bg-[#ECD8F2] text-[#8F60BF]";
                  } else if (shift > 0 || ch.rank_new === 1) {
                    rec = "EXPAND (Mở rộng)";
                    recClass = "bg-[#FAF6FD] text-[#079DD9] border border-[#079DD9]/30";
                  } else if (ch.return_rate > 15) {
                    rec = "ADJUST (Siết SLA)";
                    recClass = "bg-amber-100 text-amber-800";
                  }

                  return (
                    <tr key={ch.channel} className="hover:bg-[#FAF6FD] transition">
                      <td className="p-3 font-semibold text-[#1E1B2E]">{ch.channel}</td>
                      <td className="p-3 text-center font-mono font-medium text-[#5C5570]">#{ch.rank_old}</td>
                      <td className="p-3 text-center font-mono font-bold text-[#8F60BF]">#{ch.rank_new}</td>
                      <td className="p-3 text-center font-bold">
                        {shift > 0 ? (
                          <span className="text-[#079DD9]">&uarr; Tăng {shift} hạng</span>
                        ) : shift < 0 ? (
                          <span className="text-[#8F60BF]">&darr; Tụt {Math.abs(shift)} hạng</span>
                        ) : (
                          <span className="text-[#5C5570]">↔ Giữ nguyên</span>
                        )}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${isLoss ? "text-[#8F60BF]" : "text-[#079DD9]"}`}>
                        {formatVND(ch.contribution_profit)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${recClass}`}>
                          {rec}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {rankShiftTable?.summary_text && (
          <p className="text-xs text-[#5C5570] p-3 rounded-xl bg-[#FAF8FC] border border-[#ECD8F2]">
            <strong>Đánh giá kiểm toán &amp; điều hành:</strong> {rankShiftTable.summary_text}
          </p>
        )}
      </div>

      {/* WHAT-IF DECISION SIMULATOR */}
      <div className="p-6 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#ECD8F2] gap-2">
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-wand-magic-sparkles text-[#8F60BF]" />
            <h3 className="font-extrabold text-base text-[#1E1B2E]">
              Phòng Giả Lập Ra Quyết Định (What-If Simulator)
            </h3>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#5C5570]">Lợi nhuận dự báo sau điều chuyển:</span>
            <span
              className={`font-mono font-bold px-3 py-1.5 rounded-xl border text-sm ${
                isSimulatedPositive
                  ? "bg-[#FAF6FD] text-[#079DD9] border-[#079DD9]/30"
                  : "bg-[#ECD8F2] text-[#8F60BF] border-[#8F60BF]/30"
              }`}
            >
              {isSimulatedPositive ? "+" : "-"}
              {formatVND(Math.abs(simulatedNet))} ({isSimulatedPositive ? "DƯƠNG" : "ÂM"})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#FAF8FC] border border-[#ECD8F2] space-y-2">
            <div className="flex justify-between items-center font-semibold">
              <span className="text-[#1E1B2E] truncate">
                Cắt chi phí nhóm yếu nhất ({worstChannel?.channel || "rò rỉ"}):
              </span>
              <span className="font-mono text-[#8F60BF]">-{cutPercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={cutPercent}
              onChange={(e) => setCutPercent(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#ECD8F2] rounded accent-[#8F60BF]"
            />
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8FC] border border-[#ECD8F2] space-y-2">
            <div className="flex justify-between items-center font-semibold">
              <span className="text-[#1E1B2E]">Mục tiêu kéo giảm hoàn hàng:</span>
              <span className="font-mono text-[#1E1B2E]">-{returnReduction}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={returnReduction}
              onChange={(e) => setReturnReduction(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#ECD8F2] rounded accent-[#8F60BF]"
            />
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8FC] border border-[#ECD8F2] space-y-2">
            <div className="flex justify-between items-center font-semibold">
              <span className="text-[#1E1B2E] truncate">
                Tái cấp vốn sang nhóm sinh lời ({bestChannel?.channel || "hiệu quả"}):
              </span>
              <span className="font-mono text-[#079DD9]">+{reinvestPercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={reinvestPercent}
              onChange={(e) => setReinvestPercent(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#ECD8F2] rounded accent-[#079DD9]"
            />
          </div>
        </div>

      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[#ECD8F2]">
        {onBackToStep3 && (
          <button
            type="button"
            onClick={onBackToStep3}
            className="px-6 py-3 rounded-xl border border-[#ECD8F2] bg-white text-[#5C5570] text-sm font-bold hover:text-[#1E1B2E] transition flex items-center space-x-2 cursor-pointer"
          >
            <i className="fa-solid fa-arrow-left text-xs" />
            <span>Quay lại Bước 3</span>
          </button>
        )}
        <button
          onClick={onProceedToStep5}
          className="px-8 py-3.5 bg-[#8F60BF] hover:bg-[#7b4fa8] text-white rounded-xl text-sm font-bold transition flex items-center space-x-2 shadow-xs cursor-pointer ml-auto"
        >
          <span>Xem Báo Cáo P&amp;L Tổng Kết (Sang Bước 5)</span>
          <i className="fa-solid fa-arrow-right text-xs text-[#99D9F2]" />
        </button>
      </div>
    </div>
  );
}
