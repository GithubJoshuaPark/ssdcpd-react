import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaChartBar,
  FaEdit,
  FaPlus,
  FaSave,
  FaSearch,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import {
  createWbsItem,
  deleteWbsItem,
  getProjectById,
  getWbsItemsByProject,
  sendEmailByAdminFunction,
  updateWbsItem,
} from "../../services/firebaseService";
import type { Project } from "../../types_interfaces/project";
import type { UserProfile } from "../../types_interfaces/userProfile";
import type { WbsItem } from "../../types_interfaces/wbs";
import { ConfirmDialog } from "../common/ConfirmDialog";
import DownloadDataWithExcelOrCsv from "../common/DownloadDataWithExcelOrCsv";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { RichEditor } from "../common/RichEditor";
import { Toast } from "../common/Toast";
import { UserPopup } from "../popups/UserPopup";
import { ProjectDailyReportsPerTask } from "./ProjectDailyReportsPerTask";

const stripHtml = (html: string) => {
  if (!html) return "";
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || "";
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  return dateStr.replace(/-/g, "/");
};

export const WbsView: FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === "admin";

  const [project, setProject] = useState<Project | null>(null);
  const [wbsItems, setWbsItems] = useState<WbsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<WbsItem | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "form">("list");
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  const [ccAssigneeInput, setCcAssigneeInput] = useState("");
  const [isUserPopupOpen, setIsUserPopupOpen] = useState(false);
  const [userPopupMode, setUserPopupMode] = useState<"single" | "multiple">(
    "single"
  );
  const [userPopupTarget, setUserPopupTarget] = useState<"assignee" | "cc">(
    "assignee"
  );

  const [formData, setFormData] = useState<
    Omit<WbsItem, "id" | "projectId" | "createdAt" | "updatedAt">
  >({
    taskName: "",
    description: "",
    startDate: "",
    endDate: "",
    progress: 0,
    assignee: "",
    status: "todo",
    order: 0,
  });

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [projectData, wbsData] = await Promise.all([
        getProjectById(projectId),
        getWbsItemsByProject(projectId),
      ]);
      setProject(projectData);
      setWbsItems(wbsData);
      const maxOrder =
        wbsData.length > 0 ? Math.max(...wbsData.map(i => i.order || 0)) : 0;
      setFormData(prev => ({ ...prev, order: maxOrder + 1 }));
    } catch (error) {
      console.error("Error loading WBS data:", error);
      setToast({ message: "Failed to load WBS data.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    // If not logged in, redirect to home
    if (!userProfile) {
      navigate("/");
      return;
    }
    loadData();
  }, [loadData, userProfile, navigate]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "progress" || name === "order" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !isAdmin) return;

    setProcessing(true);
    try {
      const now = new Date().toISOString();
      if (editingItem) {
        // Exclude 'order' from update to preserve existing order
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { order, ...rest } = formData;
        await updateWbsItem(projectId, editingItem.id!, {
          ...rest,
          cc_assignee: ccAssigneeInput
            .split(",")
            .map(s => s.trim())
            .filter(Boolean),
          updatedAt: now,
        });
        setToast({ message: "Task updated successfully!", type: "success" });
      } else {
        await createWbsItem({
          ...formData,
          cc_assignee: ccAssigneeInput
            .split(",")
            .map(s => s.trim())
            .filter(Boolean),
          projectId,
          createdAt: now,
          updatedAt: now,
        });
        setToast({ message: "Task added successfully!", type: "success" });
      }

      // Send Email Notification
      const extractEmail = (text: string) => {
        const match = text.match(/\(([^)]+)\)/);
        return match ? match[1] : text.trim();
      };

      const recipients = new Set<string>();
      if (formData.assignee) recipients.add(extractEmail(formData.assignee));

      const ccList = ccAssigneeInput
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
      ccList.forEach(cc => recipients.add(extractEmail(cc)));

      if (recipients.size > 0) {
        // Non-blocking email send (or await if intended to block UI)
        // User said "before resetForm", so we await to ensure it tries to send.
        // But to keep UI responsive, we might just fire and forget, OR await with catch.
        // User request implies "make sure to send".
        try {
          await sendEmailByAdminFunction(
            Array.from(recipients),
            `[Task Notification] ${formData.taskName}`,
            `Task Update in Project: ${
              project?.projectName || "Unknown Project"
            }\n\n` +
              `Task Name: ${formData.taskName}\n` +
              `Status: ${formData.status}\n` +
              `Dates: ${formData.startDate} ~ ${formData.endDate}\n` +
              `Progress: ${formData.progress}%\n\n` +
              `Description:\n${
                formData.description?.replace(/<[^>]+>/g, " ") || "-"
              }`,
            `<div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px;">
              <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px;">
                Task Notification
              </h2>
              <p>Hello,</p>
              <p>There has been an update to the following task in project <strong>${
                project?.projectName || "Unknown Project"
              }</strong>.</p>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Task Name</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${
                    formData.taskName
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Status</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">
                    <span style="
                      background-color: ${
                        formData.status === "in-progress"
                          ? "#3b82f6"
                          : formData.status === "done"
                          ? "#10b981"
                          : formData.status === "on-hold"
                          ? "#ef4444"
                          : "#9ca3af" // todo
                      };
                      color: white;
                      padding: 4px 8px;
                      border-radius: 4px;
                      font-size: 12px;
                      text-transform: uppercase;
                      font-weight: bold;
                    ">
                      ${formData.status}
                    </span>
                  </td>
                </tr>
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Dates</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">
                    ${formData.startDate} ~ ${formData.endDate}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Progress</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">
                    <div style="width: 100%; background-color: #eee; border-radius: 10px; height: 10px; overflow: hidden;">
                      <div style="width: ${
                        formData.progress
                      }%; background-color: #3b82f6; height: 100%;"></div>
                    </div>
                    <div style="font-size: 12px; margin-top: 4px;">${
                      formData.progress
                    }%</div>
                  </td>
                </tr>
              </table>

              <div style="margin-top: 25px;">
                <h3 style="font-size: 16px; color: #555; border-left: 4px solid #3b82f6; padding-left: 10px;">Description</h3>
                <div style="padding: 15px; background-color: #f9f9f9; border: 1px solid #eee; border-radius: 4px;">
                  ${formData.description || "No description provided."}
                </div>
              </div>

              <p style="margin-top: 30px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 10px;">
                This is an automated message from <strong>SSDCPD</strong> System.
              </p>
            </div>`
          );
        } catch (emailErr) {
          console.error("Failed to send email notification:", emailErr);
        }
      }

      resetForm();
      loadData();
      setActiveTab("list");
    } catch (error) {
      console.error("Error saving WBS item:", error);
      setToast({ message: "Failed to save task.", type: "error" });
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    const maxOrder =
      wbsItems.length > 0 ? Math.max(...wbsItems.map(i => i.order || 0)) : 0;

    setEditingItem(null);
    setCcAssigneeInput("");
    setFormData({
      taskName: "",
      description: "",
      startDate: "",
      endDate: "",
      progress: 0,
      assignee: "",
      status: "todo",
      order: maxOrder + 1,
    });
  };

  const handleEdit = (item: WbsItem) => {
    if (!isAdmin) return;
    setEditingItem(item);
    setCcAssigneeInput(item.cc_assignee?.join(", ") || "");

    setFormData({
      taskName: item.taskName,
      description: item.description || "",
      startDate: item.startDate,
      endDate: item.endDate,
      progress: item.progress,
      assignee: item.assignee || "",
      status: item.status,
      order: item.order,
    });

    setActiveTab("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = (id: string) => {
    if (!isAdmin) return;
    setItemToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!projectId || !itemToDeleteId) return;
    setProcessing(true);
    try {
      await deleteWbsItem(projectId, itemToDeleteId);
      setToast({ message: "Task deleted.", type: "success" });
      loadData();
    } catch (error) {
      console.error("Error deleting WBS item:", error);
      setToast({ message: "Failed to delete task.", type: "error" });
    } finally {
      setIsConfirmOpen(false);
      setItemToDeleteId(null);
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "#9ca3af";
      case "in-progress":
        return "var(--accent)";
      case "done":
        return "var(--primary)";
      case "on-hold":
        return "#ef4444";
      default:
        return "#9ca3af";
    }
  };

  const handlePopupSelect = (selectedUsers: UserProfile[]) => {
    if (userPopupTarget === "assignee") {
      if (selectedUsers.length > 0) {
        const u = selectedUsers[0];
        setFormData(prev => ({ ...prev, assignee: `${u.name} (${u.email})` }));
      }
    } else {
      const text = selectedUsers.map(u => `${u.name} (${u.email})`).join(", ");
      setCcAssigneeInput(text);
    }
  };

  const filteredItems = wbsItems.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.taskName.toLowerCase().includes(searchLower) ||
      (item.description || "").toLowerCase().includes(searchLower) ||
      (item.assignee || "").toLowerCase().includes(searchLower) ||
      item.status.toLowerCase().includes(searchLower)
    );
  });

  if (loading && !project) {
    return (
      <div style={{ padding: "100px", textAlign: "center" }}>
        <p>Loading WBS data...</p>
      </div>
    );
  }

  return (
    <div
      className="wbs-view-container"
      style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}
    >
      <header
        style={{
          marginBottom: "40px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
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
          <h1 style={{ fontSize: "2rem", margin: 0 }}>Project WBS</h1>
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
      </header>

      <style>
        {`
          .wbs-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 24px;
            padding: 4px;
          }
          .wbs-tab-btn {
            flex: 1;
            padding: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            color: var(--text-muted);
            border-radius: 12px;
            font-size: 0.95rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          .wbs-tab-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
          }
          .wbs-tab-btn.active {
            background: rgba(59, 130, 246, 0.2);
            border-color: rgba(59, 130, 246, 0.4);
            color: #60a5fa;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
          }
          .glass-btn {
            padding: 8px 16px;
            border-radius: 8px;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.9rem;
            border: 1px solid transparent;
          }
          .glass-btn-primary {
            background: rgba(59, 130, 246, 0.2);
            border-color: rgba(59, 130, 246, 0.3);
            color: #60a5fa;
          }
          .glass-btn-primary:hover {
            background: rgba(59, 130, 246, 0.3);
            border-color: rgba(59, 130, 246, 0.5);
            transform: translateY(-1px);
            color: white;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
          }
          .glass-btn-cancel {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            color: #fca5a5;
            justify-content: center;
          }
          .glass-btn-cancel:hover {
            background: rgba(239, 68, 68, 0.2);
            border-color: rgba(239, 68, 68, 0.4);
            transform: translateY(-1px);
            color: #fca5a5;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
          }
        `}
      </style>

      {isAdmin && (
        <div className="wbs-tabs">
          <button
            className={`wbs-tab-btn ${activeTab === "list" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("list");
              if (editingItem) resetForm();
            }}
          >
            Task List
          </button>
          <button
            className={`wbs-tab-btn ${activeTab === "form" ? "active" : ""}`}
            onClick={() => {
              if (activeTab === "list") resetForm();
              setActiveTab("form");
            }}
          >
            {editingItem ? "Edit Task" : "New Task"}
          </button>
        </div>
      )}

      {isAdmin && activeTab === "form" && (
        <section
          className="card"
          style={{ padding: "30px", marginBottom: "40px" }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            {editingItem ? (
              <>
                <FaEdit /> Edit Task
              </>
            ) : (
              <>
                <FaPlus /> Add New Task
              </>
            )}
          </h2>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="wbs-form-grid">
              <div className="auth-form-group wbs-col-span-2">
                <label>Task Name</label>
                <input
                  type="text"
                  name="taskName"
                  value={formData.taskName}
                  onChange={handleInputChange}
                  className="auth-input"
                  required
                  placeholder="What needs to be done?"
                />
              </div>
              <div className="auth-form-group">
                <label>Assignee</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    name="assignee"
                    value={formData.assignee}
                    onClick={() => {
                      setUserPopupMode("single");
                      setUserPopupTarget("assignee");
                      setIsUserPopupOpen(true);
                    }}
                    readOnly
                    className="auth-input"
                    style={{ cursor: "pointer", paddingRight: "30px" }}
                    placeholder="Click to select user"
                  />
                  {formData.assignee && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, assignee: "" })}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        fontSize: "1.2rem",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
              <div className="auth-form-group">
                <label>CC Assignee</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={ccAssigneeInput}
                    onClick={() => {
                      setUserPopupMode("multiple");
                      setUserPopupTarget("cc");
                      setIsUserPopupOpen(true);
                    }}
                    readOnly
                    className="auth-input"
                    style={{ cursor: "pointer", paddingRight: "30px" }}
                    placeholder="Click to select users"
                  />
                  {ccAssigneeInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setCcAssigneeInput("");
                        setFormData({ ...formData, cc_assignee: [] });
                      }}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        fontSize: "1.2rem",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
              <div className="auth-form-group wbs-col-span-2">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  data-value={formatDate(formData.startDate)}
                  onChange={handleInputChange}
                  className="auth-input custom-date-visual"
                  required
                />
              </div>
              <div className="auth-form-group wbs-col-span-2">
                <label>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  data-value={formatDate(formData.endDate)}
                  onChange={handleInputChange}
                  className="auth-input custom-date-visual"
                  required
                />
              </div>
              <div className="auth-form-group wbs-col-full">
                <label>Description</label>
                <div>
                  <RichEditor
                    value={formData.description || ""}
                    onChange={val =>
                      setFormData(prev => ({ ...prev, description: val }))
                    }
                    placeholder="Detailed explanation of the task..."
                    minHeight="80px"
                  />
                </div>
              </div>
              <div className="auth-form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="auth-input"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                  <option value="on-hold">On Hold</option>
                </select>
              </div>
              <div className="auth-form-group">
                <label>Order (Display Sequence)</label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  className="auth-input"
                  required
                  min="0"
                />
              </div>
              <div className="auth-form-group wbs-col-span-2">
                <label>Progress ({formData.progress}%)</label>

                <input
                  type="range"
                  name="progress"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={handleInputChange}
                  style={{ width: "100%", accentColor: "var(--accent)" }}
                />
              </div>
            </div>

            <div className="wbs-form-actions">
              <button
                type="submit"
                className="primary-btn"
                style={{ padding: "12px 24px" }}
              >
                {editingItem ? (
                  <>
                    <FaSave /> Update
                  </>
                ) : (
                  <>
                    <FaPlus /> Add
                  </>
                )}
              </button>
              {editingItem && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab("list");
                  }}
                  className="primary-btn"
                  style={{
                    padding: "12px 24px",
                    background: "linear-gradient(135deg, #ef4444, #f87171)",
                    boxShadow: "0 12px 30px rgba(239, 68, 68, 0.4)",
                    color: "#fff",
                  }}
                >
                  <FaTimes /> Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      {isAdmin && activeTab === "form" && editingItem && projectId && (
        <section
          className="card"
          style={{ padding: "30px", marginBottom: "40px" }}
        >
          <ProjectDailyReportsPerTask
            projectId={projectId}
            taskId={editingItem.id!}
            taskName={editingItem.taskName}
            wbsItem={editingItem}
          />
        </section>
      )}

      {(!isAdmin || activeTab === "list") && (
        <section className="card" style={{ padding: "0", overflow: "hidden" }}>
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--card-border)",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Task Breakdown</h2>
            <div style={{ position: "relative", minWidth: "300px" }}>
              <FaSearch
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  fontSize: "0.9rem",
                }}
              />
              <input
                type="text"
                placeholder="Search tasks, descriptions..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="auth-input"
                style={{
                  paddingLeft: "35px",
                  width: "100%",
                  fontSize: "0.9rem",
                  height: "40px",
                  borderRadius: "20px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--card-border)",
                }}
              />
            </div>
            {isAdmin && (
              <button
                className="glass-btn glass-btn-primary"
                style={{
                  marginBottom: 0,
                  whiteSpace: "nowrap",
                }}
                onClick={() => setIsDownloadOpen(true)}
              >
                Export
              </button>
            )}
            <button
              className="glass-btn glass-btn-primary"
              style={{
                marginBottom: 0,
                whiteSpace: "nowrap",
              }}
              onClick={() => navigate(`/projects/${projectId}/gantt`)}
            >
              <FaChartBar /> Gantt
            </button>
          </div>

          {/* Desktop Table View */}
          <div className="desktop-only" style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  <th
                    style={{
                      padding: "16px 24px",
                      borderBottom: "1px solid var(--card-border)",
                      width: "80px",
                    }}
                  >
                    Order
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      borderBottom: "1px solid var(--card-border)",
                    }}
                  >
                    Task
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      borderBottom: "1px solid var(--card-border)",
                    }}
                  >
                    Description
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      borderBottom: "1px solid var(--card-border)",
                    }}
                  >
                    Assignee
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      borderBottom: "1px solid var(--card-border)",
                    }}
                  >
                    Duration
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      borderBottom: "1px solid var(--card-border)",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      borderBottom: "1px solid var(--card-border)",
                    }}
                  >
                    Progress
                  </th>
                  {isAdmin && (
                    <th
                      style={{
                        padding: "16px 24px",
                        borderBottom: "1px solid var(--card-border)",
                      }}
                    >
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      {searchTerm
                        ? "No tasks match your search."
                        : "No tasks added yet. Start by adding a task above."}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item: WbsItem) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid var(--card-border)",
                        transition: "background 0.2s",
                      }}
                      className="table-row-hover"
                    >
                      <td
                        style={{
                          padding: "16px 24px",
                          color: "var(--text-muted)",
                          fontWeight: "600",
                        }}
                      >
                        #{item.order}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ fontWeight: "600" }}>{item.taskName}</div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        {item.description ? (
                          <div
                            style={{
                              maxWidth: "300px",
                              maxHeight: "80px",
                              overflowY: "auto",
                              fontSize: "0.85rem",
                            }}
                          >
                            <RichEditor
                              value={item.description}
                              readOnly={true}
                              minHeight="auto"
                            />
                          </div>
                        ) : (
                          <span
                            style={{
                              color: "var(--text-muted)",
                              fontSize: "0.8rem",
                            }}
                          >
                            -
                          </span>
                        )}
                      </td>

                      <td
                        style={{
                          padding: "16px 24px",
                          color: "var(--text-muted)",
                        }}
                      >
                        {item.assignee || "-"}
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "0.85rem" }}>
                        <div>{formatDate(item.startDate)}</div>
                        <div style={{ color: "var(--text-muted)" }}>
                          {formatDate(item.endDate)}
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "0.75rem",
                            background: `${getStatusColor(item.status)}22`,
                            color: getStatusColor(item.status),
                            border: `1px solid ${getStatusColor(
                              item.status
                            )}44`,
                            textTransform: "uppercase",
                            fontWeight: "bold",
                          }}
                        >
                          {item.status.replace("-", " ")}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px", width: "150px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              height: "6px",
                              background: "rgba(255,255,255,0.1)",
                              borderRadius: "3px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${item.progress}%`,
                                height: "100%",
                                background: getStatusColor(item.status),
                                borderRadius: "3px",
                              }}
                            />
                          </div>
                          <span
                            style={{ fontSize: "0.75rem", minWidth: "35px" }}
                          >
                            {item.progress}%
                          </span>
                        </div>
                      </td>
                      {isAdmin && (
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ display: "flex", gap: "10px" }}>
                            <button
                              onClick={() => handleEdit(item)}
                              className="secondary-btn"
                              style={{
                                padding: "8px",
                                borderRadius: "50%",
                                background: "transparent",
                              }}
                              title="Edit"
                            >
                              <FaEdit color="var(--accent)" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item.id!)}
                              className="secondary-btn"
                              style={{
                                padding: "8px",
                                borderRadius: "50%",
                                background: "transparent",
                              }}
                              title="Delete"
                            >
                              <FaTrash color="#ef4444" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div
            className="mobile-only"
            style={{ flexDirection: "column", gap: "16px", padding: "16px" }}
          >
            {filteredItems.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-muted)" }}>
                {searchTerm
                  ? "No tasks match your search."
                  : "No tasks added yet."}
              </p>
            ) : (
              filteredItems.map((item: WbsItem) => (
                <div key={item.id} className="user-mobile-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "1.1rem" }}>
                        {item.taskName}
                      </div>
                      {item.description && (
                        <div
                          style={{
                            marginTop: "8px",
                            fontSize: "0.85rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          <RichEditor
                            value={item.description}
                            readOnly={true}
                            minHeight="auto"
                          />
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "0.7rem",
                        background: `${getStatusColor(item.status)}22`,
                        color: getStatusColor(item.status),
                        border: `1px solid ${getStatusColor(item.status)}44`,
                        textTransform: "uppercase",
                        fontWeight: "bold",
                      }}
                    >
                      {item.status.replace("-", " ")}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: "0.85rem",
                      marginBottom: "12px",
                      display: "flex",
                      gap: "12px",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>📅 {formatDate(item.startDate)}</span>
                    <span>🏁 {formatDate(item.endDate)}</span>
                  </div>

                  <div
                    style={{
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: "8px",
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${item.progress}%`,
                          height: "100%",
                          background: getStatusColor(item.status),
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                      {item.progress}%
                    </span>
                  </div>

                  {isAdmin && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "12px",
                      }}
                    >
                      <button
                        onClick={() => handleEdit(item)}
                        className="primary-btn"
                        style={{
                          padding: "8px 16px",
                          fontSize: "0.85rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          background:
                            "linear-gradient(135deg, var(--accent), #0ea5e9)",
                          boxShadow: "0 8px 20px rgba(56, 189, 248, 0.3)",
                          border: "none",
                        }}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item.id!)}
                        className="primary-btn"
                        style={{
                          padding: "8px 16px",
                          fontSize: "0.85rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          background:
                            "linear-gradient(135deg, #ef4444, #f87171)",
                          boxShadow: "0 8px 20px rgba(239, 68, 68, 0.3)",
                          border: "none",
                          color: "#fff",
                        }}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        onConfirm={executeDelete}
        onCancel={() => {
          setIsConfirmOpen(false);
          setItemToDeleteId(null);
        }}
      />

      {processing && <LoadingSpinner />}

      <DownloadDataWithExcelOrCsv
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        data={filteredItems.map(item => ({
          ...item,
          description: stripHtml(item.description || ""),
          startDate: formatDate(item.startDate),
          endDate: formatDate(item.endDate),
        }))}
        headers={[
          { key: "order", label: "Order" },
          { key: "taskName", label: "Task" },
          { key: "description", label: "Description" },
          { key: "assignee", label: "Assignee" },
          { key: "startDate", label: "Start Date" },
          { key: "endDate", label: "End Date" },
          { key: "status", label: "Status" },
          { key: "progress", label: "Progress (%)" },
        ]}
        fileName={`wbs_${project?.projectName || "project"}`}
      />

      <style>{`
        .wbs-form-actions {
          display: flex;
          gap: 12px;
          margin-top: 30px;
          justify-content: flex-end;
        }
        @media (max-width: 768px) {
          .wbs-form-actions {
            justify-content: center;
          }
        }

        .wbs-form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 1024px) {
           .wbs-form-grid {
             grid-template-columns: repeat(4, 1fr);
           }
           .wbs-col-full {
             grid-column: 1 / -1;
           }
           .wbs-col-span-2 {
             grid-column: span 2;
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

        .table-row-hover:hover {
          background: rgba(255,255,255,0.02);
        }
      `}</style>
      <UserPopup
        isOpen={isUserPopupOpen}
        onClose={() => setIsUserPopupOpen(false)}
        onSelect={handlePopupSelect}
        selectionMode={userPopupMode}
        title={
          userPopupTarget === "assignee"
            ? "Select Assignee"
            : "Select CC Assignees"
        }
      />
    </div>
  );
};
