import type { Task } from "gantt-task-react";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import React, { useCallback, useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import {
  getProjectById,
  getWbsItemsByProject,
} from "../../services/firebaseService";
import type { Project } from "../../types_interfaces/project";
import DownloadDataWithExcelOrCsv from "../common/DownloadDataWithExcelOrCsv";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Toast } from "../common/Toast";

export const ShowGanttChartPerProject: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [projectData, wbsData] = await Promise.all([
        getProjectById(projectId),
        getWbsItemsByProject(projectId),
      ]);
      setProject(projectData);

      // Convert WbsItems to Gantt Tasks
      const ganttTasks: Task[] = wbsData.map(item => {
        const start = new Date(item.startDate);
        const end = new Date(item.endDate);
        // Ensure end date is at least same as start or after
        if (end < start) end.setDate(start.getDate());

        return {
          start,
          end,
          name: item.taskName,
          id: item.id || `temp-${Math.random()}`,
          type: "task",
          progress: item.progress,
          isDisabled: true,
          styles: {
            progressColor: "#3b82f6",
            progressSelectedColor: "#2563eb",
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            backgroundSelectedColor: "rgba(59, 130, 246, 0.4)",
          },
        };
      });

      // Sort tasks by start date
      ganttTasks.sort((a, b) => a.start.getTime() - b.start.getTime());

      if (ganttTasks.length === 0) {
        // Add a dummy task if empty to prevent library crash/empty state issue if handled poorly
        // But better to just handle empty state in UI
      }

      setTasks(ganttTasks);
    } catch (error) {
      console.error("Error loading Gantt data:", error);
      setToast({ message: "Failed to load Gantt chart data.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!userProfile) {
      navigate("/");
      return;
    }
    loadData();
  }, [loadData, userProfile, navigate]);

  const handleExportToPdf = async () => {
    const element = document.getElementById("gantt-container");
    if (!element) return;

    setLoading(true); // Show spinner during capture to indicate processing
    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`gantt_chart_${project?.projectName || "project"}.pdf`);
      setToast({ message: "Chart saved as PDF", type: "success" });
    } catch (error) {
      console.error("PDF Export Error:", error);
      setToast({ message: "Failed to export PDF", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div
      className="gantt-view-container"
      style={{
        padding: "40px 20px",
        maxWidth: "1400px",
        margin: "0 auto",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          marginBottom: "30px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="secondary-btn"
          style={{
            padding: "10px",
            borderRadius: "50%",
            width: "45px",
            height: "45px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FaArrowLeft />
        </button>
        <div>
          <h1 style={{ fontSize: "2rem", margin: 0 }}>Project Gantt Chart</h1>
          <p
            style={{
              color: "var(--accent)",
              margin: "4px 0 0 0",
              fontWeight: "600",
            }}
          >
            {project?.projectName}
          </p>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <button
            className={`glass-btn ${
              viewMode === ViewMode.Day ? "active-mode" : ""
            }`}
            onClick={() => setViewMode(ViewMode.Day)}
          >
            D
          </button>
          <button
            className={`glass-btn ${
              viewMode === ViewMode.Week ? "active-mode" : ""
            }`}
            onClick={() => setViewMode(ViewMode.Week)}
          >
            W
          </button>
          <button
            className={`glass-btn ${
              viewMode === ViewMode.Month ? "active-mode" : ""
            }`}
            onClick={() => setViewMode(ViewMode.Month)}
          >
            M
          </button>
          <button
            className="glass-btn glass-btn-primary"
            onClick={() => setIsDownloadOpen(true)}
          >
            Export
          </button>
          <button
            className="glass-btn glass-btn-primary"
            onClick={handleExportToPdf}
          >
            PDF
          </button>
        </div>
      </header>

      <section
        className="card"
        style={{
          padding: isMobile ? "10px" : "20px",
          overflowX: "auto", // Allow horizontal scroll for the chart specifically
          background: "#fff",
        }}
      >
        {tasks.length > 0 ? (
          <div
            id="gantt-container"
            className="gantt-chart-wrapper"
            style={{
              width: "100%", // Fit to container
              minWidth: isMobile ? "600px" : "100%", // Allow scroll on very small screens, but fit on desktop
              backgroundColor: "#fff",
            }}
          >
            <Gantt
              tasks={tasks}
              viewMode={viewMode}
              locale="ko-KR"
              columnWidth={
                viewMode === ViewMode.Month
                  ? isMobile
                    ? 60
                    : 150
                  : isMobile
                  ? 40
                  : 60
              }
              listCellWidth={isMobile ? "110px" : "155px"}
              barBackgroundColor="#a3e3ff"
              barProgressColor="#3b82f6"
              barProgressSelectedColor="#2563eb"
              fontSize={isMobile ? "11px" : "12px"}
              rowHeight={isMobile ? 45 : 40}
              headerHeight={isMobile ? 45 : 50}
            />
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "50px",
              color: "#666",
            }}
          >
            <p>No tasks available for this project. Add tasks in WBS View.</p>
            <button
              onClick={() => navigate(`/wbs/${projectId}`)}
              className="glass-btn glass-btn-primary"
              style={{ marginTop: "10px" }}
            >
              Go to WBS
            </button>
          </div>
        )}
      </section>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <DownloadDataWithExcelOrCsv
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        data={tasks.map(t => ({
          name: t.name,
          start: t.start.toLocaleDateString(),
          end: t.end.toLocaleDateString(),
          progress: t.progress + "%",
        }))}
        headers={[
          { key: "name", label: "Task Name" },
          { key: "start", label: "Start Date" },
          { key: "end", label: "End Date" },
          { key: "progress", label: "Progress" },
        ]}
        fileName={`gantt_${project?.projectName || "project"}`}
      />

      <style>{`
        .glass-btn {
          padding: 8px 16px;
          border-radius: 8px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-color, #eee);
          justify-content: center;
        }
        .glass-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }
        .active-mode {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.4);
          color: #60a5fa;
        }
        .glass-btn-primary {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.3);
          color: #60a5fa;
        }
        /* Override Gantt styles for better visibility */
        .gantt-chart-wrapper, .gantt-chart-wrapper div, .gantt-chart-wrapper text {
          font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif !important;
        }

        .gantt-chart-wrapper text {
          fill: #111 !important; /* Make SVG text (dates on chart) darker */
          font-weight: 500;
        }
        .gantt-chart-wrapper ._3_y5b { /* Header Background class might vary, target svg text generally */ }
        
        /* Library specific overrides often needed for table text */
        .gantt-chart-wrapper ._2dZTy, /* Header */
        .gantt-chart-wrapper ._3T4jK, /* List Rows */
        .gantt-chart-wrapper .taskListCell,
        .gantt-chart-wrapper .taskListHeader {
           color: #111 !important;
           font-weight: 600 !important;
        }
        
        /* Force specific SVG text elements to be dark */
        .gantt-chart-wrapper svg text {
          fill: #111 !important;
        }
        
        /* Ensure inputs or other text in list are dark */
        .gantt-chart-wrapper div {
           color: #111;
        }

        /* Custom Scrollbar for better aesthetics */
        .card::-webkit-scrollbar {
          height: 8px;
        }
        .card::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .card::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 4px;
        }
        .card::-webkit-scrollbar-thumb:hover {
          background: #aaa;
        }
      `}</style>
    </div>
  );
};
