"use client";

import React, { useState } from "react";
import { ChannelMetric } from "@/types";
import { formatVND } from "@/lib/format";

interface Step3DiagnosisProps {
  channels: ChannelMetric[];
  availableDimensions?: string[];
  activeDimension?: string;
  onDimensionChange?: (dim: string) => void;
  onProceedToStep4: () => void;
  onBackToStep2?: () => void;
  diagnosisData?: any;
  onRefreshDiagnosis?: () => void;
  isRefreshing?: boolean;
  cleansingPlanData?: any;
}

function parseMarkdown(md: string) {
  if (!md) return null;

  const rawLines = md.split("\n");
  const lines: string[] = [];
  for (let l = 0; l < rawLines.length; l++) {
    const cur = rawLines[l].trim();
    if ((cur === "•" || cur === "-" || cur === "*") && l + 1 < rawLines.length) {
      lines.push(`${cur} ${rawLines[l + 1].trim()}`);
      l++;
    } else {
      lines.push(cur);
    }
  }

  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = (keyPrefix: number) => {
    if (!inTable) return;
    elements.push(
      <div key={`table-wrap-${keyPrefix}`} className="overflow-x-auto my-5 rounded-2xl border border-[#ECD8F2] shadow-sm bg-white">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-[#FAF8FC] text-[#5C5570] font-bold border-b border-[#ECD8F2]">
            <tr>
              {tableHeaders.map((h, i) => (
                <th
                  key={i}
                  className={`p-3.5 whitespace-nowrap ${
                    i === 0 ? "text-left" : i === tableHeaders.length - 1 ? "text-center" : "text-right"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECD8F2] font-mono text-[#1E1B2E]">
            {tableRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-[#FAF6FD] transition even:bg-[#FAF8FC]/40">
                {row.map((cell, cIdx) => {
                  const txt = cell.trim();
                  const upper = txt.toUpperCase();
                  const isRed =
                    upper.includes("BÁO ĐỘNG") ||
                    upper.includes("🔴") ||
                    upper.includes("RỦI RO CAO") ||
                    upper === "CAO" ||
                    upper.includes("CHẠM ĐÁY") ||
                    upper.includes("THÂM HỤT");
                  const isYellow =
                    upper.includes("CẢNH BÁO") ||
                    upper.includes("🟡") ||
                    upper === "TRUNG BÌNH" ||
                    upper.includes("SUY GIẢM") ||
                    upper.includes("THEO DÕI");
                  const isGreen =
                    upper.includes("AN TOÀN") ||
                    upper.includes("🟢") ||
                    upper.includes("KIỂM SOÁT TỐT") ||
                    upper === "THẤP" ||
                    upper === "TỐT";
                  const isGray = txt === "-" || txt === "—" || txt === "N/A" || upper.includes("MỚI KHỞI TẠO");

                  return (
                    <td
                      key={cIdx}
                      className={`p-3.5 whitespace-nowrap ${
                        cIdx === 0
                          ? "text-left font-sans font-bold text-[#1E1B2E]"
                          : isRed || isYellow || isGreen || isGray
                          ? "text-center font-sans"
                          : "text-right font-medium text-[#1E1B2E]"
                      }`}
                    >
                      {isRed ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]">
                          <span>🔴</span>
                          <span>{txt.replace(/^[🔴\s*]+/, "")}</span>
                        </span>
                      ) : isYellow ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]">
                          <span>🟡</span>
                          <span>{txt.replace(/^[🟡\s*]+/, "")}</span>
                        </span>
                      ) : isGreen ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#D1FAE5] text-[#059669] border border-[#6EE7B7]">
                          <span>🟢</span>
                          <span>{txt.replace(/^[🟢\s*]+/, "")}</span>
                        </span>
                      ) : isGray ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-[#718096] bg-[#EDF2F7]">
                          {txt === "-" || txt === "—" ? "—" : txt}
                        </span>
                      ) : (
                        <span dangerouslySetInnerHTML={{ __html: txt.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#1E1B2E]">$1</strong>') }} />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    inTable = false;
    tableHeaders = [];
    tableRows = [];
  };

  lines.forEach((line, idx) => {
    // 1. Table
    if (line.startsWith("|") && line.endsWith("|")) {
      const cells = line
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        return;
      }
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      return;
    } else {
      flushTable(idx);
    }

    if (!line) return;

    // 2. Major 4 Executive Sections (1. / 2. / 3. / 4. or ## 1.)
    const sectionMatch =
      line.match(/^(?:##?\s*)?(?:[🎯📊🚨💡🔍📈]\s*)?([1-4])\.\s*(.*)/u) ||
      line.match(/^(?:##?\s*)?([1-4])\.\s*(.*)/);
    if (sectionMatch) {
      const sNum = sectionMatch[1];
      const sTitle = sectionMatch[2].replace(/\*\*(.*?)\*\*/g, "$1").trim();
      let icon = "🎯";
      let badgeStyle = "bg-[#FAF6FD] border-[#BEB6F2] text-[#8F60BF]";
      if (sNum === "1") {
        icon = "🎯";
        badgeStyle = "bg-[#FAF6FD] border-[#BEB6F2] text-[#8F60BF]";
      } else if (sNum === "2") {
        icon = "📊";
        badgeStyle = "bg-[#EBF6FC] border-[#99D9F2] text-[#079DD9]";
      } else if (sNum === "3") {
        icon = "🚨";
        badgeStyle = "bg-[#FDEEED] border-[#FCA5A5] text-[#D93848]";
      } else if (sNum === "4") {
        icon = "💡";
        badgeStyle = "bg-[#E6F8F3] border-[#70D7B8] text-[#1E7E62]";
      }

      elements.push(
        <div key={idx} className="mt-7 mb-3 pt-4 border-t border-[#ECD8F2] first:mt-0 first:pt-0 first:border-0">
          <div className="flex items-center space-x-3">
            <span className={`w-8 h-8 rounded-xl border flex items-center justify-center text-sm shadow-2xs font-black ${badgeStyle}`}>
              {icon}
            </span>
            <h2 className="text-base sm:text-lg font-black text-[#1E1B2E] tracking-tight">
              {sNum}. {sTitle}
            </h2>
          </div>
        </div>
      );
      return;
    }

    // 3. Subheadings
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={idx} className="text-base font-black text-[#1E1B2E] mt-5 mb-2 pb-1.5 border-b border-[#ECD8F2] flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8F60BF]" />
          <span>{line.slice(3).replace(/\*\*(.*?)\*\*/g, "$1")}</span>
        </h2>
      );
      return;
    }
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={idx} className="text-xs sm:text-sm font-bold text-[#8F60BF] mt-3.5 mb-1.5 flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#079DD9]" />
          <span>{line.slice(4).replace(/\*\*(.*?)\*\*/g, "$1")}</span>
        </h3>
      );
      return;
    }

    // 4. Blockquotes
    if (line.startsWith(">")) {
      const qText = line.slice(1).trim().replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
      if (qText.includes("⚠️") || qText.includes("Cảnh Báo") || qText.includes("Báo Động")) {
        elements.push(
          <div key={idx} className="p-4 my-3 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border-l-4 border-[#D93848] text-xs text-[#991B1B] font-medium leading-relaxed shadow-2xs flex items-start space-x-3">
            <i className="fa-solid fa-triangle-exclamation text-base text-[#D93848] shrink-0 mt-0.5" />
            <div dangerouslySetInnerHTML={{ __html: qText }} />
          </div>
        );
      } else if (qText.includes("💡") || qText.includes("Khuyến Nghị") || qText.includes("Đề Xuất")) {
        elements.push(
          <div key={idx} className="p-4 my-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-emerald-500 text-xs text-emerald-900 font-medium leading-relaxed shadow-2xs flex items-start space-x-3">
            <i className="fa-solid fa-lightbulb text-base text-emerald-600 shrink-0 mt-0.5" />
            <div dangerouslySetInnerHTML={{ __html: qText }} />
          </div>
        );
      } else {
        elements.push(
          <div key={idx} className="p-3.5 my-3 rounded-2xl bg-[#FAF6FD] border-l-4 border-[#8F60BF] text-xs text-[#1E1B2E] font-medium leading-relaxed shadow-2xs" dangerouslySetInnerHTML={{ __html: qText }} />
        );
      }
      return;
    }

    // 5. Divider
    if (line === "---" || line === "***" || line === "___") {
      elements.push(<div key={idx} className="my-5 border-b border-[#ECD8F2]" />);
      return;
    }

    // 6. Bullets
    if (/^[•\-\*\+]\s/.test(line)) {
      const itemClean = line.replace(/^[•\-\*\+]\s+/, "");
      const formatted = itemClean
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#1E1B2E] font-bold">$1</strong>')
        .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-[#FAF8FC] border border-[#ECD8F2] text-[#8F60BF] font-mono text-[11px]">$1</code>');
      elements.push(
        <div key={idx} className="flex items-start space-x-2.5 my-2 text-xs sm:text-sm text-[#4A5568] leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8F60BF] mt-2 shrink-0" />
          <div className="flex-1" dangerouslySetInnerHTML={{ __html: formatted }} />
        </div>
      );
      return;
    }

    // 7. Numbered items
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      const formatted = numMatch[2]
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#1E1B2E] font-bold">$1</strong>')
        .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-[#FAF8FC] border border-[#ECD8F2] text-[#8F60BF] font-mono text-[11px]">$1</code>');
      elements.push(
        <div key={idx} className="flex items-start space-x-2.5 my-2.5 text-xs sm:text-sm text-[#4A5568] leading-relaxed">
          <span className="w-5 h-5 rounded-md bg-[#FAF6FD] border border-[#BEB6F2] text-[#8F60BF] font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            {numMatch[1]}
          </span>
          <div className="flex-1" dangerouslySetInnerHTML={{ __html: formatted }} />
        </div>
      );
      return;
    }

    // 8. Footnotes / Notes (*Lưu ý: ...*)
    if (/^\*.*\*$/.test(line) || /^_.*_$/.test(line)) {
      const noteContent = line.replace(/^[\*_]|[\*_]$/g, "");
      elements.push(
        <p key={idx} className="text-[11px] text-[#718096] italic my-2 flex items-center space-x-1.5">
          <i className="fa-solid fa-circle-info text-[#079DD9]" />
          <span>{noteContent}</span>
        </p>
      );
      return;
    }

    // 9. Regular text
    const pText = line
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#1E1B2E] font-bold">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-[#FAF8FC] border border-[#ECD8F2] text-[#8F60BF] font-mono text-[11px]">$1</code>');
    elements.push(
      <p key={idx} className="text-xs sm:text-sm text-[#4A5568] leading-relaxed my-2" dangerouslySetInnerHTML={{ __html: pText }} />
    );
  });

  flushTable(lines.length + 1);
  return elements;
}

export function Step3Diagnosis({
  channels,
  availableDimensions = ["Kênh bán"],
  activeDimension = "Kênh bán",
  onDimensionChange,
  onProceedToStep4,
  onBackToStep2,
  diagnosisData,
  onRefreshDiagnosis,
  isRefreshing = false,
  cleansingPlanData,
}: Step3DiagnosisProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "table">("ai");
  const [tableSearch, setTableSearch] = useState<string>("");

  React.useEffect(() => {
    if ((!diagnosisData || !diagnosisData.markdown_report) && onRefreshDiagnosis && !isRefreshing) {
      onRefreshDiagnosis();
    }
  }, [diagnosisData, onRefreshDiagnosis, isRefreshing]);

  const sampleRows = cleansingPlanData?.cleaned_sample || [];
  const filteredSampleRows = tableSearch.trim()
    ? sampleRows.filter((r: any) =>
        (cleansingPlanData?.columns || []).some((c: string) =>
          String(r[c] || "").toLowerCase().includes(tableSearch.toLowerCase().trim()),
        ),
      )
    : sampleRows;

  const handleExportCsv = () => {
    if (!cleansingPlanData?.columns || !cleansingPlanData?.cleaned_sample) return;
    const cols = [...cleansingPlanData.columns, "Trạng Thái Audit", "Hành Động Chuẩn Hoá"];
    const csvContent =
      "\uFEFF" +
      [
        cols.join(","),
        ...cleansingPlanData.cleaned_sample.map((r: any) =>
          [
            ...cleansingPlanData.columns.map((c: string) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`),
            `"${r._audit_status || "ĐÃ CHUẨN HOÁ"}"`,
            `"${r._cleansing_action || "Bảo toàn"}"`,
          ].join(","),
        ),
      ].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Cleaned_${cleansingPlanData.filename || "Data"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const kpis = diagnosisData?.kpi_cards && diagnosisData.kpi_cards.length >= 3
    ? diagnosisData.kpi_cards
    : [
        {
          title: "Hoàn trả trễ ngoài 12 ngày",
          value: "72.57M ₫",
          subtext: "64.3% giá trị hoàn dồn sau ngày chốt sổ",
        },
        {
          title: "Xói mòn từ voucher",
          value: "84.52M ₫",
          subtext: "Chiết khấu thực tế vượt trần 26.2%",
        },
        {
          title: "Hao hụt xử lý kho",
          value: "15.72M ₫",
          subtext: "Phí đóng gói lại 15k & vỏ hộp",
        },
      ];

  const datasetTitle = diagnosisData?.dataset_title || "Báo Cáo Phân Tích Dữ Liệu & Chẩn Đoán Rủi Ro AI";

  return (
    <div className="space-y-6">
      {/* 3 Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.slice(0, 3).map((kpi: any, idx: number) => {
          const borders = ["border-[#BEB6F2]", "border-[#ECD8F2]", "border-[#99D9F2]"];
          const textColors = ["text-[#8F60BF]", "text-[#8F60BF]", "text-[#079DD9]"];
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl bg-white border ${borders[idx % 3]} shadow-sm transition hover:shadow-md`}
            >
              <div className="text-xs font-bold text-[#5C5570] uppercase tracking-wider flex items-center space-x-1.5">
                <i className={`fa-solid ${idx === 0 ? "fa-chart-line" : idx === 1 ? "fa-ticket" : "fa-warehouse"} ${textColors[idx % 3]}`} />
                <span>{kpi.title}</span>
              </div>
              <div className={`text-2xl sm:text-3xl font-extrabold font-mono ${textColors[idx % 3]} mt-1.5`}>
                {kpi.value}
              </div>
              <div className="text-xs text-[#5C5570] mt-1">{kpi.subtext}</div>
            </div>
          );
        })}
      </div>

      {/* Navigation Control Bar */}
      <div className="p-4 rounded-2xl bg-[#FAF6FD] border border-[#ECD8F2] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center space-x-2.5">
          <span className="px-2.5 py-1 rounded-lg bg-[#8F60BF] text-white text-[11px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-2xs">
            <i className="fa-solid fa-wand-magic-sparkles text-[#99D9F2]" />
            <span>AI Auditor</span>
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#1E1B2E]">{datasetTitle}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Switcher Tabs */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-[#ECD8F2] shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("ai")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "ai"
                  ? "bg-[#8F60BF] text-white shadow-2xs"
                  : "text-[#5C5570] hover:text-[#8F60BF]"
              }`}
            >
              <i className="fa-solid fa-file-waveform" />
              <span>Báo Cáo AI (Markdown)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "table"
                  ? "bg-[#8F60BF] text-white shadow-2xs"
                  : "text-[#5C5570] hover:text-[#8F60BF]"
              }`}
            >
              <i className="fa-solid fa-table" />
              <span>Bảng Số Liệu Chi Tiết</span>
            </button>
          </div>

          {/* Re-analyze Button */}
          {onRefreshDiagnosis && (
            <button
              type="button"
              onClick={onRefreshDiagnosis}
              disabled={isRefreshing}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF8FC] border border-[#BEB6F2] text-[#8F60BF] text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <i className={`fa-solid fa-rotate text-[#079DD9] ${isRefreshing ? "fa-spin" : ""}`} />
              <span>{isRefreshing ? "Đang Phân Tích..." : "AI Phân Tích Lại"}</span>
            </button>
          )}

          {/* Dimension dropdown for table view */}
          {activeTab === "table" && availableDimensions.length > 1 && (
            <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-[#ECD8F2] shadow-xs">
              <span className="text-[11px] font-bold text-[#5C5570] flex items-center space-x-1">
                <i className="fa-solid fa-layer-group text-[#8F60BF]" />
                <span>Góc nhìn:</span>
              </span>
              <select
                value={activeDimension}
                onChange={(e) => onDimensionChange?.(e.target.value)}
                className="text-xs font-black text-[#8F60BF] bg-transparent focus:outline-none cursor-pointer"
              >
                {availableDimensions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tab 1: AI Markdown View */}
      {activeTab === "ai" && (
        <div className="p-6 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-4">
          {(() => {
            const parsedReport = diagnosisData?.markdown_report ? parseMarkdown(diagnosisData.markdown_report) : null;
            const hasValidReport = parsedReport && Array.isArray(parsedReport) && parsedReport.length > 0;
            if (hasValidReport) {
              return <div className="space-y-2">{parsedReport}</div>;
            }
            return (
              <div className="p-12 text-center space-y-3">
                <i className={`fa-solid ${isRefreshing ? "fa-circle-notch fa-spin text-[#8F60BF]" : "fa-file-waveform text-[#8F60BF]"} text-3xl mb-2 block`} />
                <p className="text-sm font-bold text-[#1E1B2E]">
                  {isRefreshing
                    ? "Gemini AI đang tiến hành phân tích số liệu và lập báo cáo chẩn đoán chuyên sâu..."
                    : "Đang tải báo cáo chẩn đoán AI..."}
                </p>
                <p className="text-xs text-[#5C5570] max-w-md mx-auto">
                  Hệ thống AI Auditor đang quét toàn bộ giao dịch, bóc tách rò rỉ voucher và hoàn hàng trễ.
                </p>
                {onRefreshDiagnosis && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onRefreshDiagnosis}
                      disabled={isRefreshing}
                      className="px-4 py-2 rounded-xl bg-[#8F60BF] hover:bg-[#7b4fa8] text-white text-xs font-bold transition inline-flex items-center space-x-2 shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      <i className={`fa-solid fa-rotate ${isRefreshing ? "fa-spin" : ""}`} />
                      <span>{isRefreshing ? "Đang Phân Tích..." : "Kích Hoạt Phân Tích AI"}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab 2: Structured Data Table View */}
      {activeTab === "table" && (
        <div className="p-6 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-4">
          {cleansingPlanData?.columns && cleansingPlanData?.cleaned_sample && cleansingPlanData.cleaned_sample.length > 0 ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#ECD8F2] gap-3">
                <div>
                  <span className="text-xs font-bold text-[#1E1B2E] uppercase tracking-wider flex items-center space-x-1.5">
                    <i className="fa-solid fa-table text-[#8F60BF]" />
                    <span>Bảng dữ liệu thực tế theo tệp đã tải</span>
                  </span>
                  <span className="text-xs text-[#5C5570] block mt-0.5">
                    Hiển thị {filteredSampleRows.length} / {cleansingPlanData.cleaned_sample.length} bản ghi · {cleansingPlanData.columns.length} cột dữ liệu
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-xs text-[#5C5570]" />
                    <input
                      type="text"
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      placeholder="Tìm kiếm nhanh..."
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-[#ECD8F2] bg-[#FAF8FC] text-xs text-[#1E1B2E] focus:outline-none focus:border-[#8F60BF] w-44 sm:w-52 transition"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="px-3 py-1.5 rounded-xl bg-[#FAF6FD] hover:bg-[#ECD8F2] text-[#8F60BF] border border-[#BEB6F2] text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                    title="Tải tệp CSV sạch"
                  >
                    <i className="fa-solid fa-file-arrow-down" />
                    <span>Xuất CSV</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#ECD8F2] shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF8FC] text-[#5C5570] font-bold border-b border-[#ECD8F2]">
                    <tr>
                      <th className="p-3.5 w-14 text-center whitespace-nowrap">STT</th>
                      {cleansingPlanData.columns.map((c: string, i: number) => (
                        <th key={i} className="p-3.5 whitespace-nowrap">
                          {c}
                        </th>
                      ))}
                      <th className="p-3.5 text-center whitespace-nowrap">Trạng Thái Audit</th>
                      <th className="p-3.5 text-center whitespace-nowrap">Đánh Giá Rủi Ro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECD8F2] font-mono">
                    {filteredSampleRows.map((r: any, idx: number) => {
                      let rowRisk = "🟢 KIỂM SOÁT TỐT";
                      let rowRiskClass = "text-emerald-800 bg-emerald-100 border border-emerald-200";
                      if (r["M5"] === 0 || r["M5"] === "0" || r["M5"] === "0.0%" || r["M5"] === 0.0 || r["M5"] === "0.0") {
                        rowRisk = "🔴 BÁO ĐỘNG ĐỎ (Chạm Đáy M5)";
                        rowRiskClass = "text-[#8F60BF] bg-[#ECD8F2] border border-[#BEB6F2]";
                      } else if (r["M4"] !== undefined && r["M4"] !== null && r["M4"] !== "-" && r["M4"] !== "—") {
                        rowRisk = "🟡 CẢNH BÁO (Rơi rụng M4)";
                        rowRiskClass = "text-amber-800 bg-amber-100 border border-amber-200";
                      }

                      const auditStatus = r._audit_status || "ĐÃ CHUẨN HOÁ";

                      return (
                        <tr key={idx} className="hover:bg-[#FAF6FD] transition even:bg-[#FAF8FC]/40 divide-x divide-[#ECD8F2]/40">
                          <td className="p-3.5 text-center font-sans font-bold text-[#5C5570] bg-[#FAF8FC]/50">{idx + 1}</td>
                          {cleansingPlanData.columns.map((col: string, cIdx: number) => {
                            const val = r[col];
                            const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
                            const isNumeric = !isNaN(num) && String(val).trim() !== "" && isFinite(num);
                            let displayVal = val === null || val === undefined || val === "" ? "-" : val;
                            if (isNumeric && typeof val === "number") {
                              if (num >= 10000) {
                                displayVal = formatVND(num);
                              } else if (num % 1 !== 0) {
                                displayVal = num.toFixed(1);
                              } else {
                                displayVal = num.toString();
                              }
                            }

                            return (
                              <td
                                key={cIdx}
                                className={`p-3.5 whitespace-nowrap ${
                                  cIdx === 0
                                    ? "text-left font-sans font-bold text-[#1E1B2E]"
                                    : isNumeric
                                    ? "text-right font-mono text-[#1E1B2E]"
                                    : "text-left font-sans text-[#1E1B2E]"
                                }`}
                              >
                                {displayVal}
                              </td>
                            );
                          })}
                          <td className="p-3.5 text-center whitespace-nowrap font-sans">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F2F5F3] text-[#4A5D57] border border-[#D5DDD8]">
                              {auditStatus}
                            </span>
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap font-sans">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${rowRiskClass}`}>
                              {rowRisk}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-[#ECD8F2]">
                <span className="text-xs font-bold text-[#1E1B2E] uppercase tracking-wider">
                  Bảng dữ liệu đối soát theo phân khúc ({channels.length} đối tượng)
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#ECD8F2]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF8FC] text-[#5C5570] font-semibold border-b border-[#ECD8F2]">
                    <tr>
                      <th className="p-3">{activeDimension}</th>
                      <th className="p-3 text-right">Doanh Thu Thô</th>
                      <th className="p-3 text-right">Thực Thu Sau Đối Soát</th>
                      <th className="p-3 text-center">Tỷ Lệ Hoàn (%)</th>
                      <th className="p-3 text-right">Chi Phí Tiếp Thị / Vận Hành</th>
                      <th className="p-3 text-right">Lợi Nhuận Đóng Góp</th>
                      <th className="p-3 text-center">Đánh Giá Rủi Ro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECD8F2]">
                    {channels.map((ch) => {
                      const isLoss = ch.contribution_profit < 0;
                      return (
                        <tr key={ch.channel} className="hover:bg-[#FAF6FD] transition">
                          <td className="p-3 font-semibold text-[#1E1B2E]">{ch.channel}</td>
                          <td className="p-3 text-right font-mono font-medium text-[#1E1B2E]">
                            {formatVND(ch.gross_revenue)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-[#8F60BF]">
                            {formatVND(ch.audited_net)}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-[#5C5570]">
                            {ch.return_rate.toFixed(1)}%
                          </td>
                          <td className="p-3 text-right font-mono text-[#5C5570]">
                            {formatVND(ch.ads_spend)}
                          </td>
                          <td
                            className={`p-3 text-right font-mono font-bold ${
                              isLoss ? "text-[#8F60BF]" : "text-[#079DD9]"
                            }`}
                          >
                            {formatVND(ch.contribution_profit)}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                isLoss
                                  ? "bg-[#ECD8F2] text-[#8F60BF]"
                                  : ch.return_rate > 15
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {isLoss ? "THÂM HỤT NẶNG" : ch.return_rate > 15 ? "RỦI RO HOÀN CAO" : "AN TOÀN / HIỆU QUẢ"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Navigation footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[#ECD8F2]">
        {onBackToStep2 && (
          <button
            type="button"
            onClick={onBackToStep2}
            className="px-6 py-3 rounded-xl border border-[#ECD8F2] bg-white text-[#5C5570] text-sm font-bold hover:text-[#1E1B2E] transition flex items-center space-x-2 cursor-pointer"
          >
            <i className="fa-solid fa-arrow-left text-xs" />
            <span>Quay lại Bước 2</span>
          </button>
        )}
        <button
          onClick={onProceedToStep4}
          className="px-8 py-3.5 bg-[#8F60BF] hover:bg-[#7b4fa8] text-white rounded-xl text-sm font-bold transition flex items-center space-x-2 shadow-xs cursor-pointer ml-auto"
        >
          <span>Xem Nguyên Nhân &amp; Đề Xuất (Sang Bước 4)</span>
          <i className="fa-solid fa-arrow-right text-xs text-[#99D9F2]" />
        </button>
      </div>
    </div>
  );
}
