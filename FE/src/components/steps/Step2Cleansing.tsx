"use client";

import React from "react";
import { CleansingStats, OrderRecord } from "@/types";
import { formatVND } from "@/lib/format";

interface Step2CleansingProps {
  stats: CleansingStats | null;
  orders: OrderRecord[];
  hitl1Approved: boolean;
  onApproveHitl1: () => void;
  onOpenFullDataset: () => void;
  onProceedToStep3: () => void;
  cleansingPlanData?: any;
}

export function Step2Cleansing({
  stats,
  orders,
  hitl1Approved,
  onApproveHitl1,
  onOpenFullDataset,
  onProceedToStep3,
  cleansingPlanData,
}: Step2CleansingProps) {
  const dynamicCols: string[] = cleansingPlanData?.columns || [];
  const dynamicSample: any[] = cleansingPlanData?.cleaned_sample || [];
  const hasDynamicData = dynamicCols.length > 0 && dynamicSample.length > 0;
  const previewOrders = orders.slice(0, 8);

  const missingPolicies: string[] = cleansingPlanData?.zero_data_loss_policy?.missing_handling || [
    "Voucher trống: Gán mặc định = 0 ₫ thay vì loại bỏ đơn khỏi sổ cái.",
    "Mã hàng (SKU) trống: Gán SKU_UNKNOWN và nội suy giá vốn COGS chuẩn ngành.",
    "Kênh bán khuyết: Tự động gán theo chiều dữ liệu thời gian/phân loại thực tế.",
    "Doanh thu thuần khuyết: Tự động tính ngược số học Net = Gross - Voucher.",
  ];

  const duplicatePolicies: string[] = cleansingPlanData?.zero_data_loss_policy?.duplicate_handling || [
    "Trùng 100% (Duplicate Records): Sử dụng Pandas drop_duplicates(), chỉ giữ 1 bản ghi gốc.",
    "Trùng đa chạm tiếp thị (Multi-touch): Cùng đơn nhiều kênh nhận công -> Áp dụng chia đều 1/N.",
    "Đơn Bot / Spam: Gắn cờ cách ly ISOLATED_AUDIT để thẩm tra riêng.",
  ];

  const cleansingPlanItems: any[] = cleansingPlanData?.cleansing_plan || [
    {
      category: "Cấu trúc tệp (Auto Schema)",
      violation_scale: `${(stats?.total_rows ?? orders.length).toLocaleString()} dòng (100%)`,
      recommendation: "Khớp tự động các trường dữ liệu thực tế của tệp, không drop dữ liệu",
      financial_impact: "0 ₫ (Bảo toàn 100%)",
      status: "ĐÃ KHỚP",
    },
    {
      category: "Dữ liệu trống & Điền khuyết (Imputation)",
      violation_scale: `${(stats?.missing_imputed ?? 0).toLocaleString()} ô khuyết`,
      recommendation: "Áp dụng Zero Data Loss: Điền 0đ cho trường số, bảo toàn cấu trúc chu kỳ",
      financial_impact: "0 ₫",
      status: "ĐIỀN KHUYẾT",
    },
    {
      category: "Kiểm tra trùng lặp bản ghi (Deduplication)",
      violation_scale: `${(stats?.deduplicated_rows ?? 0).toLocaleString()} dòng trùng`,
      recommendation: "Chỉ giữ 1 bản ghi gốc duy nhất khi phát hiện trùng lặp bằng Pandas",
      financial_impact: "Khử trùng chính xác",
      status: "KHỬ TRÙNG",
    },
    {
      category: "Kiểm định số học & Tính nhất quán",
      violation_scale: "0 đơn vi phạm",
      recommendation: "Bảo toàn số dư và đồng bộ hóa các trường đo lường doanh thu/số lượng",
      financial_impact: "Độ tin cậy 100%",
      status: "CHUẨN HOÁ",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Cleansing Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-1">
          <div className="flex justify-between items-center text-[#5C5570] text-xs font-semibold">
            <span>Bản Ghi Bảo Toàn</span>
            <i className="fa-solid fa-database text-[#8F60BF]" />
          </div>
          <span className="text-2xl font-black font-mono text-[#1E1B2E] block">
            {(stats?.preserved_records ?? orders.length).toLocaleString()}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold block">
            Bảo toàn 100% dòng dữ liệu
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-1">
          <div className="flex justify-between items-center text-[#5C5570] text-xs font-semibold">
            <span>Xử Lý Khuyết Thiếu</span>
            <i className="fa-solid fa-ticket text-amber-500" />
          </div>
          <span className="text-2xl font-black font-mono text-[#1E1B2E] block">
            {(stats?.missing_imputed ?? 0).toLocaleString()} ô
          </span>
          <span className="text-[11px] text-[#5C5570] block">
            {cleansingPlanData?.file_summary ? "Bảo toàn cấu trúc nghiệp vụ" : "Điền khuyết chuẩn hoá tự động"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-1">
          <div className="flex justify-between items-center text-[#5C5570] text-xs font-semibold">
            <span>Khử Trùng Bản Ghi</span>
            <i className="fa-solid fa-code-compare text-[#8F60BF]" />
          </div>
          <span className="text-2xl font-black font-mono text-[#8F60BF] block">
            {(stats?.deduplicated_rows ?? 0).toLocaleString()} dòng
          </span>
          <span className="text-[11px] text-[#8F60BF] font-semibold block">
            Pandas drop_duplicates()
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-1">
          <div className="flex justify-between items-center text-[#5C5570] text-xs font-semibold">
            <span>Doanh Thu Trùng Lặp</span>
            <i className="fa-solid fa-money-bill-transfer text-[#D93848]" />
          </div>
          <span className="text-2xl font-black font-mono text-[#D93848] block">
            {formatVND(stats?.virtual_revenue_deduplicated ?? 0)}
          </span>
          <span className="text-[11px] text-[#D93848] block">
            Bóc tách doanh thu ảo
          </span>
        </div>
      </div>

      {/* ZERO DATA LOSS POLICY BOX */}
      <div className="p-5 rounded-2xl bg-[#FAF6FD] border border-[#ECD8F2] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#ECD8F2]">
          <span className="text-xs font-bold text-[#1E1B2E] uppercase flex items-center space-x-1.5">
            <i className="fa-solid fa-filter-circle-dollar text-[#8F60BF]" />
            <span>Quy chuẩn xử lý khuyết thiếu &amp; Tiêu chí khử trùng lặp (Zero Data Loss Policy)</span>
          </span>
          <span className="text-[11px] font-mono font-bold text-[#079DD9] bg-white px-2.5 py-0.5 rounded border border-[#ECD8F2]">
            ZERO DATA LOSS POLICY
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-[#ECD8F2] space-y-1">
            <span className="font-bold text-[#8F60BF] block">1. Xử lý dữ liệu trống / khuyết thiếu:</span>
            <ul className="space-y-1 text-[#5C5570] list-disc pl-4">
              {missingPolicies.map((p, idx) => (
                <li key={idx}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="p-3 bg-white rounded-xl border border-[#ECD8F2] space-y-1">
            <span className="font-bold text-[#079DD9] block">2. Tiêu chí khử trùng lặp:</span>
            <ul className="space-y-1 text-[#5C5570] list-disc pl-4">
              {duplicatePolicies.map((p, idx) => (
                <li key={idx}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* AI CLEANSING PLAN TABLE */}
      <div className="p-5 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#ECD8F2]">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-[#1E1B2E] uppercase tracking-wide">
              Bảng đề xuất chuẩn hoá dữ liệu tự động (AI Cleansing Plan)
            </h4>
            <p className="text-xs text-[#5C5570] mt-0.5">
              {cleansingPlanData?.file_summary || "Được phân tích tự động bằng Gemini AI & Pandas dựa trên cấu trúc thực tế của tệp."}
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-[#FAF6FD] text-[#8F60BF] px-3 py-1 rounded-lg border border-[#ECD8F2]">
            Quy Chuẩn Kiểm Toán
          </span>
        </div>

        <div className="overflow-x-auto border border-[#ECD8F2] rounded-xl">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-[#FAF8FC] text-[#5C5570] border-b border-[#ECD8F2]">
                <th className="p-3 w-12 text-center">Duyệt</th>
                <th className="p-3">Hạng mục phát hiện</th>
                <th className="p-3 text-center">Quy mô vi phạm</th>
                <th className="p-3">Đề xuất xử lý từ hệ thống</th>
                <th className="p-3 text-right">Tác động số liệu</th>
                <th className="p-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECD8F2]">
              {cleansingPlanItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#FAF8FC] transition">
                  <td className="p-3 text-center">
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#8F60BF] rounded" />
                  </td>
                  <td className="p-3 font-semibold text-[#1E1B2E]">{item.category}</td>
                  <td className="p-3 text-center font-mono font-bold text-[#8F60BF]">{item.violation_scale}</td>
                  <td className="p-3 text-[#5C5570]">{item.recommendation}</td>
                  <td className="p-3 text-right font-mono font-bold text-[#1E1B2E]">{item.financial_impact}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        item.status === "ĐÃ KHỚP"
                          ? "bg-[#99D9F2]/20 text-[#079DD9]"
                          : item.status === "ĐIỀN KHUYẾT"
                          ? "bg-[#ECD8F2] text-[#8F60BF]"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cleansed Preview Table (Cleaned Dataset) */}
      <div className="p-6 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#ECD8F2] gap-2">
          <div>
            <h3 className="font-extrabold text-base text-[#1E1B2E] flex items-center space-x-2">
              <span>Bản dữ liệu đã làm sạch &amp; Chuẩn hoá hoàn tất (Cleaned Dataset)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF6FC] text-[#079DD9] border border-[#079DD9]/30">
                VERIFIED
              </span>
            </h3>
            <p className="text-xs text-[#5C5570]">
              Dữ liệu thực tế đã được chuẩn hoá theo các cột của tệp tải lên, bảo toàn 100% dòng dữ liệu.
            </p>
          </div>
          <button
            onClick={onOpenFullDataset}
            className="px-3.5 py-1.5 rounded-xl border border-[#ECD8F2] hover:bg-[#FAF6FD] text-[#8F60BF] text-xs font-bold transition flex items-center space-x-1.5 self-start sm:self-center"
          >
            <i className="fa-solid fa-table-list" />
            <span>Xem Toàn Bộ {(cleansingPlanData?.total_cleaned_rows ?? orders.length).toLocaleString()} Dòng</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#ECD8F2]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF8FC] text-[#5C5570] font-semibold border-b border-[#ECD8F2]">
              <tr>
                {hasDynamicData ? (
                  <>
                    <th className="p-3 text-center w-12">STT</th>
                    {dynamicCols.map((c) => (
                      <th key={c} className="p-3 whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                    <th className="p-3 text-center whitespace-nowrap">Trạng Thái Audit</th>
                  </>
                ) : (
                  <>
                    <th className="p-3 text-center">STT</th>
                    <th className="p-3">Mã Đơn</th>
                    <th className="p-3">Ngày Đơn</th>
                    <th className="p-3">Kênh Bán</th>
                    <th className="p-3 text-right">Doanh Thu Thô</th>
                    <th className="p-3 text-right">Voucher</th>
                    <th className="p-3 text-right">Giá Vốn</th>
                    <th className="p-3 text-right">Hoàn Trả</th>
                    <th className="p-3 text-center">Trạng Thái Đối Soát</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECD8F2]">
              {hasDynamicData
                ? dynamicSample.slice(0, 10).map((r, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF8FC] transition">
                      <td className="p-3 text-center font-mono text-[#5C5570]">{idx + 1}</td>
                      {dynamicCols.map((c) => {
                        const val = r[c];
                        const displayVal =
                          val === null || val === undefined
                            ? "-"
                            : typeof val === "number"
                            ? val >= 10000
                              ? formatVND(val)
                              : val.toLocaleString()
                            : String(val);
                        return (
                          <td key={c} className="p-3 whitespace-nowrap font-medium text-[#1E1B2E]">
                            {displayVal}
                          </td>
                        );
                      })}
                      <td className="p-3 text-center whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#EBF6FC] text-[#079DD9] border border-[#079DD9]/30">
                          {r._audit_status || "HỢP LỆ"}
                        </span>
                      </td>
                    </tr>
                  ))
                : previewOrders.map((o) => (
                    <tr key={o.stt} className="hover:bg-[#FAF8FC] transition">
                      <td className="p-3 text-center font-mono text-[#5C5570]">{o.stt}</td>
                      <td className="p-3 font-mono font-bold text-[#1E1B2E]">{o.order_id}</td>
                      <td className="p-3 font-mono text-[#5C5570]">{o.order_date}</td>
                      <td className="p-3 font-medium text-[#1E1B2E]">{o.channel}</td>
                      <td className="p-3 text-right font-mono font-semibold text-[#1E1B2E]">
                        {formatVND(o.gross_revenue)}
                      </td>
                      <td className="p-3 text-right font-mono text-[#5C5570]">{formatVND(o.discount)}</td>
                      <td className="p-3 text-right font-mono text-[#5C5570]">{formatVND(o.cogs)}</td>
                      <td className="p-3 text-right font-mono text-[#8F60BF] font-semibold">
                        {formatVND(o.return_value)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            o.return_value > 0 ? "bg-[#ECD8F2] text-[#8F60BF]" : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* HITL-1 Gate Footer */}
        <div className="pt-4 border-t border-[#ECD8F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-[#5C5570]">
            <i className="fa-solid fa-stamp text-[#8F60BF]" />
            <span>
              Chốt chặn kiểm soát: <strong>Data Steward &amp; Lead Analytics</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {!hitl1Approved ? (
              <button
                onClick={onApproveHitl1}
                className="px-5 py-2.5 rounded-xl bg-[#8F60BF] hover:bg-[#7b4fa8] text-white text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
              >
                <i className="fa-solid fa-check" />
                <span>Ký Duyệt &amp; Khóa Sổ Chuẩn Hoá (HITL-1)</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center space-x-1.5">
                  <i className="fa-solid fa-circle-check" />
                  <span>Đã Niêm Phong HITL-1</span>
                </span>
                <button
                  onClick={onProceedToStep3}
                  className="px-5 py-2.5 rounded-xl bg-[#079DD9] hover:bg-[#068ac0] text-white text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
                >
                  <span>Chuyển Sang Bước 3</span>
                  <i className="fa-solid fa-arrow-right" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
