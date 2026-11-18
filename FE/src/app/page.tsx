"use client";

import React, { useEffect, useState } from "react";
import {
  AttributionModel,
  ChannelMetric,
  CleansingStats,
  OrderRecord,
  PnLSummary,
} from "@/types";
import { processClientDataset } from "@/lib/engine";
import {
  checkBackendHealth,
  createRun,
  downloadReportCsv,
  downloadReportPdf,
} from "@/lib/api/client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { FloatingMascot } from "@/components/assistant/FloatingMascot";
import { HeroHeader } from "@/components/hero/HeroHeader";
import { WorkflowNavigation } from "@/components/workflow/WorkflowNavigation";
import { Step1Upload } from "@/components/steps/Step1Upload";
import { Step2Cleansing } from "@/components/steps/Step2Cleansing";
import { Step3Diagnosis } from "@/components/steps/Step3Diagnosis";
import { Step4Simulation } from "@/components/steps/Step4Simulation";
import { Step5PnL } from "@/components/steps/Step5PnL";
import { ExecutiveReportModal } from "@/components/modals/ExecutiveReportModal";
import { FullDatasetModal } from "@/components/modals/FullDatasetModal";
import { AgentDrawer } from "@/components/copilot/AgentDrawer";

export default function Home() {
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Business profile
  const [companyName, setCompanyName] = useState<string>("Công ty Cổ phần Gia dụng Gia Hòa");
  const [painpoints, setPainpoints] = useState<string>(
    "Nghi vấn nhận vơ doanh thu và hoàn hàng trễ sau chiến dịch 30 ngày.",
  );

  // Raw file & CSV Text State
  const [rawCsvText, setRawCsvText] = useState<string>("");
  const [, setRawFile] = useState<File | null>(null);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  // Analytics State
  const [stats, setStats] = useState<CleansingStats | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [pnl, setPnl] = useState<PnLSummary | null>(null);
  const [channels, setChannels] = useState<ChannelMetric[]>([]);
  const [availableDimensions, setAvailableDimensions] = useState<string[]>(["Kênh bán"]);
  const [activeDimension, setActiveDimension] = useState<string>("Kênh bán");
  const [totalRawRows, setTotalRawRows] = useState<number>(0);
  const [isSampled, setIsSampled] = useState<boolean>(false);

  // Simulation Controls
  const [attributionModel, setAttributionModel] = useState<AttributionModel>("data_driven");
  const [returnFactor, setReturnFactor] = useState<number>(1.0);

  // Gates & Modals
  const [hitl1Approved, setHitl1Approved] = useState<boolean>(false);
  const [, setHitl2Approved] = useState<boolean>(false);
  const [isExecutiveModalOpen, setIsExecutiveModalOpen] = useState<boolean>(false);
  const [isFullDatasetModalOpen, setIsFullDatasetModalOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 1. Initial health check & sample load / state restoration
  useEffect(() => {
    checkBackendHealth().then((isOnline) => {
      setBackendOnline(isOnline);
    });

    try {
      const raw = localStorage.getItem("vitara_fe_state");
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved) {
          if (saved.companyName) setCompanyName(saved.companyName);
          if (saved.painpoints) setPainpoints(saved.painpoints);
          if (saved.attributionModel) setAttributionModel(saved.attributionModel);
          if (saved.returnFactor) setReturnFactor(saved.returnFactor);
          if (saved.activeDimension) setActiveDimension(saved.activeDimension);
          if (saved.currentStep) setCurrentStep(saved.currentStep);
          if (saved.currentRunId) setCurrentRunId(saved.currentRunId);
          if (saved.rawCsvText) {
            applyCsvContent(saved.rawCsvText, saved.filename || "sample_data.csv", undefined, saved.activeDimension);
            return;
          }
        }
      }
    } catch {
      // Ignored
    }

    // Auto-load default sample on mount if no saved state
    loadSampleData("sample_data.csv");
  }, []);

  // 2. Persist state to localStorage on changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      try {
        const stateToSave = {
          companyName,
          painpoints,
          attributionModel,
          returnFactor,
          activeDimension,
          currentStep,
          currentRunId,
          rawCsvText: rawCsvText ? rawCsvText.slice(0, 500000) : "",
          filename: "sample_data.csv",
        };
        localStorage.setItem("vitara_fe_state", JSON.stringify(stateToSave));
      } catch (err) {
        console.warn("Failed to persist fe state", err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [companyName, painpoints, attributionModel, returnFactor, activeDimension, currentStep, currentRunId, rawCsvText]);

  const loadSampleData = async (filename: string = "sample_data.csv") => {
    try {
      setIsLoading(true);
      const res = await fetch(`/${filename}`);
      if (res.ok) {
        const text = await res.text();
        applyCsvContent(text, filename);
      }
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  const applyCsvContent = (
    text: string,
    filename: string,
    fileObj?: File,
    dimension?: string,
  ): { success: boolean; error?: string } => {
    try {
      setRawCsvText(text);
      const res = processClientDataset(text, attributionModel, returnFactor, dimension);
      setStats(res.stats);
      setOrders(res.orders);
      setPnl(res.pnl);
      setChannels(res.channels);
      setAvailableDimensions(res.availableDimensions);
      setActiveDimension(res.activeDimension);
      setTotalRawRows(res.totalRawRows);
      setIsSampled(res.isSampled);

      if (fileObj) setRawFile(fileObj);

      // If backend is online, sync in background
      if (backendOnline) {
        const blob = fileObj || new Blob([text], { type: "text/csv" });
        createRun(blob, filename, companyName, painpoints)
          .then((runInfo) => {
            setCurrentRunId(runInfo.id);
          })
          .catch(() => {});
      }
      return { success: true };
    } catch (err) {
      const msg = (err as Error).message;
      return { success: false, error: msg };
    }
  };

  // Recompute when user changes the active dimension
  const handleDimensionChange = (dimension: string) => {
    setActiveDimension(dimension);
    if (rawCsvText) {
      const res = processClientDataset(rawCsvText, attributionModel, returnFactor, dimension);
      setPnl(res.pnl);
      setChannels(res.channels);
      setOrders(res.orders);
    }
  };

  // Recompute when attribution model changes
  const handleModelChange = (model: AttributionModel) => {
    setAttributionModel(model);
    if (rawCsvText) {
      const res = processClientDataset(rawCsvText, model, returnFactor, activeDimension);
      setPnl(res.pnl);
      setChannels(res.channels);
    }
  };

  // Recompute when return factor changes
  const handleReturnFactorChange = (factor: number) => {
    setReturnFactor(factor);
    if (rawCsvText) {
      const res = processClientDataset(rawCsvText, attributionModel, factor, activeDimension);
      setPnl(res.pnl);
      setChannels(res.channels);
    }
  };

  // PDF Export
  const handleDownloadPdf = async () => {
    if (backendOnline && currentRunId) {
      try {
        await downloadReportPdf(currentRunId, `Bao_Cao_Kiem_Toan_${companyName}.pdf`);
        return;
      } catch {
        // Fallback to modal print
      }
    }
    setIsExecutiveModalOpen(true);
    alert(
      "💡 Bạn đang ở môi trường Web Tĩnh (Vercel).\n\nBản Tóm Tắt Kiểm Toán đã được mở trên màn hình! Bạn có thể nhấn 'In / Lưu PDF Trình Duyệt' (Ctrl+P) để lưu tệp PDF ngay lập tức.\n\nĐể tải file PDF A4 ReportLab do Backend Python sinh ra, hãy khởi chạy: .venv/bin/python -m BE",
    );
  };

  // CSV Export
  const handleDownloadCsv = async () => {
    if (backendOnline && currentRunId) {
      try {
        await downloadReportCsv(currentRunId, "So_Cai_Kiem_Toan.csv");
        return;
      } catch {
        // Fallback
      }
    }
    const header = `STT,Mã Đơn,Ngày Đơn,${activeDimension},Doanh Thu Thô,Voucher,Giá Vốn,Hoàn Trả,Trạng Thái\n`;
    const rows = orders
      .map(
        (o) =>
          `${o.stt},${o.order_id},${o.order_date},"${o.channel}",${o.gross_revenue},${o.discount},${o.cogs},${o.return_value},"${o.status}"`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `So_Cai_Kiem_Toan_${activeDimension}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#1E2E2A] flex flex-col justify-between selection:bg-[#34655F] selection:text-white">
      {/* 3D Hero Section */}
      <HeroHeader
        backendOnline={backendOnline}
        onStartAudit={() => {
          document.getElementById("workflow-section")?.scrollIntoView({ behavior: "smooth" });
        }}
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />

      {/* Main Container with Sidebar + Main Panels */}
      <div id="workflow-section" className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex gap-6 items-start">
        {/* Left Floating Sidebar Navigation (matching the uploaded image) */}
        <AppSidebar
          currentStep={currentStep}
          onSelectStep={(step) => {
            setCurrentStep(step);
            setMobileMenuOpen(false);
          }}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          companyName={companyName}
          isBackendOnline={backendOnline}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Top Mobile Bar with Menu toggle */}
          <div className="lg:hidden flex items-center justify-between p-3.5 rounded-2xl bg-[#F2F5F3] border border-[#D5DFD9]">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#34655F]" />
              <span className="font-black text-xs text-[#1E2E2A]">Danh mục &amp; Các bước kiểm toán</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#D5DFD9] text-xs font-bold text-[#34655F]"
            >
              {mobileMenuOpen ? "Đóng Menu" : "Mở Menu"}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden p-4 rounded-3xl bg-white border border-[#D5DFD9] shadow-md space-y-2">
              {[
                { s: 1, label: "Bước 1: Tải lên tệp dữ liệu bán hàng" },
                { s: 2, label: "Bước 2: Chuẩn hoá & Phê duyệt HITL-1" },
                { s: 3, label: "Bước 3: Chẩn đoán rủi ro dòng tiền" },
                { s: 4, label: "Bước 4: Mô phỏng What-If & Đảo thứ hạng" },
                { s: 5, label: "Bước 5: Báo cáo P&L 12 dòng & Biểu đồ" },
              ].map((m) => (
                <button
                  key={m.s}
                  type="button"
                  onClick={() => {
                    setCurrentStep(m.s);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    currentStep === m.s ? "bg-[#34655F] text-white" : "text-[#4A5D57] hover:bg-[#F2F5F3]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {/* Workflow Navigation Tabs */}
          <WorkflowNavigation
            currentStep={currentStep}
            onSelectStep={(step) => setCurrentStep(step)}
            hasData={orders.length > 0}
            hitl1Approved={hitl1Approved}
          />

          {/* Step Panels */}
          {currentStep === 1 && (
            <Step1Upload
              companyName={companyName}
              setCompanyName={setCompanyName}
              painpoints={painpoints}
              setPainpoints={setPainpoints}
              onFileLoaded={(content, filename, file) => {
                const res = applyCsvContent(content, filename, file);
                if (res.success) {
                  setCurrentStep(2);
                }
                return res;
              }}
              onQuickLoadSample={(filename) => {
                loadSampleData(filename);
                setCurrentStep(2);
              }}
              isLoading={isLoading}
              totalLoadedRows={orders.length}
              isSampled={isSampled}
              totalRawRows={totalRawRows}
            />
          )}

          {currentStep === 2 && (
            <Step2Cleansing
              stats={stats}
              orders={orders}
              hitl1Approved={hitl1Approved}
              onApproveHitl1={() => setHitl1Approved(true)}
              onOpenFullDataset={() => setIsFullDatasetModalOpen(true)}
              onProceedToStep3={() => setCurrentStep(3)}
            />
          )}

          {currentStep === 3 && (
            <Step3Diagnosis
              channels={channels}
              availableDimensions={availableDimensions}
              activeDimension={activeDimension}
              onDimensionChange={handleDimensionChange}
              onProceedToStep4={() => setCurrentStep(4)}
            />
          )}

          {currentStep === 4 && (
            <Step4Simulation
              channels={channels}
              attributionModel={attributionModel}
              onModelChange={handleModelChange}
              returnFactor={returnFactor}
              onReturnFactorChange={handleReturnFactorChange}
              availableDimensions={availableDimensions}
              activeDimension={activeDimension}
              onDimensionChange={handleDimensionChange}
              onProceedToStep5={() => setCurrentStep(5)}
            />
          )}

          {currentStep === 5 && (
            <Step5PnL
              pnl={pnl}
              channels={channels}
              availableDimensions={availableDimensions}
              activeDimension={activeDimension}
              onDimensionChange={handleDimensionChange}
              onDownloadPdf={handleDownloadPdf}
              onOpenExecutiveModal={() => setIsExecutiveModalOpen(true)}
              onApproveHitl2={() => {
                setHitl2Approved(true);
                alert(
                  "✅ Ký Duyệt Thành Công!\n\nBan Giám Đốc đã phê duyệt phương án chốt sổ và điều chuyển ngân sách. Chữ ký số đã được lưu vào sổ cái kiểm toán.",
                );
              }}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-[#D5DFD9] bg-white py-6 px-4 text-center text-xs text-[#5C6E68]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Vitara Data Platform · Nền Tảng Đối Soát Bán Lẻ &amp; Tối Ưu Lợi Nhuận Đa Chiều</span>
          <span>Chuẩn giao diện thân thiện Chirplingo &amp; Icon YouTube · Tự động trích mẫu 1.000 dòng</span>
        </div>
      </footer>

      {/* Floating Mascot & Expandable Upload Button (bottom-right) */}
      <FloatingMascot
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onGoToStep1={() => {
          setCurrentStep(1);
          document.getElementById("workflow-section")?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* Modals & Copilot Drawer */}
      <ExecutiveReportModal
        isOpen={isExecutiveModalOpen}
        onClose={() => setIsExecutiveModalOpen(false)}
        companyName={companyName}
        totalRows={orders.length}
        pnl={pnl}
        onDownloadBackendPdf={handleDownloadPdf}
      />

      <FullDatasetModal
        isOpen={isFullDatasetModalOpen}
        onClose={() => setIsFullDatasetModalOpen(false)}
        orders={orders}
        onDownloadCsv={handleDownloadCsv}
      />

      <AgentDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        companyName={companyName}
      />
    </div>
  );
}
