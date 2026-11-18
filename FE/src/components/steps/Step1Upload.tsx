"use client";

import React, { useRef, useState } from "react";
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
  isSampled,
  totalRawRows,
}: Step1UploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setErrorMsg("");
    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setErrorMsg("Không thể đọc nội dung tệp.");
        return;
      }

      const res = onFileLoaded(text, file.name, file);
      if (!res.success && res.error) {
        setErrorMsg(res.error);
        setSelectedFileName("");
      }
    };
    reader.onerror = () => {
      setErrorMsg("Lỗi khi đọc tệp.");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleResetFile = () => {
    setSelectedFileName("");
    setErrorMsg("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sampleDatasets = [
    {
      file: "28_lai_lo_cua_hang.csv",
      title: "🏢 Lãi Lỗ Cửa Hàng & Khu Vực",
      desc: "72 dòng · Chiều: Khu vực, Cửa hàng, Tháng · Chỉ số: Doanh thu, Chi phí, Lợi nhuận",
      badge: "Khu vực / Store",
      accent: "text-[#34655F] border-[#34655F]",
    },
    {
      file: "du-lieu-test-ban-le.csv",
      title: "🛍️ Bán Lẻ Đa Chiều Hàng Hoá",
      desc: "52 dòng · Chiều: Sản phẩm, Kênh bán, Khu vực · Chỉ số: Doanh thu, Giá vốn, Lãi gộp",
      badge: "Sản phẩm / Kênh",
      accent: "text-[#079DD9] border-[#079DD9]",
    },
    {
      file: "sales_data.csv",
      title: "📊 Doanh Số Đơn Hàng Toàn Quốc",
      desc: "15.000 dòng (Trích mẫu 1.000 dòng) · Chiều: Region, Category, Channel, Segment",
      badge: "Mẫu lớn 1.000 dòng",
      accent: "text-emerald-700 border-emerald-600",
    },
    {
      file: "sample_data.csv",
      title: "⚡ Đơn Hàng Đa Kênh Tiêu Chuẩn",
      desc: "150 dòng · Chiều: Kênh bán (Shopee, TikTok, Store, Combo) · Kiểm toán 12 dòng",
      badge: "Giao dịch chuẩn",
      accent: "text-amber-700 border-amber-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 2-Column Responsive Card Grid (Inspired directly by the user's uploaded layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card 1: Hồ Sơ Doanh Nghiệp (Styled matching the left form card with red X button) */}
        <div className="relative p-6 rounded-3xl bg-[#FAFBF9] border border-[#D5DFD9] shadow-sm space-y-4">
          {/* Red close button at top-right */}
          <div className="absolute -top-3 -right-3 z-10">
            <RedCloseBadge
              title="Đặt lại thông tin hồ sơ"
              onClick={() => {
                setCompanyName("Công ty Cổ phần Gia dụng Gia Hòa");
                setPainpoints("Nghi vấn nhận vơ doanh thu và hoàn hàng trễ sau chiến dịch 30 ngày.");
              }}
            />
          </div>

          <div className="pb-3 border-b border-[#D5DFD9] flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm sm:text-base text-[#1E2E2A] flex items-center space-x-2">
                <span>Hồ Sơ Doanh Nghiệp &amp; Định Hướng Kiểm Toán</span>
              </h3>
              <p className="text-[11px] text-[#5C6E68] mt-0.5">
                Nhập thực trạng và câu hỏi đối soát để mô hình tính toán chuẩn xác.
              </p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-extrabold text-[#1E2E2A] block">
                Tên Doanh Nghiệp <span className="text-red-500">*</span>:
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nhập tên doanh nghiệp..."
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#D5DFD9] focus:border-[#34655F] focus:outline-none text-[#1E2E2A] font-medium shadow-2xs transition placeholder:text-[#9AA8A2]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-extrabold text-[#1E2E2A] block">
                Nghi Vấn / Nỗi Đau Vận Hành &amp; Thâm Hụt <span className="text-red-500">*</span>:
              </label>
              <textarea
                rows={3}
                value={painpoints}
                onChange={(e) => setPainpoints(e.target.value)}
                placeholder="Nhập thực trạng nghi vấn rò rỉ dòng tiền hoặc hoàn hàng..."
                className="w-full p-4 rounded-2xl bg-white border border-[#D5DFD9] focus:border-[#34655F] focus:outline-none text-[#1E2E2A] font-medium shadow-2xs transition placeholder:text-[#9AA8A2]"
              />
            </div>

            <div className="pt-2 flex flex-wrap gap-1.5 text-[11px]">
              <span className="text-[#5C6E68] font-bold mr-1">Chủ đề gợi ý:</span>
              <button
                type="button"
                onClick={() =>
                  setPainpoints(
                    "Doanh thu báo cáo rất cao nhưng dòng tiền thực nhận bị thiếu hụt; nghi vấn các kênh marketing nhận trùng đơn của nhau.",
                  )
                }
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#EBF2EE] text-[#34655F] border border-[#D5DFD9] transition font-semibold"
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
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#EBF2EE] text-[#34655F] border border-[#D5DFD9] transition font-semibold"
              >
                + Hoàn hàng trễ 30d
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Cách 1: Tải lên tệp dữ liệu bán hàng (Matching the card in the screenshot) */}
        <div className="relative p-6 rounded-3xl bg-[#FAFBF9] border border-[#D5DFD9] shadow-sm space-y-4">
          {/* Red close button at top-right to reset uploaded file */}
          {selectedFileName && (
            <div className="absolute -top-3 -right-3 z-10">
              <RedCloseBadge title="Hủy tệp hiện tại" onClick={handleResetFile} />
            </div>
          )}

          <div className="pb-3 border-b border-[#D5DFD9] flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm sm:text-base text-[#1E2E2A]">
                Cách 1: Tải lên tệp dữ liệu bán hàng (Excel .xlsx, .xls / CSV)
              </h3>
              <p className="text-[11px] text-[#5C6E68] mt-0.5">
                Tự động nhận diện mọi cấu trúc (Khu vực, Cửa hàng, Sản phẩm, Kênh bán, v.v.).
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#34655F]/15 text-[#34655F]">
              Chuẩn 1.000 dòng
            </span>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-[#FDEEED] rounded-2xl border border-[#D93848] text-[#D93848] text-xs font-semibold flex items-center space-x-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sampling notice banner */}
          {isSampled && (
            <div className="p-3 bg-[#EBF6FC] rounded-2xl border border-[#079DD9] text-[#079DD9] text-xs font-semibold flex items-center space-x-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              <span>
                ⚡ Tệp có {totalRawRows?.toLocaleString()} dòng. Hệ thống đã tự động trích mẫu 1.000 dòng đầu tiên để đối soát tức thì.
              </span>
            </div>
          )}

          {/* YouTube-style Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2.5 ${
              dragOver
                ? "border-[#34655F] bg-[#EBF2EE]"
                : "border-[#B8CAC2] hover:border-[#34655F] bg-[#F4F7F5] hover:bg-[#EBF2EE]"
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

            <div className="w-12 h-12 rounded-2xl bg-white border border-[#D5DFD9] text-[#34655F] flex items-center justify-center text-xl shadow-2xs">
              <YtUploadIcon className="w-6 h-6" />
            </div>

            <div>
              <span className="text-xs sm:text-sm font-black text-[#1E2E2A] block">
                Kéo thả file vào đây hoặc nhấp chuột để chọn tệp
              </span>
              <span className="text-[11px] text-[#5C6E68] block mt-0.5">
                Hỗ trợ <strong>Excel (.xlsx, .xls)</strong> và <strong>CSV (.csv)</strong> · Tối đa 1.000 dòng
              </span>
            </div>

            <span className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white border border-[#D5DFD9] text-[#34655F] text-xs font-bold shadow-2xs">
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

      {/* 4 Quick Sample Cards (1-Click Test matching the bottom-right actions & pill design) */}
      <div className="p-6 rounded-3xl bg-[#FAFBF9] border border-[#D5DFD9] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#D5DFD9] gap-1">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#34655F]" />
            <h4 className="font-black text-xs sm:text-sm text-[#1E2E2A]">
              Hoặc Nạp Nhanh Bài Toán Mẫu (1-Click Test Tự Động):
            </h4>
          </div>
          <span className="text-[11px] text-[#5C6E68]">
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
              className="p-3.5 rounded-2xl border border-[#D5DFD9] bg-white hover:bg-[#F2F5F3] hover:border-[#34655F] text-left transition shadow-2xs flex flex-col justify-between space-y-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F2F5F3] text-[#34655F] border border-[#D5DFD9] inline-block mb-1.5">
                  {s.badge}
                </span>
                <h5 className="font-black text-xs text-[#1E2E2A] leading-snug">{s.title}</h5>
                <p className="text-[11px] text-[#5C6E68] mt-1 line-clamp-2 leading-relaxed">{s.desc}</p>
              </div>
              <div className="pt-2 border-t border-[#F2F5F3] flex items-center justify-between text-[11px] font-extrabold text-[#34655F]">
                <span>Nạp mẫu này</span>
                <YtPlusIcon className="w-3.5 h-3.5 text-[#F8A528]" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
