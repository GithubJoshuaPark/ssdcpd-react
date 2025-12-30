import type { FC } from "react";
import { useEffect, useState } from "react";
import {
  FaEdit,
  FaPlus,
  FaSave,
  FaSearch,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import {
  createDailyReport,
  deleteDailyReport,
  subscribeDailyReports,
  updateDailyReport,
} from "../../services/firebaseService";
import type { DailyReport, WbsItem } from "../../types_interfaces/wbs";
import { RichEditor } from "../common/RichEditor";

interface ProjectDailyReportsPerTaskProps {
  projectId: string;
  taskId: string;
  taskName: string;
  wbsItem: WbsItem;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  return dateStr.replace(/-/g, "/");
};

export const ProjectDailyReportsPerTask: FC<
  ProjectDailyReportsPerTaskProps
> = ({ projectId, taskId, taskName, wbsItem }) => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [newReport, setNewReport] = useState<{
    date: string;
    content: string;
    progress: number;
    status: "todo" | "in-progress" | "done" | "on-hold";
  }>({
    date: new Date().toISOString().split("T")[0],
    content: "",
    progress: wbsItem.progress || 0,
    status: wbsItem.status || "todo",
  });

  // Subscribe to realtime updates
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      try {
        unsubscribe = await subscribeDailyReports(taskId, data => {
          setReports(data);
        });
      } catch (error) {
        console.error("Failed to subscribe to daily reports:", error);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [taskId]);

  // Reset form when task changes
  useEffect(() => {
    setNewReport({
      date: new Date().toISOString().split("T")[0],
      content: "",
      progress: wbsItem.progress || 0,
      status: wbsItem.status || "todo",
    });
    setIsAdding(false);
    setEditingId(null);
  }, [taskId, wbsItem.progress, wbsItem.status]);

  const handleEditClick = (report: DailyReport) => {
    setEditingId(report.id);
    setNewReport({
      date: report.date,
      content: report.content,
      progress: report.progress,
      status: report.status,
    });
    setIsAdding(true);
  };

  const handleSaveReport = async () => {
    if (!newReport.content || !newReport.date) return;
    setLoading(true);

    try {
      if (editingId) {
        await updateDailyReport(editingId, {
          ...newReport,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await createDailyReport({
          projectId,
          wbsId: taskId,
          content: newReport.content,
          startDate: wbsItem.startDate,
          endDate: wbsItem.endDate,
          progress: newReport.progress,
          assignee: wbsItem.assignee,
          status: newReport.status,
          order: wbsItem.order,
          date: newReport.date,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      setIsAdding(false);
      setEditingId(null);
      // Reset logic: keep current date for convenience? or reset to today?
      // Let's reset to today for clean state.
      setNewReport({
        date: new Date().toISOString().split("T")[0],
        content: "",
        progress: newReport.progress,
        status: newReport.status,
      });
    } catch (error) {
      console.error("Error saving report:", error);
      alert("Failed to save report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      await deleteDailyReport(id);
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("Failed to delete report.");
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch =
      r.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.date.includes(searchTerm);
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div
      style={{
        marginTop: "40px",
        paddingTop: "40px",
        borderTop: "1px solid var(--card-border)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h3 style={{ fontSize: "1.2rem", margin: 0 }}>Daily Reports</h3>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--text-muted)",
              marginTop: "4px",
            }}
          >
            Track daily progress for:{" "}
            <span style={{ color: "var(--accent)" }}>{taskName}</span>
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => {
              setNewReport({
                date: new Date().toISOString().split("T")[0],
                content: "",
                progress: wbsItem.progress || 0,
                status: wbsItem.status || "todo",
              });
              setEditingId(null);
              setIsAdding(true);
            }}
            className="primary-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              fontSize: "0.9rem",
            }}
          >
            <FaPlus /> New
          </button>
        )}
      </div>

      {isAdding && (
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid var(--card-border)",
            marginBottom: "30px",
          }}
        >
          <h4 style={{ margin: "0 0 16px 0", fontSize: "1rem" }}>
            {editingId ? "Edit Daily Report" : "New Daily Report"}
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div className="auth-form-group">
              <label>Date</label>
              <input
                type="date"
                value={newReport.date}
                data-value={formatDate(newReport.date)}
                onChange={e =>
                  setNewReport(prev => ({ ...prev, date: e.target.value }))
                }
                className="auth-input custom-date-visual"
              />
            </div>
            <div className="auth-form-group">
              <label>Status</label>
              <select
                value={newReport.status}
                onChange={e =>
                  setNewReport(prev => ({
                    ...prev,
                    status: e.target.value as DailyReport["status"],
                  }))
                }
                className="auth-input"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
            <div className="auth-form-group">
              <label>Progress ({newReport.progress}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={newReport.progress}
                onChange={e =>
                  setNewReport(prev => ({
                    ...prev,
                    progress: Number(e.target.value),
                  }))
                }
                style={{ width: "100%", accentColor: "var(--accent)" }}
              />
            </div>
          </div>
          <div className="auth-form-group" style={{ marginBottom: "20px" }}>
            <label>Work Description</label>
            <RichEditor
              value={newReport.content}
              onChange={val =>
                setNewReport(prev => ({ ...prev, content: val }))
              }
              placeholder="What did you work on today?"
              minHeight="120px"
            />
          </div>
          <div className="daily-report-actions">
            <button
              onClick={handleSaveReport}
              disabled={loading}
              className="primary-btn"
              style={{
                padding: "12px 24px",
                opacity: loading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <FaSave /> {loading ? "Saving..." : editingId ? "Update" : "Save"}
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="primary-btn"
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #ef4444, #f87171)",
                boxShadow: "0 12px 30px rgba(239, 68, 68, 0.4)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <FaTimes /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* 조회기능 */}

      {reports.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            <FaSearch
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="Search date or content..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="auth-input"
              style={{ paddingLeft: "36px" }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="auth-input"
            style={{ width: "140px" }}
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
            <option value="on-hold">On Hold</option>
          </select>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {reports.length === 0 ? (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
              color: "var(--text-muted)",
              background: "rgba(255,255,255,0.02)",
              borderRadius: "8px",
            }}
          >
            No daily reports yet.
          </div>
        ) : filteredReports.length === 0 ? (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
              color: "var(--text-muted)",
              background: "rgba(255,255,255,0.02)",
              borderRadius: "8px",
            }}
          >
            No matching reports found.
          </div>
        ) : (
          filteredReports.map(report => (
            <div
              key={report.id}
              style={{
                padding: "20px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{ display: "flex", gap: "12px", alignItems: "center" }}
                >
                  <span
                    style={{
                      fontWeight: "600",
                      color: "var(--accent)",
                    }}
                  >
                    {formatDate(report.date)}
                  </span>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      padding: "2px 8px",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      marginLeft: "auto",
                      marginRight: "8px",
                    }}
                  >
                    {report.status} ({report.progress}%)
                  </span>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => handleEditClick(report)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                    title="Edit Report"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(report.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                    title="Delete Report"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div style={{ paddingLeft: "4px" }}>
                <RichEditor value={report.content} readOnly={true} />
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .daily-report-actions {
          display: flex;
          gap: 12px;
          margin-top: 30px;
          justify-content: flex-end;
        }
        @media (max-width: 768px) {
          .daily-report-actions {
            justify-content: center;
          }
        }

        .custom-date-visual {
          position: relative;
        }
        .custom-date-visual:not([data-value=""]):not(:focus)::-webkit-datetime-edit {
          color: transparent;
        }
        .custom-date-visual:not([data-value=""]):not(:focus)::after {
          content: attr(data-value);
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: inherit;
          pointer-events: none;
          font-size: 0.95rem;
        }
      `}</style>
    </div>
  );
};
