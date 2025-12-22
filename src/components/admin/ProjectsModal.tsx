import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
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
import { Toast } from "../common/Toast";

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectsModal: FC<ProjectsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
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
    imageUrl: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(
    null
  );

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
      loadProjects();
    }
  }, [isOpen, loadProjects]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

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
    } catch (error) {
      console.error("Error saving project:", error);
      setToast({ message: "Failed to save project.", type: "error" });
    } finally {
      setLoading(false);
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
      imageUrl: "",
    });
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
      imageUrl: project.imageUrl || "",
    });
    // Scroll to top of the modal content to see the form
    const modalContent = document.querySelector(".contact-modal-content");
    if (modalContent) modalContent.scrollTop = 0;
  };

  const handleDeleteClick = (id: string) => {
    setProjectToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!projectToDeleteId) return;
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
    }
  };

  const filteredProjects = projects.filter(
    p =>
      p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.usedSkills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          {/* Form Section */}
          <div className="contact-form-side">
            <form onSubmit={handleSubmit} className="auth-form">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div className="auth-form-group">
                  <label>Project Name</label>
                  <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    className="auth-input"
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
                    required
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div className="auth-form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
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
                    onChange={handleChange}
                    className="auth-input"
                    required
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="auth-input"
                  style={{ minHeight: "100px" }}
                  required
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div className="auth-form-group">
                  <label>Demo URL</label>
                  <input
                    type="url"
                    name="demoUrl"
                    value={formData.demoUrl}
                    onChange={handleChange}
                    className="auth-input"
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
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label>Project Image</label>
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="auth-input"
                    style={{ flex: 1 }}
                  />
                  {formData.imageUrl && (
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "4px",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>
                {uploading && (
                  <small style={{ color: "var(--accent)" }}>Uploading...</small>
                )}
              </div>

              <div className="auth-form-group">
                <label>Used Skills</label>
                <div
                  style={{ display: "flex", gap: "8px", marginBottom: "8px" }}
                >
                  <input
                    type="text"
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    className="auth-input"
                    style={{ flex: 1 }}
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
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
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

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="submit"
                  className="auth-button"
                  disabled={loading || uploading}
                  style={{ flex: 1 }}
                >
                  {editingProject ? "Update Project" : "Add Project"}
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

          {/* List Section */}
          <div className="contact-list-side">
            <h3 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>
              Project List
            </h3>

            <div className="auth-form-group" style={{ marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="auth-input"
              />
            </div>

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
                  {filteredProjects.map(p => (
                    <div
                      key={p.id}
                      className="user-mobile-card"
                      style={{ padding: "12px" }}
                    >
                      <div style={{ display: "flex", gap: "12px" }}>
                        {p.imageUrl && (
                          <img
                            src={p.imageUrl}
                            alt={p.projectName}
                            style={{
                              width: "60px",
                              height: "60px",
                              borderRadius: "8px",
                              objectFit: "cover",
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "start",
                            }}
                          >
                            <h4 style={{ margin: 0, fontSize: "1rem" }}>
                              {p.projectName}
                            </h4>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                className="track-edit-button"
                                style={{ padding: "2px 6px" }}
                                onClick={() => handleEdit(p)}
                              >
                                E
                              </button>
                              <button
                                className="track-delete-button"
                                style={{ padding: "2px 6px" }}
                                onClick={() => handleDeleteClick(p.id!)}
                              >
                                D
                              </button>
                            </div>
                          </div>
                          <p
                            style={{
                              margin: "4px 0",
                              fontSize: "0.85rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {p.userRole}
                          </p>
                          <p
                            style={{
                              margin: "2px 0",
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {p.startDate} ~ {p.endDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
    </div>
  );
};
