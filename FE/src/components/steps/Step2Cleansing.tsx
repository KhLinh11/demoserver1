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
}

export function Step2Cleansing({
  stats,
  orders,
  hitl1Approved,
  onApproveHitl1,
  onOpenFullDataset,
  onProceedToStep3,
}: Step2CleansingProps) {
  const previewOrders = orders.slice(0, 8);

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
            <span>Điền Khuyết Voucher</span>
            <i className="fa-solid fa-ticket text-amber-500" />
          </div>
          <span className="text-2xl font-black font-mono text-[#1E1B2E] block">
            {(stats?.missing_imputed ?? 0).toLocaleString()} đơn
          </span>
          <span className="text-[11px] text-[#5C5570] block">
            Tự động gán mặc định = 0 ₫
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-1">
          <div className="flex justify-between items-center text-[#5C5570] text-xs font-semibold">
            <span>Khử Trùng Đa Chạm</span>
            <i className="fa-solid fa-code-compare text-[#8F60BF]" />
          </div>
          <span className="text-2xl font-black font-mono text-[#8F60BF] block">
            {(stats?.deduplicated_rows ?? 0).toLocaleString()} đơn
          </span>
          <span className="text-[11px] text-[#8F60BF] font-semibold block">
            Bóc tách ghi nhận trùng lặp
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
            Doanh thu nhận vơ giữa các kênh
          </span>
        </div>
      </div>

      {/* Cleansed Preview Table */}
      <div className="p-6 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#ECD8F2] gap-2">
          <div>
            <h3 className="font-extrabold text-base text-[#1E1B2E]">
              Trích Xuất Sổ Giao Dịch Đã Được Chuẩn Hoá
            </h3>
            <p className="text-xs text-[#5C5570]">
              Hiển thị 8 đơn hàng tiêu biểu sau quy trình tiền xử lý, gán công tiếp thị và đối soát hoàn hàng.
            </p>
          </div>
          <button
            onClick={onOpenFullDataset}
            className="px-3.5 py-1.5 rounded-xl border border-[#ECD8F2] hover:bg-[#FAF6FD] text-[#8F60BF] text-xs font-bold transition flex items-center space-x-1.5 self-start sm:self-center"
          >
            <i className="fa-solid fa-table-list" />
            <span>Xem Toàn Bộ {orders.length.toLocaleString()} Dòng</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#ECD8F2]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF8FC] text-[#5C5570] font-semibold border-b border-[#ECD8F2]">
              <tr>
                <th className="p-3 text-center">STT</th>
                <th className="p-3">Mã Đơn</th>
                <th className="p-3">Ngày Đơn</th>
                <th className="p-3">Kênh Bán</th>
                <th className="p-3 text-right">Doanh Thu Thô</th>
                <th className="p-3 text-right">Voucher</th>
                <th className="p-3 text-right">Giá Vốn</th>
                <th className="p-3 text-right">Hoàn Trả</th>
                <th className="p-3 text-center">Trạng Thái Đối Soát</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECD8F2]">
              {previewOrders.map((o) => (
                <tr key={o.stt} className="hover:bg-[#FAF6FD] transition">
                  <td className="p-3 text-center font-mono text-[#5C5570]">{o.stt}</td>
                  <td className="p-3 font-mono font-bold text-[#1E1B2E]">{o.order_id}</td>
                  <td className="p-3 font-mono text-[#5C5570]">{o.order_date}</td>
                  <td className="p-3 font-medium text-[#1E1B2E]">{o.channel}</td>
                  <td className="p-3 text-right font-mono font-semibold text-[#1E1B2E]">
                    {formatVND(o.gross_revenue)}
                  </td>
                  <td className="p-3 text-right font-mono text-[#5C5570]">
                    {formatVND(o.discount)}
                  </td>
                  <td className="p-3 text-right font-mono text-[#5C5570]">
                    {formatVND(o.cogs)}
                  </td>
                  <td className="p-3 text-right font-mono text-[#8F60BF] font-semibold">
                    {formatVND(o.return_value)}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        o.return_value > 0
                          ? "bg-[#ECD8F2] text-[#8F60BF]"
                          : "bg-emerald-100 text-emerald-800"
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
