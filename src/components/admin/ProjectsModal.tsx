import type { FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

import {
  createProject,
  deleteProject,
  getAllProjects,
  updateProject,
  uploadProjectImage,
} from "../../services/firebaseService";
import type { Project } from "../../types_interfaces/project";

import { ConfirmDialog } from "../common/ConfirmDialog";
import DownloadDataWithExcelOrCsv from "../common/DownloadDataWithExcelOrCsv";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { RichEditor } from "../common/RichEditor";
import { Toast } from "../common/Toast";
import { UserPopup } from "../popups/UserPopup";

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectsModal: FC<ProjectsModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [formData, setFormData] = useState<
    Omit<Project, "id" | "createdAt" | "updatedAt">
  >({
    uid: "",
    projectName: "",
    startDate: "",
    endDate: "",
    demoUrl: "",
    gitUrl: "",
    description: "",
    userRole: "",
    usedSkills: [],
    shareholders: [],
    imageUrl: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [isUserPopupOpen, setIsUserPopupOpen] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(
    null
  );
  const [processing, setProcessing] = useState(false);
  const [mobileTab, setMobileTab] = useState<"list" | "form">("list");
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllProjects();
      setProjects(data.sort((a, b) => b.startDate.localeCompare(a.startDate)));
    } catch (error) {
      console.error("Error loading projects:", error);
      setToast({ message: "Failed to load projects.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      loadProjects();
    }
  }, [isOpen, loadProjects]);

  // Reset to page 1 when search or itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadProjectImage(file);
      setFormData(prev => ({ ...prev, imageUrl: url }));
      setToast({ message: "Image uploaded successfully!", type: "success" });
    } catch (error) {
      console.error("Error uploading image:", error);
      setToast({ message: "Failed to upload image.", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    if (!formData.usedSkills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        usedSkills: [...prev.usedSkills, skillInput.trim()],
      }));
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      usedSkills: prev.usedSkills.filter(s => s !== skill),
    }));
  };

  const handleRemoveShareholder = (shareholder: string) => {
    setFormData(prev => ({
      ...prev,
      shareholders: (prev.shareholders || []).filter(s => s !== shareholder),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setProcessing(true);
    setLoading(true);

    try {
      const now = new Date().toISOString();
      if (editingProject) {
        await updateProject(editingProject.id!, {
          ...formData,
          updatedAt: now,
        });
        setToast({ message: "Project updated successfully!", type: "success" });
      } else {
        await createProject({
          ...formData,
          uid: currentUser.uid,
          createdAt: now,
          updatedAt: now,
        });
        setToast({ message: "Project created successfully!", type: "success" });
      }
      resetForm();
      loadProjects();
      setMobileTab("list");
    } catch (error) {
      console.error("Error saving project:", error);
      setToast({ message: "Failed to save project.", type: "error" });
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setEditingProject(null);
    setFormData({
      uid: "",
      projectName: "",
      startDate: "",
      endDate: "",
      demoUrl: "",
      gitUrl: "",
      description: "",
      userRole: "",
      usedSkills: [],
      shareholders: [],
      imageUrl: "",
    });
    setSkillInput("");
    setMobileTab("list");
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      uid: project.uid,
      projectName: project.projectName,
      startDate: project.startDate,
      endDate: project.endDate,
      demoUrl: project.demoUrl || "",
      gitUrl: project.gitUrl || "",
      description: project.description,
      userRole: project.userRole,
      usedSkills: project.usedSkills,
      shareholders: project.shareholders || [],
      imageUrl: project.imageUrl || "",
    });

    // Scroll to top of the modal content to see the form
    const modalContent = document.querySelector(".contact-modal-content");
    if (modalContent) modalContent.scrollTop = 0;
    setMobileTab("form");
  };

  const handleDeleteClick = (id: string) => {
    setProjectToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!projectToDeleteId) return;
    setProcessing(true);
    try {
      await deleteProject(projectToDeleteId);
      setToast({ message: "Project deleted.", type: "success" });
      loadProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      setToast({ message: "Failed to delete project.", type: "error" });
    } finally {
      setIsConfirmOpen(false);
      setProjectToDeleteId(null);
      setProcessing(false);
    }
  };

  const filteredProjects = projects.filter(
    p =>
      p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.usedSkills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProjects, currentPage, itemsPerPage]);

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay">
      <div
        className="auth-modal contact-modal-container"
        style={{ maxWidth: "800px", width: "95%", maxHeight: "90vh" }}
      >
        <button className="auth-modal-close" onClick={onClose}>
          &times;
        </button>

        <h2 className="auth-modal-title">
          {editingProject ? "Edit Project" : "Manage Projects"}
        </h2>

        <div className="contact-modal-content">
          <style>
            {`
              .mobile-tabs {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
                background: rgba(255,255,255,0.05);
                padding: 4px;
                border-radius: 8px;
              }
              .mobile-tab-btn {
                flex: 1;
                padding: 8px;
                border: none;
                background: transparent;
                color: var(--text-muted);
                border-radius: 6px;
                font-size: 0.9rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
              }
              .mobile-tab-btn.active {
                background: var(--accent);
                color: white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
              .project-card-image {
                width: 70px;
                height: 70px;
                border-radius: 10px;
                object-fit: cover;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              @media (max-width: 640px) {
                .project-card-image {
                  width: 100%;
                  height: 180px;
                  margin-bottom: 12px;
                }
              }

              /* Custom Date Input Styling for YYYY/MM/DD */
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
            `}
          </style>

          {/* Tabs (Visible on both Desktop and Mobile now) */}
          <div className="mobile-tabs">
            <button
              className={`mobile-tab-btn ${
                mobileTab === "list" ? "active" : ""
              }`}
              onClick={() => {
                setMobileTab("list");
                if (editingProject) resetForm(); // Clear edit state when switching to list
              }}
            >
              Project List
            </button>
            <button
              className={`mobile-tab-btn ${
                mobileTab === "form" ? "active" : ""
              }`}
              onClick={() => {
                if (mobileTab === "list") resetForm(); // Only reset if coming from list (new project)
                setMobileTab("form");
              }}
            >
              {editingProject ? "Edit Project" : "New Project"}
            </button>
          </div>

          {/* Form Section */}
          {mobileTab === "form" && (
            <div
              className="contact-form-side"
              style={{
                width: "100%",
                maxWidth: "100%",
                overflowX: "hidden",
                boxSizing: "border-box",
              }}
            >
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-grid">
                  <div className="auth-form-group">
                    <label>Project Name</label>
                    <input
                      type="text"
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleChange}
                      className="auth-input"
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                      }}
                      required
                    />
                  </div>
                  <div className="auth-form-group">
                    <label>User Role</label>
                    <input
                      type="text"
                      name="userRole"
                      value={formData.userRole}
                      onChange={handleChange}
                      className="auth-input"
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                      }}
                      required
                    />
                  </div>
                </div>

                <div
                  className="form-grid"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div
                    className="auth-form-group"
                    style={{ flex: "1 1 250px", minWidth: 0 }}
                  >
                    <label>Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="auth-input custom-date-visual"
                      data-value={
                        formData.startDate
                          ? formData.startDate.replace(/-/g, "/")
                          : ""
                      }
                      style={{
                        width: "90%",
                        maxWidth: "90%",
                        boxSizing: "border-box",
                      }}
                      required
                    />
                  </div>
                  <div
                    className="auth-form-group"
                    style={{ flex: "1 1 250px", minWidth: 0 }}
                  >
                    <label>End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="auth-input custom-date-visual"
                      data-value={
                        formData.endDate
                          ? formData.endDate.replace(/-/g, "/")
                          : ""
                      }
                      style={{
                        width: "90%",
                        maxWidth: "90%",
                        boxSizing: "border-box",
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="auth-form-group">
                  <label>Description</label>
                  <RichEditor
                    value={formData.description}
                    onChange={content =>
                      setFormData(prev => ({ ...prev, description: content }))
                    }
                    placeholder="Enter project description..."
                    minHeight="150px"
                  />
                </div>

                <div className="form-grid">
                  <div className="auth-form-group">
                    <label>Demo URL</label>
                    <input
                      type="url"
                      name="demoUrl"
                      value={formData.demoUrl}
                      onChange={handleChange}
                      className="auth-input"
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                      }}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="auth-form-group">
                    <label>Git URL</label>
                    <input
                      type="url"
                      name="gitUrl"
                      value={formData.gitUrl}
                      onChange={handleChange}
                      className="auth-input"
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                      }}
                      placeholder="https://github.com/..."
                    />
                  </div>
                </div>

                <div className="auth-form-group">
                  <label>Project Image</label>
                  <div className="file-upload-group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="auth-input"
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                      }}
                    />
                    {formData.imageUrl && (
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "4px",
                          objectFit: "cover",
                          border: "1px solid var(--card-border)",
                        }}
                      />
                    )}
                  </div>
                  {uploading && (
                    <small style={{ color: "var(--accent)" }}>
                      Uploading...
                    </small>
                  )}
                </div>

                <div
                  className="auth-form-group"
                  style={{ position: "relative" }}
                >
                  <label>Shareholders</label>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginBottom: "8px",
                      width: "100%",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <input
                      type="text"
                      readOnly
                      placeholder="Click to select shareholders..."
                      onClick={() => setIsUserPopupOpen(true)}
                      className="auth-input"
                      style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                    />
                    <button
                      type="button"
                      onClick={() => setIsUserPopupOpen(true)}
                      className="auth-button"
                      style={{ padding: "8px 16px" }}
                    >
                      Select
                    </button>
                  </div>

                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}
                  >
                    {(formData.shareholders || []).map(sh => (
                      <span
                        key={sh}
                        className="tag"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "rgba(56, 189, 248, 0.1)",
                          color: "var(--accent)",
                        }}
                      >
                        {sh}
                        <button
                          type="button"
                          onClick={() => handleRemoveShareholder(sh)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "inherit",
                            cursor: "pointer",
                            fontSize: "1rem",
                            lineHeight: 1,
                          }}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="auth-form-group">
                  <label>Used Skills</label>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginBottom: "8px",
                      width: "100%",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <input
                      type="text"
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      className="auth-input"
                      style={{ flex: 1, minWidth: 0 }}
                      placeholder="Enter a skill..."
                      onKeyDown={e =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleAddSkill())
                      }
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="auth-button"
                      style={{ padding: "8px 16px" }}
                    >
                      Add
                    </button>
                  </div>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}
                  >
                    {formData.usedSkills.map(skill => (
                      <span
                        key={skill}
                        className="tag"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "inherit",
                            cursor: "pointer",
                            fontSize: "1rem",
                            lineHeight: 1,
                          }}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  style={{ display: "flex", gap: "10px", marginTop: "10px" }}
                >
                  <button
                    type="submit"
                    className="auth-button"
                    disabled={loading || uploading}
                    style={{ flex: 1 }}
                  >
                    {editingProject ? "Update" : "Add"}
                  </button>
                  {editingProject && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="track-cancel-button"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* List Section */}
          {mobileTab === "list" && (
            <div className="contact-list-side" style={{ width: "100%" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>
                Project List
              </h3>

              <div
                className="auth-form-group"
                style={{
                  marginBottom: "16px",
                  display: "flex",
                  flexDirection: "row",
                  gap: "10px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="auth-input"
                  style={{ flex: 1, marginBottom: 0, minWidth: "200px" }}
                />
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      fontSize: "0.85rem", // Consistent with UsersModal and others
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Show:
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={e => setItemsPerPage(Number(e.target.value))}
                    className="auth-input"
                    style={{
                      width: "70px",
                      padding: "6px 8px", // Adjusted padding for better look
                      marginBottom: 0,
                      cursor: "pointer",
                    }}
                  >
                    {[5, 10, 20, 30].map(val => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="auth-button"
                  style={{
                    width: "auto",
                    padding: "6px 15px",
                    fontSize: "0.9rem",
                    marginBottom: 0,
                    backgroundColor: "var(--card-bg)",
                    border: "1px solid var(--accent)",
                    whiteSpace: "nowrap",
                  }}
                  onClick={() => setIsDownloadOpen(true)}
                >
                  Export
                </button>
              </div>

              {/* Projects 목록 테이블/카드 */}
              <div
                className="contact-messages-list"
                style={{ maxHeight: "none" }}
              >
                {loading && projects.length === 0 ? (
                  <p>Loading projects...</p>
                ) : filteredProjects.length === 0 ? (
                  <p>No projects found.</p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    {paginatedProjects.map(p => (
                      <div
                        key={p.id}
                        className="user-mobile-card"
                        style={{ padding: "16px" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "16px",
                            flexWrap: "wrap",
                          }}
                        >
                          {p.imageUrl && (
                            <img
                              src={p.imageUrl}
                              alt={p.projectName}
                              className="project-card-image"
                            />
                          )}
                          <div style={{ flex: 1, minWidth: "200px" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "start",
                                gap: "10px",
                                flexWrap: "wrap",
                                marginBottom: "8px",
                              }}
                            >
                              <h4
                                style={{
                                  margin: 0,
                                  fontSize: "1.1rem",
                                  fontWeight: "600",
                                }}
                              >
                                {p.projectName}
                              </h4>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                  className="track-edit-button"
                                  style={{
                                    padding: "6px 12px",
                                    fontSize: "0.85rem",
                                    backgroundColor: "rgba(88, 70, 70, 0.4)",
                                    border: "1px solid var(--accent)",
                                    color: "var(--accent)",
                                    backdropFilter: "blur(4px)",
                                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                                  }}
                                  onClick={() => handleEdit(p)}
                                  title="Edit Project"
                                >
                                  Edit
                                </button>
                                <button
                                  className="track-edit-button"
                                  style={{
                                    padding: "6px 12px",
                                    fontSize: "0.85rem",
                                    backgroundColor: "rgba(88, 70, 70, 0.4)",
                                    border: "1px solid var(--accent)",
                                    color: "var(--accent)",
                                    backdropFilter: "blur(4px)",
                                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                                  }}
                                  onClick={() => {
                                    onClose();
                                    navigate(`/wbs/${p.id}`);
                                  }}
                                  title="Go to WBS"
                                >
                                  WBS
                                </button>
                                <button
                                  className="track-delete-button"
                                  style={{
                                    padding: "6px 12px",
                                    fontSize: "0.85rem",
                                    backgroundColor: "rgba(88, 70, 70, 0.4)",
                                    border: "1px solid var(--accent)",
                                    color: "var(--accent)",
                                    backdropFilter: "blur(4px)",
                                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                                  }}
                                  onClick={() => handleDeleteClick(p.id!)}
                                  title="Delete Project"
                                >
                                  Del
                                </button>
                              </div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <span
                                  className="role-badge admin"
                                  style={{
                                    fontSize: "0.75rem",
                                    padding: "2px 8px",
                                  }}
                                >
                                  {p.userRole}
                                </span>
                              </div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "0.8rem",
                                  color: "var(--text-muted)",
                                  marginTop: "4px",
                                }}
                              >
                                {p.startDate} ~ {p.endDate}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div
                    className="pagination-controls"
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "15px",
                      padding: "15px 0 5px",
                      borderTop: "1px solid rgba(255,255,255,0.1)",
                      marginTop: "15px",
                    }}
                  >
                    <button
                      type="button"
                      className="chip"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      style={{
                        opacity: currentPage === 1 ? 0.5 : 1,
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                        padding: "4px 10px",
                        fontSize: "0.8rem",
                      }}
                    >
                      &larr; Prev
                    </button>
                    <span
                      style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                    >
                      Page <strong>{currentPage}</strong> of {totalPages}
                    </span>
                    <button
                      type="button"
                      className="chip"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage(p => Math.min(totalPages, p + 1))
                      }
                      style={{
                        opacity: currentPage === totalPages ? 0.5 : 1,
                        cursor:
                          currentPage === totalPages
                            ? "not-allowed"
                            : "pointer",
                        padding: "4px 10px",
                        fontSize: "0.8rem",
                      }}
                    >
                      Next &rarr;
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        confirmText="Delete"
        onConfirm={executeDelete}
        onCancel={() => {
          setIsConfirmOpen(false);
          setProjectToDeleteId(null);
        }}
      />

      {processing && <LoadingSpinner />}

      <DownloadDataWithExcelOrCsv
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        data={filteredProjects}
        headers={[
          { key: "projectName", label: "Project Name" },
          { key: "userRole", label: "Role" },
          { key: "startDate", label: "Start Date" },
          { key: "endDate", label: "End Date" },
          { key: "usedSkills", label: "Skills" },
          { key: "shareholders", label: "Shareholders" },
        ]}
        fileName="projects_list"
      />
      <UserPopup
        isOpen={isUserPopupOpen}
        onClose={() => setIsUserPopupOpen(false)}
        selectionMode="multiple"
        title="Select Shareholders"
        onSelect={selectedUsers => {
          const newEmails = selectedUsers.map(u => u.email).filter(Boolean);
          setFormData(prev => {
            const current = new Set(prev.shareholders || []);
            newEmails.forEach(e => current.add(e));
            return { ...prev, shareholders: Array.from(current) };
          });
        }}
      />
    </div>
  );
};
