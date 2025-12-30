import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  FaArrowLeft,
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
  updateWbsItem,
} from "../../services/firebaseService";
import type { Project } from "../../types_interfaces/project";
import type { WbsItem } from "../../types_interfaces/wbs";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { RichEditor } from "../common/RichEditor";
import { Toast } from "../common/Toast";

const stripHtml = (html: string) => {
  if (!html) return "";
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || "";
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
        await updateWbsItem(projectId, editingItem.id!, {
          ...formData,
          updatedAt: now,
        });
        setToast({ message: "Task updated successfully!", type: "success" });
      } else {
        await createWbsItem({
          ...formData,
          projectId,
          createdAt: now,
          updatedAt: now,
        });
        setToast({ message: "Task added successfully!", type: "success" });
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
            background: rgba(255,255,255,0.05);
            padding: 4px;
            border-radius: 8px;
          }
          .wbs-tab-btn {
            flex: 1;
            padding: 10px;
            border: none;
            background: transparent;
            color: var(--text-muted);
            border-radius: 6px;
            font-size: 0.95rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          .wbs-tab-btn.active {
            background: var(--accent);
            color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "20px",
              }}
            >
              <div className="auth-form-group">
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
                <label>Description</label>
                <div style={{ gridColumn: "span 1" }}>
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
                <label>Assignee</label>
                <input
                  type="text"
                  name="assignee"
                  value={formData.assignee}
                  onChange={handleInputChange}
                  className="auth-input"
                  placeholder="Who is responsible?"
                />
              </div>
              <div className="auth-form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="auth-input"
                  required
                />
              </div>
              <div className="auth-form-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="auth-input"
                  required
                />
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
              <div className="auth-form-group">
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

            <div style={{ display: "flex", gap: "12px", marginTop: "30px" }}>
              <button
                type="submit"
                className="primary-btn"
                style={{ padding: "12px 24px" }}
              >
                {editingItem ? (
                  <>
                    <FaSave /> Update Task
                  </>
                ) : (
                  <>
                    <FaPlus /> Add Task
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

      {(!isAdmin || activeTab === "list") && (
        <section className="card" style={{ padding: "0", overflow: "hidden" }}>
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--card-border)",
              display: "flex",
              justifyContent: "space-between",
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
                        <div>{item.startDate}</div>
                        <div style={{ color: "var(--text-muted)" }}>
                          {item.endDate}
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
                            fontSize: "0.85rem",
                            color: "var(--text-muted)",
                            marginTop: "4px",
                            lineHeight: "1.4",
                          }}
                        >
                          {stripHtml(item.description)}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-muted)",
                          marginTop: "8px",
                        }}
                      >
                        Order: {item.order} | {item.assignee || "Unassigned"}
                      </div>
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
                    <span>📅 {item.startDate}</span>
                    <span>🏁 {item.endDate}</span>
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

      <style>{`

        .table-row-hover:hover {
          background: rgba(255,255,255,0.02);
        }
      `}</style>
    </div>
  );
};
