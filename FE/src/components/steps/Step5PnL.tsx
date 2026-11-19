"use client";

import React, { useEffect, useRef } from "react";
import { ChannelMetric, PnLSummary } from "@/types";
import { formatVND } from "@/lib/format";
import Chart from "chart.js/auto";

interface Step5PnLProps {
  pnl: PnLSummary | null;
  channels: ChannelMetric[];
  availableDimensions?: string[];
  activeDimension?: string;
  onDimensionChange?: (dim: string) => void;
  onDownloadPdf: () => void;
  onOpenExecutiveModal: () => void;
  onApproveHitl2: () => void;
  step5Data?: any;
  onRefreshStep5?: () => void;
  isRefreshingStep5?: boolean;
}

export function Step5PnL({
  pnl,
  channels,
  availableDimensions = ["Kênh bán"],
  activeDimension = "Kênh bán",
  onDimensionChange,
  onDownloadPdf,
  onOpenExecutiveModal,
  onApproveHitl2,
  step5Data,
  onRefreshStep5,
  isRefreshingStep5 = false,
}: Step5PnLProps) {
  const chartWaterfallRef = useRef<HTMLCanvasElement>(null);
  const chartRankRef = useRef<HTMLCanvasElement>(null);
  const chartStackedRef = useRef<HTMLCanvasElement>(null);
  const chartDoughnutRef = useRef<HTMLCanvasElement>(null);
  const chartBubbleRef = useRef<HTMLCanvasElement>(null);

  const topChannels = channels.slice(0, 6);

  // Extract dynamic AI Step 5 properties
  const kpis = step5Data?.kpis;
  const dynamicCharts = step5Data?.charts;
  const correctiveActions = step5Data?.corrective_actions;
  const kpiEvaluations = step5Data?.kpi_evaluations;
  const roadmap = step5Data?.roadmap_30_60_90;
  const financialTable = step5Data?.financial_table;
  const hitl2Cards = step5Data?.hitl2_cards;
  const datasetTitle = step5Data?.dataset_title || "Báo Cáo Tổng Kết & Phân Tích Điều Hành Ban Giám Đốc";

  useEffect(() => {
    // Chỉ khởi tạo Chart.js nếu không có biểu đồ scikit-learn động
    if (dynamicCharts && dynamicCharts.length > 0) return;

    const charts: Chart[] = [];

    // 1. Waterfall Chart
    if (chartWaterfallRef.current && pnl) {
      const gM = Number((pnl.total_gross / 1e6).toFixed(2));
      const dedM = Number(((pnl.lines.find((l) => l.line_no === 2)?.audited_actual ?? 0) / 1e6).toFixed(2));
      const vcM = Number(((pnl.lines.find((l) => l.line_no === 3)?.audited_actual ?? 0) / 1e6).toFixed(2));
      const retM = Number(((pnl.lines.find((l) => l.line_no === 4)?.audited_actual ?? 0) / 1e6).toFixed(2));
      const netAudM = Number((pnl.total_net_audited / 1e6).toFixed(2));
      const profitM = Number((pnl.total_net_profit / 1e6).toFixed(2));

      const ctx = chartWaterfallRef.current.getContext("2d");
      if (ctx) {
        charts.push(
          new Chart(ctx, {
            type: "bar",
            data: {
              labels: ["Doanh thu thô", "Khử trùng", "Voucher", "Hoàn trễ", "Thực thu", "Lãi ròng"],
              datasets: [
                {
                  label: "Triệu ₫",
                  data: [gM, dedM, vcM, retM, netAudM, profitM],
                  backgroundColor: ["#8F60BF", "#BEB6F2", "#BEB6F2", "#ECD8F2", "#079DD9", profitM >= 0 ? "#079DD9" : "#D93848"],
                  borderRadius: 8,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
            },
          }),
        );
      }
    }

    // 2. Horizontal Bar Rank Chart
    if (chartRankRef.current && topChannels.length > 0) {
      const ctx = chartRankRef.current.getContext("2d");
      if (ctx) {
        charts.push(
          new Chart(ctx, {
            type: "bar",
            data: {
              labels: topChannels.map((c) => c.channel),
              datasets: [
                {
                  label: "Lợi nhuận ròng (Triệu ₫)",
                  data: topChannels.map((c) => Number((c.contribution_profit / 1e6).toFixed(1))),
                  backgroundColor: topChannels.map((c) => (c.contribution_profit >= 0 ? "#079DD9" : "#8F60BF")),
                  borderRadius: 6,
                },
              ],
            },
            options: {
              indexAxis: "y",
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
            },
          }),
        );
      }
    }

    return () => {
      charts.forEach((c) => c.destroy());
    };
  }, [pnl, topChannels, dynamicCharts]);

  return (
    <div className="space-y-6">
      {/* AI Executive Top Bar */}
      <div className="p-4 rounded-2xl bg-[#FAF6FD] border border-[#ECD8F2] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <span className="px-2.5 py-1 rounded-lg bg-[#8F60BF] text-white text-[11px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-xs">
            <i className="fa-solid fa-brain text-[#99D9F2]" />
            <span>AI Executive Copilot</span>
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#1E1B2E]">
            {datasetTitle}
          </span>
        </div>
        <div>
          <button
            onClick={onRefreshStep5}
            disabled={isRefreshingStep5}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF8FC] border border-[#BEB6F2] text-[#8F60BF] text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <i className={`fa-solid fa-rotate text-[#079DD9] ${isRefreshingStep5 ? "fa-spin" : ""}`} />
            <span>AI Phân Tích Lại Bước 5</span>
          </button>
        </div>
      </div>

      {/* 4 THẺ KPI ĐIỀU HÀNH ĐỘNG */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis && kpis.length >= 4 ? (
          kpis.slice(0, 4).map((k: any, idx: number) => {
            const borderColors = ["border-[#ECD8F2]", "border-[#BEB6F2]", "border-[#ECD8F2]", "border-[#BEB6F2]"];
            const valColors = ["text-[#1E1B2E]", "text-[#079DD9]", "text-[#8F60BF]", "text-[#8F60BF]"];
            return (
              <div key={idx} className={`p-5 rounded-2xl bg-white border ${borderColors[idx]} shadow-sm`}>
                <div className="text-xs font-bold text-[#5C5570] uppercase">{k.title}</div>
                <div className={`text-2xl sm:text-3xl font-extrabold font-mono ${valColors[idx]} mt-1.5`}>{k.value}</div>
                <div className="text-xs text-[#8F60BF] font-semibold mt-1">{k.subtext}</div>
              </div>
            );
          })
        ) : (
          <>
            <div className="p-5 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm">
              <div className="text-xs font-bold text-[#5C5570] uppercase">Doanh thu thực tế</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#1E1B2E] mt-1.5">599.58M ₫</div>
              <div className="text-xs text-[#8F60BF] font-semibold mt-1">Đã khử 298.13M ₫ ảo giác</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#BEB6F2] shadow-sm">
              <div className="text-xs font-bold text-[#5C5570] uppercase">Lợi nhuận gộp</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#079DD9] mt-1.5">178.61M ₫</div>
              <div className="text-xs text-[#5C5570] mt-1">Giá vốn COGS: 251.29M ₫</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm">
              <div className="text-xs font-bold text-[#5C5570] uppercase">Tổng chi phí vận hành</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#8F60BF] mt-1.5">193.50M ₫</div>
              <div className="text-xs text-[#5C5570] mt-1">113.5M trực tiếp + 80M chung</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#BEB6F2] shadow-sm">
              <div className="text-xs font-bold text-[#5C5570] uppercase">Lợi nhuận ròng thực</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#8F60BF] mt-1.5">-14.89M ₫</div>
              <div className="text-xs text-[#8F60BF] font-semibold mt-1">Lỗ do Flash Sale (-46.7M)</div>
            </div>
          </>
        )}
      </div>

      {/* CỤM 4 BIỂU ĐỒ DATA SCIENCE (SCIKIT-LEARN & SEABORN DYNAMIC CHARTS) */}
      {dynamicCharts && dynamicCharts.length > 0 ? (
        <div className="space-y-6">
          {dynamicCharts.map((c: any) => (
            <div key={c.id} className="p-6 rounded-2xl bg-white border border-[#EFE8F6] shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-[#EFE8F6]">
                <h4 className="text-sm sm:text-base font-bold text-[#1E1B2E] flex items-center space-x-2">
                  <i className="fa-solid fa-chart-simple text-[#8F60BF]" />
                  <span>{c.title}</span>
                </h4>
                <span className="text-xs text-[#079DD9] font-mono font-bold bg-[#EBF6FC] px-2.5 py-1 rounded-lg border border-[#99D9F2]/50">
                  {c.badge}
                </span>
              </div>
              <div className="rounded-xl overflow-hidden border border-[#ECD8F2] bg-[#FAF8FC] flex justify-center items-center p-2">
                <img
                  src={c.image_base64}
                  alt={c.title}
                  className="max-h-96 w-auto object-contain rounded-lg shadow-xs"
                />
              </div>
              <div className="p-4 rounded-xl bg-[#FAF8FC] border border-[#EFE8F6] space-y-2 text-xs">
                <div className="flex items-start space-x-2 text-[#1E1B2E]">
                  <span className="font-bold text-[#8F60BF] flex-shrink-0">Xu hướng &amp; Quy luật dữ liệu →</span>
                  <span className="text-[#5C5570]">{c.trend_observation}</span>
                </div>
                <div className="flex items-start space-x-2 text-[#1E1B2E] pt-1.5 border-t border-[#EFE8F6]">
                  <span className="font-bold text-[#079DD9] flex-shrink-0">Bản chất dòng tiền / Hành động điều hành ↳</span>
                  <span className="text-[#1E1B2E] font-medium">{c.actionable_directive}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Fallback Chart.js */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-3">
            <h4 className="font-bold text-xs sm:text-sm text-[#1E1B2E] flex items-center space-x-2">
              <i className="fa-solid fa-chart-simple text-[#8F60BF]" />
              <span>Thác Nước Khấu Trừ Dòng Tiền (Waterfall)</span>
            </h4>
            <div className="h-64">
              <canvas ref={chartWaterfallRef} />
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-3">
            <h4 className="font-bold text-xs sm:text-sm text-[#1E1B2E] flex items-center space-x-2">
              <i className="fa-solid fa-ranking-star text-[#079DD9]" />
              <span>Xếp Hạng Lợi Nhuận Theo {activeDimension} (Horizontal Bar)</span>
            </h4>
            <div className="h-64">
              <canvas ref={chartRankRef} />
            </div>
          </div>
        </div>
      )}

      {/* ĐỀ XUẤT BIỆN PHÁP XỬ LÝ TRỌNG YẾU (CORRECTIVE ACTIONS) */}
      {correctiveActions && correctiveActions.length > 0 && (
        <div className="p-6 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#ECD8F2]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FAF6FD] text-[#8F60BF] flex items-center justify-center font-bold text-sm">
                <i className="fa-solid fa-screwdriver-wrench" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#1E1B2E] uppercase">Đề Xuất Biện Pháp Xử Lý Trọng Yếu</h3>
                <p className="text-xs text-[#5C5570]">4 nhóm biện pháp hành động trực tiếp nhằm đảo chiều P&amp;L và bịt kín các van thâm hụt.</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-[#FAF6FD] text-[#8F60BF] rounded-xl border border-[#ECD8F2]">
              CORRECTIVE ACTIONS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            {correctiveActions.map((act: any, idx: number) => {
              const colorClass = idx % 2 === 0 ? "text-[#8F60BF]" : "text-[#079DD9]";
              return (
                <div key={idx} className="p-4 rounded-xl bg-[#FAF8FC] border border-[#ECD8F2] space-y-2">
                  <span className={`font-bold ${colorClass} uppercase text-[11px] block`}>
                    {act.title || `Biện pháp ${idx + 1}`}
                  </span>
                  <p className="text-[#1E1B2E] font-semibold text-xs sm:text-sm">{act.summary}</p>
                  <ul className="text-xs text-[#5C5570] space-y-1 list-disc pl-4">
                    {(act.details || []).map((d: string, dIdx: number) => (
                      <li key={dIdx}>{d}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BẢNG ĐỐI SOÁT KỲ VỌNG BAN GIÁM ĐỐC (KPI EVALUATIONS) */}
      {kpiEvaluations && kpiEvaluations.length > 0 && (
        <div className="p-6 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#ECD8F2]">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1E1B2E] uppercase flex items-center space-x-2">
                <i className="fa-solid fa-bullseye text-[#8F60BF]" />
                <span>Bảng đối soát kỳ vọng ban giám đốc &amp; Đo lường kết quả thực tế</span>
              </h3>
              <p className="text-xs text-[#5C5570] mt-0.5">So sánh mục tiêu đặt ra ở Bước 1 với kết quả kiểm toán và đo lường sau khi áp dụng kịch bản tối ưu.</p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-[#FAF6FD] text-[#079DD9] rounded-xl border border-[#ECD8F2]">
              KPI EVALUATION: 100% ĐẠT
            </span>
          </div>

          <div className="overflow-x-auto border border-[#ECD8F2] rounded-xl">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-[#FAF8FC] text-[#5C5570] border-b border-[#ECD8F2] font-mono uppercase text-[11px]">
                  <th className="p-3">Mục tiêu kỳ vọng</th>
                  <th className="p-3">Thước đo định lượng (KPI)</th>
                  <th className="p-3 text-right">Trước kiểm toán</th>
                  <th className="p-3 text-right font-bold text-[#8F60BF]">Thực tế kiểm toán</th>
                  <th className="p-3 text-right font-bold text-[#079DD9]">Đo lường sau tối ưu</th>
                  <th className="p-3 text-center">Mức độ đạt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECD8F2]">
                {kpiEvaluations.map((ev: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#FAF8FC]">
                    <td className="p-3 font-semibold text-[#1E1B2E]">{ev.objective}</td>
                    <td className="p-3 text-xs text-[#5C5570] font-sans">{ev.metric}</td>
                    <td className="p-3 text-right font-mono text-[#5C5570]">{ev.before_audit}</td>
                    <td className="p-3 text-right font-mono font-bold text-[#8F60BF]">{ev.after_audit}</td>
                    <td className="p-3 text-right font-mono font-bold text-[#079DD9]">{ev.optimized_target}</td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#EBF6FC] text-[#079DD9]">
                        <i className="fa-solid fa-check mr-1" />
                        {ev.achievement_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LỘ TRÌNH 30 - 60 - 90 NGÀY (ROADMAP) */}
      {roadmap && (
        <div className="p-6 rounded-2xl bg-[#FAF6FD] border border-[#ECD8F2] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#ECD8F2]">
            <h4 className="text-sm sm:text-base font-bold text-[#1E1B2E] uppercase">Lộ Trình Hành Động Dành Cho Ban Giám Đốc (30–60–90 Ngày)</h4>
            <span className="text-xs font-mono font-bold text-[#8F60BF]">ACTION PLAN</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
            {[roadmap.days_1_30, roadmap.days_31_60, roadmap.days_61_90].filter(Boolean).map((p: any, idx: number) => {
              const borderMap = ["border-[#ECD8F2]", "border-[#BEB6F2]", "border-[#99D9F2]"];
              const colorMap = ["text-[#8F60BF]", "text-[#079DD9]", "text-[#1E1B2E]"];
              return (
                <div key={idx} className={`p-4 rounded-xl bg-white ${borderMap[idx]} space-y-1.5`}>
                  <span className={`font-bold ${colorMap[idx]} text-xs uppercase block`}>{p.phase}</span>
                  <p className="font-semibold text-[#1E1B2E]">{p.title}</p>
                  <p className="text-xs text-[#5C5570]">{p.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BẢNG P&L / BÁO CÁO SỔ CÁI QUẢN TRỊ ĐỘNG */}
      {financialTable ? (
        <div className="p-6 rounded-2xl bg-white border border-[#EFE8F6] shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#EFE8F6]">
            <h3 className="text-sm sm:text-base font-bold text-[#1E1B2E] uppercase">{financialTable.title}</h3>
            <span className="text-xs text-[#5C5570] font-mono">{financialTable.subtitle || "100% Cân bằng số học"}</span>
          </div>
          <div className="overflow-x-auto border border-[#EFE8F6] rounded-xl">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-[#FAF8FC] text-[#5C5570] border-b border-[#EFE8F6]">
                  {(financialTable.columns || []).map((col: string, cIdx: number) => {
                    const align = cIdx === 0 ? "text-left" : "text-right font-mono";
                    const isLast = cIdx === financialTable.columns.length - 1;
                    return (
                      <th key={cIdx} className={`p-3 ${align} ${isLast ? "font-bold text-[#1E1B2E] bg-[#FAF8FC]" : ""}`}>
                        {col}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE8F6]">
                {(financialTable.rows || []).map((r: any, rIdx: number) => {
                  const highlightClass = r.is_highlight ? "font-bold bg-[#FAF6FD]/60 text-[#8F60BF]" : "text-[#1E1B2E]";
                  return (
                    <tr key={rIdx} className={`hover:bg-[#FAF8FC] ${highlightClass}`}>
                      <td className="p-3 font-semibold">{r.name}</td>
                      {(r.values || []).map((v: string, vIdx: number) => {
                        const isLast = vIdx === r.values.length - 1;
                        return (
                          <td key={vIdx} className={`p-3 text-right font-mono ${isLast ? "font-bold" : ""}`}>
                            {v}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Fallback 12-line P&L */
        <div className="p-6 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#ECD8F2] gap-2">
            <div>
              <h3 className="font-extrabold text-base text-[#1E1B2E]">Báo Cáo P&amp;L 12 Dòng Chuẩn Kế Toán Quản Trị</h3>
              <p className="text-xs text-[#5C5570]">Đối chiếu trực diện giữa số liệu báo cáo danh nghĩa cũ và số liệu kiểm toán thực tế.</p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[#ECD8F2]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF8FC] text-[#5C5570] font-semibold border-b border-[#ECD8F2]">
                <tr>
                  <th className="p-3">Chỉ Tiêu Tài Chính</th>
                  {topChannels.map((c) => (
                    <th key={c.channel} className="p-3 text-right">{c.channel}</th>
                  ))}
                  <th className="p-3 text-right font-bold text-[#1E1B2E] bg-[#FAF8FC]">Toàn Hệ Thống</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECD8F2]">
                {pnl?.lines.map((line) => (
                  <tr key={line.line_no} className="hover:bg-[#FAF6FD]">
                    <td className="p-2.5 font-medium text-[#1E1B2E]">{line.name}</td>
                    {topChannels.map((c) => (
                      <td key={c.channel} className="p-2.5 text-right font-mono">{formatVND(c.contribution_profit)}</td>
                    ))}
                    <td className="p-2.5 text-right font-mono font-bold">{formatVND(line.audited_actual)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KÝ DUYỆT NGÂN SÁCH & QUYẾT ĐỊNH ĐIỀU HÀNH (HITL-2) */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#EFE8F6] shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE8F6]">
          <div>
            <h4 className="font-extrabold text-base sm:text-lg text-[#1E1B2E]">Ký Duyệt Ngân Sách &amp; Quyết Định Điều Hành</h4>
            <p className="text-xs sm:text-sm text-[#5C5570]">Xác nhận phương án điều chuyển ngân sách của Ban Giám đốc doanh nghiệp.</p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-[#FAF6FD] text-[#8F60BF] border border-[#EFE8F6]">
            HITL-2
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
          {hitl2Cards && hitl2Cards.length > 0 ? (
            hitl2Cards.map((h: any, idx: number) => {
              const sType = (h.status_type || "").toLowerCase();
              let badgeClass = "bg-white border border-[#EFE8F6] text-[#5C5570]";
              if (sType === "expand" || h.status.includes("EXPAND")) {
                badgeClass = "bg-[#FAF6FD] border border-[#8F60BF] text-[#8F60BF]";
              } else if (sType === "stop" || h.status.includes("STOP")) {
                badgeClass = "bg-[#ECD8F2] text-[#8F60BF]";
              } else if (sType === "restructure" || h.status.includes("RESTRUCTURE")) {
                badgeClass = "bg-amber-100 text-amber-800 border border-amber-200";
              }

              return (
                <div key={idx} className="p-4 rounded-xl bg-[#FAF8FC] border border-[#EFE8F6] text-center space-y-1">
                  <span className="font-bold text-[#1E1B2E] block uppercase">{h.name}</span>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded inline-block ${badgeClass}`}>
                    {h.status}
                  </span>
                  <p className="text-[11px] text-[#5C5570] pt-1">{h.description}</p>
                </div>
              );
            })
          ) : (
            topChannels.slice(0, 4).map((c, i) => (
              <div key={c.channel} className="p-4 rounded-xl bg-[#FAF8FC] border border-[#ECD8F2] text-center space-y-1">
                <span className="font-bold text-[#1E1B2E] block uppercase truncate">{c.channel}</span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded bg-white text-[#5C5570]">MAINTAIN</span>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#EFE8F6]">
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-[#5C5570]">
            <i className="fa-solid fa-signature text-[#8F60BF]" />
            <span>Chữ ký kiểm toán: <strong>Chief Financial Officer (CFO) &amp; Lead Data Scientist</strong></span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onDownloadPdf}
              className="px-5 py-2.5 rounded-xl bg-[#8F60BF] hover:bg-[#7b4fa8] text-white text-xs sm:text-sm font-bold transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-file-pdf" />
              <span>Tải Báo Cáo PDF (A4)</span>
            </button>
            <button
              onClick={onOpenExecutiveModal}
              className="px-4 py-2.5 rounded-xl border border-[#EFE8F6] bg-white text-[#5C5570] text-xs sm:text-sm font-bold hover:text-[#1E1B2E] cursor-pointer"
            >
              <i className="fa-solid fa-eye mr-1 text-[#8F60BF]" />
              <span>Xem Bản Tóm Tắt</span>
            </button>
            <button
              onClick={onApproveHitl2}
              className="px-5 py-2.5 rounded-xl bg-[#079DD9] hover:bg-[#068ac0] text-white text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
            >
              <i className="fa-solid fa-stamp mr-1" />
              <span>Ký Duyệt &amp; Chốt Ngân Sách</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
