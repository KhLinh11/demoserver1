"use client";

import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  RedCloseBadge,
  YtPlusIcon,
  YtUploadIcon,
} from "@/components/icons/YouTubeIcons";

interface Step1UploadProps {
  companyName: string;
  setCompanyName: (v: string) => void;
  painpoints: string;
  setPainpoints: (v: string) => void;
  onFileLoaded: (content: string, filename: string, rawFile?: File) => { success: boolean; error?: string };
  onQuickLoadSample: (sampleFilename: string) => void;
  isLoading: boolean;
  totalLoadedRows: number;
  isSampled?: boolean;
  totalRawRows?: number;
  onProceedToStep2?: () => void;
  onBackToHero?: () => void;
}

export function validateFileHeaders(filename: string, headerCols: string[]): string | null {
  const lowerHeaders = headerCols.map((h) => String(h || "").toLowerCase().trim().replace(/^["']|["']$/g, ""));
  // Chặn tệp lưu lượng mạng IDS / CICIoT2023
  const isNetwork = lowerHeaders.some((h) =>
    ["flow_duration", "header_length", "protocol type", "srate", "drate", "syn_flag_number"].includes(h)
  );
  if (isNetwork) {
    return "Tệp không phù hợp! Tệp phát hiện là dữ liệu lưu lượng mạng (CICIoT2023 / NIDR), không phải tệp dữ liệu kinh doanh/bán lẻ!";
  }
  return null;
}

export function Step1Upload({
  companyName,
  setCompanyName,
  painpoints,
  setPainpoints,
  onFileLoaded,
  onQuickLoadSample,
  isLoading,
  totalLoadedRows,
  onProceedToStep2,
  onBackToHero,
}: Step1UploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setErrorMsg("");

    const lowerName = file.name.toLowerCase();
    const isCsv = lowerName.endsWith(".csv");
    const isExcel = lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls");

    if (!isCsv && !isExcel) {
      setErrorMsg("Tệp không phù hợp! Hệ thống chỉ chấp nhận tệp định dạng CSV (.csv) hoặc Excel (.xlsx, .xls).");
      setSelectedFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          if (!buffer) {
            setErrorMsg("Tệp không phù hợp: Không thể đọc nội dung tệp Excel.");
            return;
          }
          const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });
          const firstSheet = wb.SheetNames[0];
          if (!firstSheet) {
            setErrorMsg("Tệp không phù hợp: Tệp Excel không chứa trang tính (sheet) nào.");
            return;
          }
          const ws = wb.Sheets[firstSheet];
          const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
          if (!rows || rows.length <= 1) {
            setErrorMsg("Tệp không phù hợp: Trang tính rỗng hoặc chỉ có dòng tiêu đề.");
            return;
          }

          const headerCols = (rows[0] || []).map((c: any) => String(c || ""));
          const headerErr = validateFileHeaders(file.name, headerCols);
          if (headerErr) {
            setErrorMsg(headerErr);
            setSelectedFileName("");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
          }

          const csvText = XLSX.utils.sheet_to_csv(ws);
          setSelectedFileName(file.name);

          const formData = new FormData();
          formData.append("file", file);
          fetch("/api/copilot/load-dataset", {
            method: "POST",
            body: formData,
          }).catch((err) => console.warn("Lỗi nạp tệp vào AI Copilot DuckDB:", err));

          const res = onFileLoaded(csvText, file.name, file);
          if (!res.success && res.error) {
            setErrorMsg(res.error);
            setSelectedFileName("");
          }
        } catch (err) {
          setErrorMsg("Tệp không phù hợp: Lỗi khi giải mã Excel (" + (err as Error).message + ")");
          setSelectedFileName("");
        }
      };
      reader.onerror = () => {
        setErrorMsg("Tệp không phù hợp: Lỗi khi đọc tệp từ thiết bị.");
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text || !text.trim()) {
        setErrorMsg("Tệp không phù hợp: Tệp CSV rỗng không có dữ liệu.");
        return;
      }

      const cleanText = text.replace(/^\uFEFF/, "");
      const firstLine = cleanText.split(/\r?\n/).find((l) => l.trim().length > 0) || "";
      let delim = ",";
      if ((firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length) delim = "\t";
      else if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) delim = ";";

      const headerCols = firstLine.split(delim).map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const headerErr = validateFileHeaders(file.name, headerCols);
      if (headerErr) {
        setErrorMsg(headerErr);
        setSelectedFileName("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setSelectedFileName(file.name);

      const formData = new FormData();
      formData.append("file", file);
      fetch("/api/copilot/load-dataset", {
        method: "POST",
        body: formData,
      }).catch((err) => console.warn("Lỗi nạp tệp vào AI Copilot DuckDB:", err));

      const res = onFileLoaded(text, file.name, file);
      if (!res.success && res.error) {
        setErrorMsg(res.error);
        setSelectedFileName("");
      }
    };
    reader.onerror = () => {
      setErrorMsg("Tệp không phù hợp: Lỗi khi đọc tệp từ thiết bị.");
    };
    reader.readAsText(file);
  };

  const sampleDatasets = [
    {
      file: "28_lai_lo_cua_hang.csv",
      title: "🏢 Lãi Lỗ Cửa Hàng & Khu Vực",
      desc: "72 dòng · Chiều: Khu vực, Cửa hàng, Tháng · Chỉ số: Doanh thu, Chi phí, Lợi nhuận",
      badge: "Khu vực / Store",
    },
    {
      file: "du-lieu-test-ban-le.csv",
      title: "🛍️ Bán Lẻ Đa Chiều Hàng Hoá",
      desc: "52 dòng · Chiều: Sản phẩm, Kênh bán, Khu vực · Chỉ số: Doanh thu, Giá vốn, Lãi gộp",
      badge: "Sản phẩm / Kênh",
    },
    {
      file: "sales_data.csv",
      title: "📊 Doanh Số Đơn Hàng Toàn Quốc",
      desc: "15.000 dòng (Trích mẫu 1.000 dòng) · Chiều: Region, Category, Channel, Segment",
      badge: "Mẫu lớn 1.000 dòng",
    },
    {
      file: "sample_data.csv",
      title: "⚡ Đơn Hàng Đa Kênh Tiêu Chuẩn",
      desc: "150 dòng · Chiều: Kênh bán (Shopee, TikTok, Store, Combo) · Kiểm toán 12 dòng",
      badge: "Giao dịch chuẩn",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 2-Column Responsive Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card 1: Hồ Sơ Doanh Nghiệp */}
        <div className="relative p-6 rounded-3xl bg-[#FAF6FD] border border-[#ECD8F2] shadow-sm space-y-4">
          <div className="absolute -top-3 -right-3 z-10">
            <RedCloseBadge
              title="Đặt lại thông tin hồ sơ"
              onClick={() => {
                setCompanyName("Công ty Cổ phần Gia dụng Gia Hòa");
                setPainpoints("Nghi vấn nhận vơ doanh thu và hoàn hàng trễ sau chiến dịch 30 ngày.");
              }}
            />
          </div>

          <div className="pb-3 border-b border-[#ECD8F2] flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm sm:text-base text-[#1E1B2E] flex items-center space-x-2">
                <span>Hồ Sơ Doanh Nghiệp &amp; Định Hướng Kiểm Toán</span>
              </h3>
              <p className="text-[11px] text-[#5C5570] mt-0.5">
                Nhập thực trạng và câu hỏi đối soát để mô hình tính toán chuẩn xác.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCompanyName("Công ty Cổ phần Gia dụng Gia Hòa (Chuỗi 28 showroom & E-commerce)");
                setPainpoints("Nghi vấn doanh thu ảo do tính trùng đa chạm giữa sàn TMĐT và Showroom; tỷ lệ hoàn hàng trễ ngoài 12 ngày sau khi chốt sổ quá cao.");
              }}
              className="text-xs font-bold text-[#079DD9] hover:underline bg-[#99D9F2]/20 hover:bg-[#99D9F2]/40 px-3 py-1.5 rounded-xl transition border border-[#079DD9]/30 cursor-pointer"
            >
              ⚡ Nạp Demo
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-extrabold text-[#1E1B2E] block">
                Tên Doanh Nghiệp <span className="text-red-500">*</span>:
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nhập tên doanh nghiệp..."
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#ECD8F2] focus:border-[#8F60BF] focus:outline-none text-[#1E1B2E] font-medium shadow-2xs transition placeholder:text-[#5C5570]/60"
              />
            </div>

            <div className="space-y-1">
              <label className="font-extrabold text-[#1E1B2E] block">
                Nghi Vấn / Nỗi Đau Vận Hành &amp; Thâm Hụt <span className="text-red-500">*</span>:
              </label>
              <textarea
                rows={3}
                value={painpoints}
                onChange={(e) => setPainpoints(e.target.value)}
                placeholder="Nhập thực trạng nghi vấn rò rỉ dòng tiền hoặc hoàn hàng..."
                className="w-full p-4 rounded-2xl bg-white border border-[#ECD8F2] focus:border-[#8F60BF] focus:outline-none text-[#1E1B2E] font-medium shadow-2xs transition placeholder:text-[#5C5570]/60"
              />
            </div>

            <div className="pt-2 flex flex-wrap gap-1.5 text-[11px]">
              <span className="text-[#5C5570] font-bold mr-1">Chủ đề gợi ý:</span>
              <button
                type="button"
                onClick={() =>
                  setPainpoints(
                    "Doanh thu báo cáo rất cao nhưng dòng tiền thực nhận bị thiếu hụt; nghi vấn các kênh marketing nhận trùng đơn của nhau.",
                  )
                }
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#FAF8FC] text-[#8F60BF] border border-[#ECD8F2] transition font-semibold cursor-pointer"
              >
                + Khử trùng lặp đa chạm
              </button>
              <button
                type="button"
                onClick={() =>
                  setPainpoints(
                    "Khách săn voucher rồi hoàn hàng trễ sau ngày thứ 12 khiến công ty gánh trọn chi phí giao hàng và mất giá vốn.",
                  )
                }
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#FAF8FC] text-[#8F60BF] border border-[#ECD8F2] transition font-semibold cursor-pointer"
              >
                + Hoàn hàng trễ 30d
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Nạp Tệp Dữ Liệu */}
        <div className="p-6 rounded-3xl bg-[#FAF6FD] border border-[#ECD8F2] shadow-sm space-y-4">
          <div className="pb-3 border-b border-[#ECD8F2] flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm sm:text-base text-[#1E1B2E] flex items-center space-x-2">
                <span>Nạp Tệp Bán Hàng Đa Kênh</span>
              </h3>
              <p className="text-[11px] text-[#5C5570] mt-0.5">
                Kéo thả tệp CSV hoặc Excel (hỗ trợ .xlsx, .xls) chứa thông tin giao dịch.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#ECD8F2] text-[#8F60BF]">
              Max 1.000 dòng
            </span>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 rounded-2xl border border-red-300 text-red-800 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-triangle-exclamation text-red-500" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg("")} className="text-xs font-bold underline cursor-pointer">
                Đóng
              </button>
            </div>
          )}

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2.5 ${
              dragOver
                ? "border-[#8F60BF] bg-[#FAF8FC]"
                : "border-[#BEB6F2] hover:border-[#8F60BF] bg-white hover:bg-[#FAF8FC]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            <div className="w-12 h-12 rounded-2xl bg-[#FAF6FD] border border-[#ECD8F2] text-[#8F60BF] flex items-center justify-center text-xl shadow-2xs">
              <YtUploadIcon className="w-6 h-6" />
            </div>

            <div>
              <span className="text-xs sm:text-sm font-black text-[#1E1B2E] block">
                Kéo thả file vào đây hoặc nhấp chuột để chọn tệp
              </span>
              <span className="text-[11px] text-[#5C5570] block mt-0.5">
                Hỗ trợ <strong>Excel (.xlsx, .xls)</strong> và <strong>CSV (.csv)</strong> · Tối đa 1.000 dòng
              </span>
            </div>

            <span className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white border border-[#ECD8F2] text-[#8F60BF] text-xs font-bold shadow-2xs">
              <YtPlusIcon className="w-3.5 h-3.5" />
              <span>Chọn Tệp Từ Thiết Bị</span>
            </span>
          </div>

          {/* Selected File confirmation */}
          {selectedFileName && !errorMsg && (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-600">
                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                </svg>
                <span>
                  Đã tiếp nhận: <strong>{selectedFileName}</strong> ({totalLoadedRows.toLocaleString()} dòng đối soát)
                </span>
              </div>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded-lg border border-emerald-200 font-bold text-emerald-700">
                Sẵn sàng
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Quick Sample Cards */}
      <div className="p-6 rounded-3xl bg-[#FAF6FD] border border-[#ECD8F2] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#ECD8F2] gap-1">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#079DD9]" />
            <h4 className="font-black text-xs sm:text-sm text-[#1E1B2E]">
              Hoặc Nạp Nhanh Bài Toán Mẫu (1-Click Test Tự Động):
            </h4>
          </div>
          <span className="text-[11px] text-[#5C5570]">
            Hệ thống tự động phát hiện mọi chiều &amp; chỉ số
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sampleDatasets.map((s) => (
            <button
              key={s.file}
              type="button"
              onClick={() => onQuickLoadSample(s.file)}
              disabled={isLoading}
              className="p-3.5 rounded-2xl border border-[#ECD8F2] bg-white hover:bg-[#FAF8FC] hover:border-[#8F60BF] text-left transition shadow-2xs flex flex-col justify-between space-y-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF6FD] text-[#8F60BF] border border-[#ECD8F2] inline-block mb-1.5">
                  {s.badge}
                </span>
                <h5 className="font-black text-xs text-[#1E1B2E] leading-snug">{s.title}</h5>
                <p className="text-[11px] text-[#5C5570] mt-1 line-clamp-2 leading-relaxed">{s.desc}</p>
              </div>
              <div className="pt-2 border-t border-[#ECD8F2] flex items-center justify-between text-[11px] font-extrabold text-[#8F60BF]">
                <span>Nạp mẫu này</span>
                <YtPlusIcon className="w-3.5 h-3.5 text-[#079DD9]" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#ECD8F2]">
        {onBackToHero && (
          <button
            type="button"
            onClick={onBackToHero}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[#ECD8F2] bg-white text-[#5C5570] text-sm font-bold hover:text-[#1E1B2E] transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <i className="fa-solid fa-arrow-left text-xs" />
            <span>Về Trang Bìa</span>
          </button>
        )}
        {onProceedToStep2 && (
          <button
            type="button"
            onClick={onProceedToStep2}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#8F60BF] hover:bg-[#7b4fa8] text-white rounded-xl text-sm font-bold transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer ml-auto"
          >
            <span>Bắt Đầu Quét &amp; Chuẩn Hoá (Sang Bước 2)</span>
            <i className="fa-solid fa-arrow-right text-xs text-[#99D9F2]" />
          </button>
        )}
      </div>
    </div>
  );
}
