import type { FC } from "react";
import { useEffect, useState } from "react";
import { FaExternalLinkAlt, FaGithub, FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";
import { getAllProjects } from "../../services/firebaseService";
import type { Project } from "../../types_interfaces/project";

export const ProjectsView: FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getAllProjects();
        // Sort by start date descending
        setProjects(
          data.sort((a, b) => b.startDate.localeCompare(a.startDate))
        );
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(
    p =>
      p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.usedSkills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div
      className="projects-view-container"
      style={{
        padding: "60px 20px 60px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "2.5rem",
            marginBottom: "16px",
            background:
              "linear-gradient(135deg, #fff 0%, var(--text-muted) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Experienced Projects
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "1.1rem",
            maxWidth: "800px",
            margin: "0 auto",
          }}
        >
          Explore some of the projects I've worked on over the years, ranging
          from native mobile apps to complex web systems.
        </p>
      </div>

      <div
        style={{
          position: "relative",
          margin: "0 10px 20px 10px",
        }}
      >
        <FaSearch
          style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
          }}
        />
        <input
          type="text"
          placeholder="Search by project name, skills, or description..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="auth-input"
          style={{
            paddingLeft: "45px",
            borderRadius: "30px",
            height: "50px",
            width: "100%",
            fontSize: "1rem",
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>
            {searchTerm
              ? "No projects matching your search."
              : "No projects found."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "30px",
          }}
        >
          {filteredProjects.map(project => (
            <div
              key={project.id}
              className="card project-card"
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {project.imageUrl && (
                <div
                  style={{ width: "100%", height: "200px", overflow: "hidden" }}
                >
                  <img
                    src={project.imageUrl}
                    alt={project.projectName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.3s ease",
                    }}
                    onMouseOver={e =>
                      (e.currentTarget.style.transform = "scale(1.05)")
                    }
                    onMouseOut={e =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  />
                </div>
              )}
              <div
                style={{
                  padding: "24px",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "1.25rem", margin: "0 0 4px 0" }}>
                    {project.projectName}
                  </h3>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--accent)",
                      fontWeight: "600",
                    }}
                  >
                    {project.userRole}
                  </div>
                  <div
                    style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    {new Date(project.startDate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                    })}{" "}
                    -
                    {new Date(project.endDate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                    })}
                  </div>
                </div>

                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "var(--text-muted)",
                    lineHeight: "1.6",
                    marginBottom: "20px",
                    flex: 1,
                  }}
                >
                  {project.description}
                </p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "24px",
                  }}
                >
                  {project.usedSkills.map(skill => (
                    <span
                      key={skill}
                      className="tag"
                      style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div
                  style={{ display: "flex", gap: "16px", marginTop: "auto" }}
                >
                  {project.gitUrl && (
                    <a
                      href={project.gitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="secondary-btn"
                      style={{
                        flex: 1,
                        padding: "8px",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <FaGithub /> GitHub
                    </a>
                  )}
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="primary-btn"
                      style={{
                        flex: 1,
                        padding: "8px",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <FaExternalLinkAlt /> Live Demo
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "60px" }}>
        <Link to="/" className="secondary-btn">
          Back to Home
        </Link>
      </div>
    </div>
  );
};
