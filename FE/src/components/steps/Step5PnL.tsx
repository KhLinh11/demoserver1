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
}: Step5PnLProps) {
  const chartWaterfallRef = useRef<HTMLCanvasElement>(null);
  const chartRankRef = useRef<HTMLCanvasElement>(null);
  const chartStackedRef = useRef<HTMLCanvasElement>(null);
  const chartDoughnutRef = useRef<HTMLCanvasElement>(null);
  const chartBubbleRef = useRef<HTMLCanvasElement>(null);

  // Take up to 6 top entities for chart clarity
  const topChannels = channels.slice(0, 6);

  useEffect(() => {
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

    // 3. Stacked Breakdown Chart
    if (chartStackedRef.current && topChannels.length > 0) {
      const ctx = chartStackedRef.current.getContext("2d");
      if (ctx) {
        charts.push(
          new Chart(ctx, {
            type: "bar",
            data: {
              labels: topChannels.map((c) => c.channel),
              datasets: [
                {
                  label: "Doanh thu thuần",
                  data: topChannels.map((c) => Number((c.audited_net / 1e6).toFixed(1))),
                  backgroundColor: "#8F60BF",
                },
                {
                  label: "Chi phí Marketing / Ads",
                  data: topChannels.map((c) => Number((c.ads_spend / 1e6).toFixed(1))),
                  backgroundColor: "#BEB6F2",
                },
                {
                  label: "Hoàn trả & Thất thoát",
                  data: topChannels.map((c) => Number(((c.gross_revenue * (c.return_rate / 100)) / 1e6).toFixed(1))),
                  backgroundColor: "#ECD8F2",
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: { x: { stacked: true }, y: { stacked: true } },
            },
          }),
        );
      }
    }

    // 4. Doughnut Cost Structure Chart
    if (chartDoughnutRef.current && pnl) {
      const ctx = chartDoughnutRef.current.getContext("2d");
      if (ctx) {
        const totalAds = topChannels.reduce((s, c) => s + c.ads_spend, 0);
        const totalCogs = pnl.total_gross * 0.4;
        const totalFulfillment = pnl.total_gross * 0.07;
        const totalLoss = pnl.total_cogs_loss;

        charts.push(
          new Chart(ctx, {
            type: "doughnut",
            data: {
              labels: ["Giá vốn COGS", "Tiếp thị / Ads", "Vận hành", "Hao hụt hoàn"],
              datasets: [
                {
                  data: [
                    Number((totalCogs / 1e6).toFixed(1)),
                    Number((totalAds / 1e6).toFixed(1)),
                    Number((totalFulfillment / 1e6).toFixed(1)),
                    Number((totalLoss / 1e6).toFixed(1)),
                  ],
                  backgroundColor: ["#8F60BF", "#079DD9", "#BEB6F2", "#ECD8F2"],
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
            },
          }),
        );
      }
    }

    // 5. Bubble Correlation Chart
    if (chartBubbleRef.current && topChannels.length > 0) {
      const ctx = chartBubbleRef.current.getContext("2d");
      if (ctx) {
        const colors = [
          "rgba(143, 96, 191, 0.75)",
          "rgba(7, 157, 217, 0.75)",
          "rgba(190, 182, 242, 0.75)",
          "rgba(236, 216, 242, 0.85)",
          "rgba(16, 185, 129, 0.75)",
          "rgba(245, 158, 11, 0.75)",
        ];
        charts.push(
          new Chart(ctx, {
            type: "bubble",
            data: {
              datasets: topChannels.map((c, i) => ({
                label: c.channel,
                data: [
                  {
                    x: Number((c.ads_spend / 1e6).toFixed(1)),
                    y: Number((c.contribution_profit / 1e6).toFixed(1)),
                    r: Math.max(6, Math.min(24, c.return_rate || 8)),
                  },
                ],
                backgroundColor: colors[i % colors.length],
              })),
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { title: { display: true, text: "Chi phí Marketing / Ads (Triệu ₫)" } },
                y: { title: { display: true, text: "Lợi nhuận ròng (Triệu ₫)" } },
              },
            },
          }),
        );
      }
    }

    return () => {
      charts.forEach((c) => c.destroy());
    };
  }, [pnl, topChannels]);

  return (
    <div className="space-y-6">
      {/* 12-Line Managerial P&L Table */}
      <div className="p-6 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#ECD8F2] gap-2">
          <div>
            <h3 className="font-extrabold text-base text-[#1E1B2E]">
              Báo Cáo P&amp;L 12 Dòng Chuẩn Kế Toán Quản Trị
            </h3>
            <p className="text-xs text-[#5C5570]">
              Đối chiếu trực diện giữa số liệu báo cáo danh nghĩa cũ và số liệu kiểm toán thực tế theo từng <strong>{activeDimension}</strong>.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {availableDimensions.length > 1 && (
              <div className="flex items-center space-x-1.5 bg-[#FAF6FD] px-2.5 py-1 rounded-xl border border-[#ECD8F2]">
                <span className="text-[11px] font-bold text-[#5C5570]">Góc nhìn:</span>
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
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-[#FAF6FD] text-[#8F60BF] border border-[#ECD8F2]">
              P&amp;L AUDIT 2026
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#ECD8F2]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF8FC] text-[#5C5570] font-semibold border-b border-[#ECD8F2]">
              <tr>
                <th className="p-3">Chỉ Tiêu Tài Chính</th>
                {topChannels.map((c) => (
                  <th key={c.channel} className="p-3 text-right truncate max-w-[120px]" title={c.channel}>
                    {c.channel}
                  </th>
                ))}
                <th className="p-3 text-right font-bold text-[#1E1B2E] bg-[#FAF8FC]">Toàn Hệ Thống</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECD8F2]">
              {pnl?.lines.map((line) => {
                const isNetProfit = line.line_no === 10;
                const isNetAudited = line.line_no === 5;
                return (
                  <tr
                    key={line.line_no}
                    className={`hover:bg-[#FAF6FD] transition ${
                      isNetProfit ? "bg-[#FAF6FD] font-bold" : isNetAudited ? "bg-[#FAF6FD]/60 font-semibold" : ""
                    }`}
                  >
                    <td className="p-2.5 font-medium text-[#1E1B2E]">{line.name}</td>
                    {topChannels.map((c) => {
                      let val = 0;
                      if (line.line_no === 1) val = c.gross_revenue;
                      else if (line.line_no === 5) val = c.audited_net;
                      else if (line.line_no === 8) val = -c.ads_spend;
                      else if (line.line_no === 10) val = c.contribution_profit;
                      else val = Math.round(line.audited_actual / Math.max(1, topChannels.length));

                      return (
                        <td
                          key={c.channel}
                          className={`p-2.5 text-right font-mono ${
                            isNetProfit
                              ? val >= 0
                                ? "text-[#079DD9]"
                                : "text-[#8F60BF]"
                              : "text-[#5C5570]"
                          }`}
                        >
                          {formatVND(val)}
                        </td>
                      );
                    })}
                    <td
                      className={`p-2.5 text-right font-mono font-bold bg-[#FAF8FC] ${
                        isNetProfit
                          ? line.audited_actual >= 0
                            ? "text-[#079DD9]"
                            : "text-[#8F60BF]"
                          : "text-[#1E1B2E]"
                      }`}
                    >
                      {formatVND(line.audited_actual)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Analytics Grid */}
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

        <div className="p-6 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-3">
          <h4 className="font-bold text-xs sm:text-sm text-[#1E1B2E] flex items-center space-x-2">
            <i className="fa-solid fa-layer-group text-[#8F60BF]" />
            <span>Cơ Cấu Thuần, Chiết Khấu &amp; Hoàn Trả (Stacked)</span>
          </h4>
          <div className="h-64">
            <canvas ref={chartStackedRef} />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-3">
          <h4 className="font-bold text-xs sm:text-sm text-[#1E1B2E] flex items-center space-x-2">
            <i className="fa-solid fa-chart-pie text-[#079DD9]" />
            <span>Cơ Cấu Chi Phí Vận Hành &amp; COGS (Doughnut)</span>
          </h4>
          <div className="h-64">
            <canvas ref={chartDoughnutRef} />
          </div>
        </div>
      </div>

      {/* Bubble Correlation Chart */}
      <div className="p-6 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-3">
        <h4 className="font-bold text-xs sm:text-sm text-[#1E1B2E] flex items-center space-x-2">
          <i className="fa-solid fa-circle-dot text-[#8F60BF]" />
          <span>Tương Quan Chi Phí Tiếp Thị × Lợi Nhuận Ròng × Tỷ Lệ Hoàn (Bubble)</span>
        </h4>
        <div className="h-64">
          <canvas ref={chartBubbleRef} />
        </div>
      </div>

      {/* Dynamic Recommendations Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
        {topChannels.slice(0, 4).map((c, i) => {
          let tag = "MAINTAIN (Duy trì)";
          let tagClass = "bg-white border border-[#ECD8F2] text-[#5C5570]";
          let note = "Duy trì hoạt động, theo dõi sát chi phí vận hành";
          if (c.contribution_profit < 0) {
            tag = "STOP (Dừng ngay)";
            tagClass = "bg-[#ECD8F2] text-[#8F60BF]";
            note = `Thu hồi ngân sách, ngăn chặn lỗ thêm ${formatVND(c.contribution_profit)}`;
          } else if (i === 0) {
            tag = "EXPAND (Mở rộng)";
            tagClass = "bg-[#FAF6FD] border border-[#8F60BF] text-[#8F60BF]";
            note = `Nhóm sinh lời cao nhất (+${formatVND(c.contribution_profit)}), đề xuất tăng vốn`;
          } else if (c.return_rate > 15) {
            tag = "ADJUST (Siết SLA)";
            tagClass = "bg-amber-100 text-amber-800";
            note = `Tỷ lệ hoàn ${c.return_rate.toFixed(1)}%, siết chặt kỷ luật giao hàng`;
          }

          return (
            <div key={c.channel} className="p-4 rounded-xl bg-[#FAF8FC] border border-[#ECD8F2] text-center space-y-1">
              <span className="font-bold text-[#1E1B2E] block uppercase truncate" title={c.channel}>
                {c.channel}
              </span>
              <span className={`text-xs font-black px-2.5 py-0.5 rounded inline-block ${tagClass}`}>
                {tag}
              </span>
              <p className="text-[11px] text-[#5C5570] pt-1">{note}</p>
            </div>
          );
        })}
      </div>

      {/* Approval & Export Actions Footer */}
      <div className="p-6 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs text-[#5C5570]">
          <i className="fa-solid fa-signature text-[#8F60BF]" />
          <span>
            Chữ ký kiểm toán: <strong>Chief Financial Officer (CFO) &amp; BI Director</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onDownloadPdf}
            className="px-5 py-2.5 rounded-xl bg-[#8F60BF] hover:bg-[#7b4fa8] text-white text-xs sm:text-sm font-bold transition shadow-sm flex items-center space-x-1.5"
          >
            <i className="fa-solid fa-file-pdf" />
            <span>Tải Báo Cáo PDF (A4)</span>
          </button>

          <button
            onClick={onOpenExecutiveModal}
            className="px-4 py-2.5 rounded-xl border border-[#ECD8F2] bg-white text-[#5C5570] hover:text-[#1E1B2E] text-xs sm:text-sm font-bold transition"
          >
            <i className="fa-solid fa-eye mr-1 text-[#8F60BF]" />
            <span>Xem Bản Tóm Tắt</span>
          </button>

          <button
            onClick={onApproveHitl2}
            className="px-5 py-2.5 rounded-xl bg-[#079DD9] hover:bg-[#068ac0] text-white text-xs sm:text-sm font-bold transition shadow-sm flex items-center space-x-1.5"
          >
            <i className="fa-solid fa-stamp" />
            <span>Ký Duyệt &amp; Chốt Ngân Sách</span>
          </button>
        </div>
      </div>
    </div>
  );
}
