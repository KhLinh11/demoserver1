"use client";

import React, { useState } from "react";
import { OrderRecord } from "@/types";
import { formatVND } from "@/lib/format";

interface FullDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderRecord[];
  onDownloadCsv: () => void;
}

export function FullDatasetModal({
  isOpen,
  onClose,
  orders,
  onDownloadCsv,
}: FullDatasetModalProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 50;
  const totalPages = Math.ceil(orders.length / pageSize) || 1;

  if (!isOpen) return null;

  const currentItems = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full border border-[#ECD8F2] p-6 space-y-4 shadow-2xl my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#ECD8F2] gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8F60BF] text-white flex items-center justify-center text-lg font-bold shadow-xs">
              <i className="fa-solid fa-database text-[#99D9F2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-[#1E1B2E]">
                  SỔ DỮ LIỆU ĐÃ QUA XỬ LÝ TOÀN PHẦN (FULL DATASET AUDIT)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF6FD] text-[#8F60BF] border border-[#ECD8F2]">
                  {orders.length.toLocaleString()} BẢN GHI
                </span>
              </div>
              <p className="text-xs text-[#5C5570]">
                Bảo toàn nguyên vẹn 100% sổ cái giao dịch thực tế sau khi khử trùng đa chạm và đối soát hoàn hàng.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onDownloadCsv}
              className="px-3.5 py-1.5 rounded-xl border border-[#ECD8F2] hover:bg-[#FAF6FD] text-[#8F60BF] text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
            >
              <i className="fa-solid fa-file-csv" />
              <span>Tải Sổ CSV</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl border border-[#ECD8F2] hover:bg-slate-100 flex items-center justify-center text-[#5C5570] hover:text-[#1E1B2E]"
            >
              <i className="fa-solid fa-xmark text-sm" />
            </button>
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-[#ECD8F2]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF8FC] text-[#5C5570] font-semibold sticky top-0 border-b border-[#ECD8F2] shadow-xs">
              <tr>
                <th className="p-3 text-center">STT</th>
                <th className="p-3">Mã Đơn</th>
                <th className="p-3">Ngày Đơn</th>
                <th className="p-3">Kênh Bán</th>
                <th className="p-3 text-right">Doanh Thu Thô</th>
                <th className="p-3 text-right">Voucher</th>
                <th className="p-3 text-right">Giá Vốn</th>
                <th className="p-3 text-right">Hoàn Trả</th>
                <th className="p-3 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECD8F2]">
              {currentItems.map((o) => (
                <tr key={o.stt} className="hover:bg-[#FAF6FD] transition">
                  <td className="p-2.5 text-center font-mono text-[#5C5570]">{o.stt}</td>
                  <td className="p-2.5 font-mono font-bold text-[#1E1B2E]">{o.order_id}</td>
                  <td className="p-2.5 font-mono text-[#5C5570]">{o.order_date}</td>
                  <td className="p-2.5 font-medium text-[#1E1B2E]">{o.channel}</td>
                  <td className="p-2.5 text-right font-mono font-semibold text-[#1E1B2E]">
                    {formatVND(o.gross_revenue)}
                  </td>
                  <td className="p-2.5 text-right font-mono text-[#5C5570]">
                    {formatVND(o.discount)}
                  </td>
                  <td className="p-2.5 text-right font-mono text-[#5C5570]">
                    {formatVND(o.cogs)}
                  </td>
                  <td className="p-2.5 text-right font-mono text-[#8F60BF] font-semibold">
                    {formatVND(o.return_value)}
                  </td>
                  <td className="p-2.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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

        {/* Pagination Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#ECD8F2] text-xs">
          <span className="text-[#5C5570]">
            Trang <strong>{currentPage}</strong> / {totalPages} (Tổng {orders.length.toLocaleString()} dòng)
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl border border-[#ECD8F2] disabled:opacity-40 font-bold hover:bg-[#FAF6FD]"
            >
              Trang Trước
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl border border-[#ECD8F2] disabled:opacity-40 font-bold hover:bg-[#FAF6FD]"
            >
              Trang Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
