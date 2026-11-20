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
} from "@/lib/api/client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { FloatingMascot } from "@/components/assistant/FloatingMascot";
import { HeroHeader } from "@/components/hero/HeroHeader";
import { Step1Upload } from "@/components/steps/Step1Upload";
import { Step2Cleansing } from "@/components/steps/Step2Cleansing";
import { Step3Diagnosis } from "@/components/steps/Step3Diagnosis";
import { Step4Simulation } from "@/components/steps/Step4Simulation";
import { Step5PnL } from "@/components/steps/Step5PnL";
import { ExecutiveReportModal } from "@/components/modals/ExecutiveReportModal";
import { FullDatasetModal } from "@/components/modals/FullDatasetModal";
import { AgentDrawer } from "@/components/copilot/AgentDrawer";

const stepBadges: Record<number, string> = {
  1: "Bước 1: Tích hợp nguồn",
  2: "Bước 2: Chuẩn hoá dữ liệu",
  3: "Bước 3: Phân tích dữ liệu",
  4: "Bước 4: Nguyên nhân & Đề xuất",
  5: "Bước 5: Tổng kết & Báo cáo",
};

export default function Home() {
  const [activeView, setActiveView] = useState<"hero" | "workflow">("workflow");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Business profile
  const [companyName, setCompanyName] = useState<string>("Công ty Cổ phần Gia dụng Gia Hòa");
  const [painpoints, setPainpoints] = useState<string>(
    "Nghi vấn nhận vơ doanh thu và hoàn hàng trễ sau chiến dịch 30 ngày.",
  );

  // Raw file & CSV Text State
  const [rawCsvText, setRawCsvText] = useState<string>("");
  const [, setRawFile] = useState<File | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>("sample_data.csv");
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
  const [cleansingPlanData, setCleansingPlanData] = useState<any>(null);
  const [diagnosisData, setDiagnosisData] = useState<any>(null);
  const [isRefreshingDiagnosis, setIsRefreshingDiagnosis] = useState<boolean>(false);
  const [step4Data, setStep4Data] = useState<any>(null);
  const [isRefreshingStep4, setIsRefreshingStep4] = useState<boolean>(false);
  const [step5Data, setStep5Data] = useState<any>(null);
  const [isRefreshingStep5, setIsRefreshingStep5] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchDiagnosis = (file?: File) => {
    setIsRefreshingDiagnosis(true);
    if (file) {
      const fd = new FormData();
      fd.append("file", file);
      fetch("/api/diagnosis/analyze", { method: "POST", body: fd })
        .then((r) => r.json())
        .then((d) => {
          if (d && (d.markdown_report || d.dataset_title)) setDiagnosisData(d);
        })
        .catch(() => {})
        .finally(() => setIsRefreshingDiagnosis(false));
    } else {
      fetch("/api/diagnosis/latest")
        .then((r) => r.json())
        .then((d) => {
          if (d && d.markdown_report) {
            setDiagnosisData(d);
          } else {
            return fetch("/api/diagnosis/analyze", { method: "POST" })
              .then((res) => res.json())
              .then((analyzed) => {
                if (analyzed && (analyzed.markdown_report || analyzed.dataset_title)) {
                  setDiagnosisData(analyzed);
                }
              });
          }
        })
        .catch(() => {
          fetch("/api/diagnosis/analyze", { method: "POST" })
            .then((res) => res.json())
            .then((analyzed) => {
              if (analyzed && (analyzed.markdown_report || analyzed.dataset_title)) {
                setDiagnosisData(analyzed);
              }
            })
            .catch(() => {});
        })
        .finally(() => setIsRefreshingDiagnosis(false));
    }
  };

  const fetchStep4 = (force?: boolean) => {
    setIsRefreshingStep4(true);
    const url = force ? "/api/simulation/analyze" : "/api/simulation/latest";
    const opts = force ? { method: "POST" } : { method: "GET" };
    fetch(url, opts)
      .then((r) => {
        if (!r.ok) {
          if (!force && r.status === 404) {
            return fetch("/api/simulation/analyze", { method: "POST" }).then((res) => res.json());
          }
          throw new Error("HTTP " + r.status);
        }
        return r.json();
      })
      .then((d) => {
        if (d && (d.root_causes || d.rank_shift_table || d.five_whys)) {
          setStep4Data(d);
        }
      })
      .catch((err) => console.warn("Lỗi tải Step 4:", err))
      .finally(() => setIsRefreshingStep4(false));
  };

  const fetchStep5 = (force?: boolean) => {
    setIsRefreshingStep5(true);
    const url = force ? "/api/executive/analyze" : "/api/executive/latest";
    const opts = force ? { method: "POST" } : { method: "GET" };
    fetch(url, opts)
      .then((r) => {
        if (!r.ok) {
          if (!force && r.status === 404) {
            return fetch("/api/executive/analyze", { method: "POST" }).then((res) => res.json());
          }
          throw new Error("HTTP " + r.status);
        }
        return r.json();
      })
      .then((d) => {
        if (d && (d.charts || d.kpis || d.corrective_actions)) {
          setStep5Data(d);
        }
      })
      .catch((err) => console.warn("Lỗi tải Step 5:", err))
      .finally(() => setIsRefreshingStep5(false));
  };

  // 1. Initial health check & sample load / state restoration
  useEffect(() => {
    checkBackendHealth().then((isOnline) => {
      setBackendOnline(isOnline);
    });

    try {
      const raw = localStorage.getItem("vitara_app_state") || localStorage.getItem("vitara_fe_state");
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved) {
          if (saved.activeView) setActiveView(saved.activeView);
          if (saved.companyName) setCompanyName(saved.companyName);
          if (saved.painpoints) setPainpoints(saved.painpoints);
          if (saved.attributionModel) setAttributionModel(saved.attributionModel);
          if (saved.returnFactor) setReturnFactor(saved.returnFactor);
          if (saved.activeDimension) setActiveDimension(saved.activeDimension);
          if (saved.currentStep) setCurrentStep(saved.currentStep);
          if (saved.currentRunId) setCurrentRunId(saved.currentRunId);
          if (saved.fileName || saved.filename) setCurrentFileName(saved.fileName || saved.filename);
          if (saved.cleansingPlanData || saved.currentCleansingPlanData) {
            setCleansingPlanData(saved.cleansingPlanData || saved.currentCleansingPlanData);
          }
          if (saved.diagnosisData || saved.currentDiagnosisData) {
            setDiagnosisData(saved.diagnosisData || saved.currentDiagnosisData);
          }
          if (saved.step4Data || saved.currentStep4Data) {
            setStep4Data(saved.step4Data || saved.currentStep4Data);
          }
          if (saved.step5Data || saved.currentStep5Data) {
            setStep5Data(saved.step5Data || saved.currentStep5Data);
          }
          if (saved.hitl1Approved || saved.isCleansingApproved) {
            setHitl1Approved(saved.hitl1Approved || saved.isCleansingApproved);
          }
          const csvText = saved.rawCsvText || saved.rawCsvContent;
          if (csvText) {
            applyCsvContent(csvText, saved.fileName || saved.filename || "sample_data.csv", undefined, saved.activeDimension);
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load saved state", e);
    }

    // Default load sample data
    fetch("/api/sample-data")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch sample data");
        return res.text();
      })
      .then((csvText) => {
        applyCsvContent(csvText, "sample_data.csv");
      })
      .catch(() => {});
  }, []);

  // Fetch AI analyses when navigating to step
  useEffect(() => {
    if (currentStep === 3) {
      if (!diagnosisData) fetchDiagnosis();
      if (!cleansingPlanData) {
        fetch("/api/cleansing/latest")
          .then((r) => r.json())
          .then((d) => {
            if (d.status === "success") setCleansingPlanData(d);
          })
          .catch(() => {});
      }
    } else if (currentStep === 4) {
      if (!step4Data) fetchStep4(false);
    } else if (currentStep === 5) {
      if (!step5Data) fetchStep5(false);
    }
  }, [currentStep, diagnosisData, cleansingPlanData, step4Data, step5Data]);

  // 2. Persist state to localStorage on changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      try {
        const stateToSave = {
          activeView,
          companyName,
          painpoints,
          attributionModel,
          returnFactor,
          activeDimension,
          currentStep,
          rawCsvText: rawCsvText ? rawCsvText.slice(0, 300000) : "",
          filename: currentFileName || "sample_data.csv",
          cleansingPlanData,
          diagnosisData,
          step4Data,
          step5Data,
          hitl1Approved,
        };
        localStorage.setItem("vitara_app_state", JSON.stringify(stateToSave));
        localStorage.setItem("vitara_fe_state", JSON.stringify(stateToSave));
      } catch (err) {
        console.warn("Failed to persist state", err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [
    activeView,
    companyName,
    painpoints,
    attributionModel,
    returnFactor,
    activeDimension,
    currentStep,
    rawCsvText,
    currentFileName,
    cleansingPlanData,
    diagnosisData,
    step4Data,
    step5Data,
    hitl1Approved,
  ]);

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
      setCurrentFileName(filename);
      const res = processClientDataset(text, attributionModel, returnFactor, dimension);
      setStats(res.stats);
      setOrders(res.orders);
      setPnl(res.pnl);
      setChannels(res.channels);
      setAvailableDimensions(res.availableDimensions);
      setActiveDimension(res.activeDimension);
      setTotalRawRows(res.totalRawRows);
      setIsSampled(res.isSampled);

      if (fileObj) {
        setRawFile(fileObj);
        const fd = new FormData();
        fd.append("file", fileObj);
        fetch("/api/cleansing/analyze", {
          method: "POST",
          body: fd,
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.status === "success") {
              setCleansingPlanData(data);
            }
          })
          .catch((err) => console.warn("Lỗi phân tích cleansing:", err));

        setStep4Data(null);
        setStep5Data(null);
        fetchDiagnosis(fileObj);
      } else {
        setStep4Data(null);
        setStep5Data(null);
        fetchDiagnosis();
      }

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

  const handleDimensionChange = (dimension: string) => {
    setActiveDimension(dimension);
    if (rawCsvText) {
      const res = processClientDataset(rawCsvText, attributionModel, returnFactor, dimension);
      setPnl(res.pnl);
      setChannels(res.channels);
      setOrders(res.orders);
    }
  };

  const handleModelChange = (model: AttributionModel) => {
    setAttributionModel(model);
    if (rawCsvText) {
      const res = processClientDataset(rawCsvText, model, returnFactor, activeDimension);
      setPnl(res.pnl);
      setChannels(res.channels);
    }
  };

  const handleReturnFactorChange = (factor: number) => {
    setReturnFactor(factor);
    if (rawCsvText) {
      const res = processClientDataset(rawCsvText, attributionModel, factor, activeDimension);
      setPnl(res.pnl);
      setChannels(res.channels);
    }
  };

  const handleDownloadServerPdf = () => {
    const safeCompany = companyName.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]+/g, "_");
    const today = new Date().toISOString().slice(0, 10);
    const filename = `Bao_Cao_Dieu_Hanh_Buoc_5_${safeCompany}_${today}.pdf`;

    const a = document.createElement("a");
    a.href = `/api/step5/export/pdf?company_name=${encodeURIComponent(companyName || "")}`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadPdf = () => {
    handleDownloadServerPdf();
  };

  const handleExportCSV = async () => {
    if (backendOnline && currentRunId) {
      try {
        await downloadReportCsv(currentRunId);
        return;
      } catch {}
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

  const handleResetSession = () => {
    if (backendOnline) {
      fetch("/api/session/reset", { method: "POST" }).catch(() => {});
    }
    try {
      localStorage.removeItem("vitara_fe_state");
      localStorage.removeItem("vitara_app_state");
      sessionStorage.clear();
    } catch {}
    setRawCsvText("");
    setOrders([]);
    setPnl(null);
    setChannels([]);
    setHitl1Approved(false);
    setCurrentRunId(null);
    setStep4Data(null);
    setStep5Data(null);
    setCurrentStep(1);
    alert("✅ Đã làm mới phiên và xóa toàn bộ dữ liệu bộ nhớ đệm thành công!");
  };

  return (
    <div className="min-h-screen bg-[#FAF8FC] text-[#1E1B2E] flex flex-col font-sans">
      {/* 1. HERO VIEW */}
      {activeView === "hero" ? (
        <HeroHeader
          backendOnline={backendOnline}
          onStartAudit={() => setActiveView("workflow")}
          onOpenCopilot={() => setIsCopilotOpen(true)}
        />
      ) : (
        /* 2. WORKFLOW VIEW */
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Bar matching index.html */}
          <header className="px-6 py-3.5 bg-[#FAF6FD] border-b border-[#ECD8F2] flex items-center justify-between z-30 sticky top-0 backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#ECD8F2]/60 border border-[#BEB6F2] text-[#8F60BF] text-xs font-bold transition flex items-center space-x-2 shadow-2xs cursor-pointer"
                title="Bật / Tắt danh mục các bước"
              >
                <i className="fa-solid fa-bars text-sm text-[#079DD9]" />
                <span>Danh mục làm việc</span>
              </button>

              <span className="text-xs text-[#5C5570] hidden sm:inline-block">|</span>

              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#079DD9] animate-pulse" />
                <span className="text-xs font-extrabold text-[#1E1B2E]">
                  {stepBadges[currentStep] || `Bước ${currentStep}`}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsCopilotOpen(!isCopilotOpen)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#8F60BF] hover:text-white hover:bg-[#8F60BF] bg-white border border-[#BEB6F2] transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                title="Bật / Tắt Trợ Lý AI Copilot"
              >
                <i className="fa-solid fa-robot text-[#079DD9]" />
                <span>Trợ Lý AI</span>
              </button>
              <button
                onClick={handleResetSession}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#5C5570] hover:text-[#D93848] hover:bg-white transition cursor-pointer"
                title="Xóa dữ liệu lưu và làm mới toàn bộ"
              >
                <i className="fa-solid fa-rotate-left mr-1 text-[#D93848]" /> Làm Mới Phiên
              </button>
              <button
                onClick={() => setActiveView("hero")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#5C5570] hover:text-[#8F60BF] hover:bg-white transition cursor-pointer"
              >
                <i className="fa-solid fa-arrow-left mr-1 text-[#079DD9]" /> Về Trang Bìa
              </button>
            </div>
          </header>

          {/* Workflow Layout: Sidebar + Main Content Panel */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Collapsible Steps Sidebar */}
            <AppSidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              currentStep={currentStep}
              onSelectStep={(step) => setCurrentStep(step)}
              onOpenCopilot={() => setIsCopilotOpen(true)}
            />

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white transition-all duration-300">
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
                  onProceedToStep2={() => setCurrentStep(2)}
                  onBackToHero={() => setActiveView("hero")}
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
                  cleansingPlanData={cleansingPlanData}
                />
              )}

              {currentStep === 3 && (
                <Step3Diagnosis
                  channels={channels}
                  availableDimensions={availableDimensions}
                  activeDimension={activeDimension}
                  onDimensionChange={handleDimensionChange}
                  onProceedToStep4={() => setCurrentStep(4)}
                  onBackToStep2={() => setCurrentStep(2)}
                  diagnosisData={diagnosisData}
                  onRefreshDiagnosis={() => fetchDiagnosis()}
                  isRefreshing={isRefreshingDiagnosis}
                  cleansingPlanData={cleansingPlanData}
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
                  onBackToStep3={() => setCurrentStep(3)}
                  step4Data={step4Data}
                  onRefreshStep4={() => fetchStep4(true)}
                  isRefreshingStep4={isRefreshingStep4}
                />
              )}

              {currentStep === 5 && (
                <div id="step-panel-5">
                  <Step5PnL
                    pnl={pnl}
                    channels={channels}
                    availableDimensions={availableDimensions}
                    activeDimension={activeDimension}
                    onDimensionChange={handleDimensionChange}
                    onDownloadPdf={handleDownloadPdf}
                    onDownloadServerPdf={handleDownloadServerPdf}
                    onOpenExecutiveModal={() => setIsExecutiveModalOpen(true)}
                    onApproveHitl2={() => setHitl2Approved(true)}
                    step5Data={step5Data}
                    onRefreshStep5={() => fetchStep5(true)}
                    isRefreshingStep5={isRefreshingStep5}
                    onExportCsv={handleExportCSV}
                    onBackToStep4={() => setCurrentStep(4)}
                  />
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      {/* Floating Mascot in Bottom Right */}
      {!isCopilotOpen && (
        <FloatingMascot
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onGoToStep1={() => setCurrentStep(1)}
        />
      )}

      {/* Slide-out AI Copilot Agent Drawer */}
      <AgentDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        companyName={companyName}
      />

      {/* Modals */}
      <FullDatasetModal
        isOpen={isFullDatasetModalOpen}
        onClose={() => setIsFullDatasetModalOpen(false)}
        orders={orders}
        onDownloadCsv={handleExportCSV}
      />

      <ExecutiveReportModal
        isOpen={isExecutiveModalOpen}
        onClose={() => setIsExecutiveModalOpen(false)}
        companyName={companyName}
        totalRows={orders.length}
        pnl={pnl}
        onDownloadBackendPdf={handleDownloadServerPdf}
      />
    </div>
  );
}
