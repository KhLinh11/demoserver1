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
  diagnosisData?: any;
  onRefreshDiagnosis?: () => void;
  isRefreshing?: boolean;
}

function parseMarkdown(md: string) {
  if (!md) return null;

  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = (keyPrefix: number) => {
    if (!inTable) return;
    elements.push(
      <div key={`table-wrap-${keyPrefix}`} className="overflow-x-auto my-4 rounded-2xl border border-[#ECD8F2] shadow-sm bg-white">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-[#FAF8FC] text-[#5C5570] font-bold border-b border-[#ECD8F2]">
            <tr>
              {tableHeaders.map((h, i) => (
                <th key={i} className="p-3.5 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECD8F2] font-mono text-[#1E1B2E]">
            {tableRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-[#FAF6FD] transition">
                {row.map((cell, cIdx) => {
                  const txt = cell.trim();
                  const isRed = txt.includes("BÁO ĐỘNG") || txt.includes("🔴") || txt.includes("RỦI RO CAO");
                  const isYellow = txt.includes("CẢNH BÁO") || txt.includes("🟡");
                  const isGreen = txt.includes("AN TOÀN") || txt.includes("🟢") || txt.includes("KIỂM SOÁT TỐT");

                  return (
                    <td
                      key={cIdx}
                      className={`p-3.5 ${
                        cIdx === 0
                          ? "text-left font-sans font-bold text-[#1E1B2E]"
                          : "text-right font-medium"
                      }`}
                    >
                      {isRed ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#ECD8F2] text-[#8F60BF] border border-[#BEB6F2]">
                          {txt}
                        </span>
                      ) : isYellow ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {txt}
                        </span>
                      ) : isGreen ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {txt}
                        </span>
                      ) : (
                        txt
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

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

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

    if (line.startsWith("# ")) {
      elements.push(
        <h2 key={idx} className="text-base sm:text-lg font-black text-[#1E1B2E] mt-6 mb-2 pb-2 border-b border-[#ECD8F2] flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8F60BF]" />
          <span>{line.slice(2)}</span>
        </h2>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h3 key={idx} className="text-sm sm:text-base font-bold text-[#8F60BF] mt-4 mb-2 flex items-center space-x-1.5">
          <i className="fa-solid fa-angle-right text-xs text-[#079DD9]" />
          <span>{line.slice(3)}</span>
        </h3>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h4 key={idx} className="text-xs sm:text-sm font-bold text-[#1E1B2E] mt-3 mb-1">
          {line.slice(4)}
        </h4>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={idx} className="flex items-start space-x-2 my-1.5 text-xs text-[#5C5570] leading-relaxed">
          <span className="text-[#079DD9] font-bold text-sm leading-none shrink-0">•</span>
          <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#1E1B2E] font-bold">$1</strong>') }} />
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)/);
      if (match) {
        elements.push(
          <div key={idx} className="flex items-start space-x-2.5 my-2 text-xs text-[#5C5570] leading-relaxed">
            <span className="w-5 h-5 rounded-md bg-[#FAF6FD] border border-[#BEB6F2] text-[#8F60BF] font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
              {match[1]}
            </span>
            <span dangerouslySetInnerHTML={{ __html: match[2].replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#1E1B2E] font-bold">$1</strong>') }} />
          </div>
        );
      }
    } else if (line.startsWith(">")) {
      elements.push(
        <div key={idx} className="p-3.5 my-3 rounded-2xl bg-[#FAF6FD] border-l-4 border-[#8F60BF] text-xs text-[#1E1B2E] font-medium leading-relaxed">
          {line.slice(1).trim()}
        </div>
      );
    } else {
      elements.push(
        <p key={idx} className="text-xs sm:text-sm text-[#5C5570] leading-relaxed my-2" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#1E1B2E] font-bold">$1</strong>') }} />
      );
    }
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
  diagnosisData,
  onRefreshDiagnosis,
  isRefreshing = false,
}: Step3DiagnosisProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "table">("ai");

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
          {diagnosisData?.markdown_report ? (
            <div className="space-y-2">{parseMarkdown(diagnosisData.markdown_report)}</div>
          ) : (
            <div className="p-12 text-center space-y-3">
              <i className="fa-solid fa-circle-notch fa-spin text-2xl text-[#8F60BF]" />
              <p className="text-xs font-bold text-[#8F60BF]">
                Gemini AI đang tiến hành phân tích số liệu và lập báo cáo chẩn đoán chuyên sâu...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Structured Data Table View */}
      {activeTab === "table" && (
        <div className="p-6 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-4">
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
        </div>
      )}

      {/* Navigation footer */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-[#5C5570]">
          Đã chẩn đoán xong rủi ro dòng tiền và cấu trúc dữ liệu.
        </span>
        <button
          onClick={onProceedToStep4}
          className="px-6 py-3 rounded-xl bg-[#8F60BF] hover:bg-[#7b4fa8] text-white text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
        >
          <span>Sang Bước 4: Nguyên Nhân &amp; Đề Xuất</span>
          <i className="fa-solid fa-arrow-right text-[#99D9F2]" />
        </button>
      </div>
    </div>
  );
}
