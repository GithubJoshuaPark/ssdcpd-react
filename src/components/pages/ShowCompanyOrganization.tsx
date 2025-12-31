import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { FC } from "react";
import { useMemo, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaArrowsAltH,
  FaArrowsAltV,
  FaCompress,
  FaDownload,
  FaEnvelope,
  FaFileExcel,
  FaSearchMinus,
  FaSearchPlus,
  FaSitemap, // Keeping it for potential usage, though back is FaArrowLeft now
  FaUser,
} from "react-icons/fa";
import type { Organization } from "../../types_interfaces/organization";
import type { UserProfile } from "../../types_interfaces/userProfile";
import { SendEmailModal } from "../admin/SendEmailModal";
import DownloadDataWithExcelOrCsv from "../common/DownloadDataWithExcelOrCsv";

interface ShowCompanyOrganizationProps {
  companyId: string;
  orgs: Organization[];
  users: UserProfile[];
  onClose: () => void;
}

export const ShowCompanyOrganization: FC<ShowCompanyOrganizationProps> = ({
  companyId,
  orgs,
  users,
  onClose,
}) => {
  const company = useMemo(
    () => orgs.find(o => o.id === companyId),
    [orgs, companyId]
  );

  const departments = useMemo(
    () =>
      orgs
        .filter(o => o.parentId === companyId)
        .sort((a, b) => a.organizationName.localeCompare(b.organizationName)),
    [orgs, companyId]
  );

  // Helper to get teams for a department
  const getTeams = (deptId: string) => {
    return orgs
      .filter(o => o.parentId === deptId)
      .sort((a, b) => a.organizationName.localeCompare(b.organizationName));
  };

  // Helper to get members for a team
  const getMembers = (memberIds?: string[]) => {
    if (!memberIds) return [];
    return users.filter(u => memberIds.includes(u.uid));
  };

  const chartRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [layoutMode, setLayoutMode] = useState<"vertical" | "horizontal">(
    "vertical"
  );
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  // Email Modal State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [targetEmails, setTargetEmails] = useState<string[]>([]);

  // Recursive function to collect emails from an org and its children
  const collectEmails = (rootOrgId: string): string[] => {
    const emails = new Set<string>();
    const stack = [rootOrgId];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      const currentOrg = orgs.find(o => o.id === currentId);
      if (!currentOrg) continue;

      // Add direct members
      if (currentOrg.members) {
        currentOrg.members.forEach(uid => {
          const user = users.find(u => u.uid === uid);
          if (user?.email) emails.add(user.email);
        });
      }

      // Add children orgs
      const children = orgs.filter(o => o.parentId === currentId);
      children.forEach(c => c.id && stack.push(c.id));
    }

    return Array.from(emails);
  };

  const handleOpenEmail = (orgId: string) => {
    const emails = collectEmails(orgId);
    if (emails.length === 0) {
      alert("No members with email found in this organization structure.");
      return;
    }
    setTargetEmails(emails);
    setEmailModalOpen(true);
  };

  // Prepare Export Data
  const exportData = useMemo(() => {
    if (!company) return [];
    const data: Record<string, unknown>[] = [];
    const addedUids = new Set<string>();

    // Add President
    if (company?.presidentName) {
      data.push({
        Name: company.presidentName,
        Email: "-",
        Role: "CEO / President",
        Company: company.organizationName,
        Department: "-",
        Team: "-",
        Phone: "-",
      });
    }

    // Traverse Depts and Teams
    departments.forEach(dept => {
      // Dept Members
      dept.members?.forEach(uid => {
        if (addedUids.has(uid)) return;
        const u = users.find(user => user.uid === uid);
        if (u) {
          const userAny = u as unknown as Record<string, unknown>;
          data.push({
            Name: u.name || "-",
            Email: u.email || "-",
            Role: u.role || "Member",
            Company: company.organizationName,
            Department: dept.organizationName,
            Team: "-",
            Phone: (userAny.phoneNumber as string) || "-",
          });
          addedUids.add(uid);
        }
      });

      const teams = getTeams(dept.id!);
      teams.forEach(team => {
        team.members?.forEach(uid => {
          if (addedUids.has(uid)) return;
          const u = users.find(user => user.uid === uid);
          if (u) {
            const userAny = u as unknown as Record<string, unknown>;
            data.push({
              Name: u.name || "-",
              Email: u.email || "-",
              Role: u.role || "Member",
              Company: company.organizationName,
              Department: dept.organizationName,
              Team: team.organizationName,
              Phone: (userAny.phoneNumber as string) || "-",
            });
            addedUids.add(uid);
          }
        });
      });
    });

    return data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, departments, users]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const handleDownloadPDF = async () => {
    if (!chartRef.current || !company) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#ffffff", // White background for printing
        scale: 2, // Better resolution
        logging: false,
        useCORS: true,
        onclone: clonedDoc => {
          // Reset zoom to 1.0 for the capture to get full resolution/size
          const contentEl = clonedDoc.querySelector(
            ".org-chart-content"
          ) as HTMLElement;
          if (contentEl) {
            contentEl.classList.add("pdf-print-mode"); // Apply PDF styling
            contentEl.style.transform = "scale(1)";
            contentEl.style.transformOrigin = "top center";
            contentEl.style.width = "fit-content";
            contentEl.style.height = "fit-content";
            contentEl.style.overflow = "visible";
          }
        },
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate logic to FIT content into one page
      const imgRatio = imgProps.width / imgProps.height;

      // Determine printable width/height (with some margin)
      const margin = 10;
      const printWidth = pdfWidth - margin * 2;
      const printHeight = pdfHeight - margin * 2;

      let finalWidth = printWidth;
      let finalHeight = finalWidth / imgRatio;

      // If height is too tall, scale based on height
      if (finalHeight > printHeight) {
        finalHeight = printHeight;
        finalWidth = finalHeight * imgRatio;
      }

      // Center the image
      const x = (pdfWidth - finalWidth) / 2;
      const y = margin; // Top align with margin

      pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);
      pdf.save(`${company.organizationName}_OrgChart.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (!company) return null;

  return (
    <div className="org-chart-container">
      <div className="org-chart-header">
        <div
          className="header-title-group"
          style={{ display: "flex", alignItems: "center", gap: "10px" }}
        >
          <button onClick={onClose} className="glass-btn glass-btn-cancel">
            <FaArrowLeft /> Back
          </button>
          <h2>
            <FaSitemap /> {company.organizationName}
          </h2>
        </div>
        <div
          className="header-actions-group"
          style={{ display: "flex", gap: "10px" }}
        >
          <div
            className="hide-on-mobile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "rgba(255,255,255,0.05)",
              padding: "5px",
              borderRadius: "10px",
            }}
          >
            <button
              onClick={handleZoomOut}
              className="icon-btn-glass"
              title="Zoom Out"
            >
              <FaSearchMinus />
            </button>
            <span
              style={{
                minWidth: "40px",
                textAlign: "center",
                fontSize: "0.85rem",
              }}
            >
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="icon-btn-glass"
              title="Zoom In"
            >
              <FaSearchPlus />
            </button>
            <button
              onClick={handleResetZoom}
              className="icon-btn-glass"
              title="Reset Zoom"
            >
              <FaCompress />
            </button>
            <div
              style={{
                width: "1px",
                height: "20px",
                background: "rgba(255,255,255,0.2)",
                margin: "0 5px",
              }}
            ></div>
            <button
              onClick={() =>
                setLayoutMode(prev =>
                  prev === "vertical" ? "horizontal" : "vertical"
                )
              }
              className="icon-btn-glass"
              title={`Switch to ${
                layoutMode === "vertical" ? "Horizontal" : "Vertical"
              } Layout`}
            >
              {layoutMode === "vertical" ? <FaArrowsAltH /> : <FaArrowsAltV />}
            </button>
          </div>
          <button
            onClick={() => setIsDownloadOpen(true)}
            className="glass-btn glass-btn-primary"
            style={{
              marginRight: "10px",
              background: "rgba(16, 185, 129, 0.2)",
              borderColor: "rgba(16, 185, 129, 0.4)",
              color: "#34d399",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <FaFileExcel /> Excel
          </button>
          <button
            onClick={handleDownloadPDF}
            className="glass-btn glass-btn-primary hide-on-mobile"
            disabled={downloading}
          >
            {downloading ? (
              "Generating..."
            ) : (
              <>
                <FaDownload /> PDF
              </>
            )}
          </button>
        </div>
      </div>

      <div
        className={`org-chart-content layout-${layoutMode} desktop-only`}
        ref={chartRef}
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: "top center",
          transition: "transform 0.2s ease-out",
        }}
      >
        {/* Chart Content Padding Wrapper for PDF look */}
        <div
          className="chart-inner-wrapper"
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: layoutMode === "vertical" ? "column" : "row",
            alignItems: layoutMode === "vertical" ? "center" : "flex-start",
            justifyContent: "center",
            width: "100%",
          }}
        >
          {/* Root: Company */}
          <div className="org-node company-node">
            <div className="node-card">
              <div className="node-title">{company.organizationName}</div>
              {company.presidentName && (
                <div className="node-subtitle">
                  CEO: {company.presidentName}
                </div>
              )}
              <div style={{ marginTop: "10px" }}>
                <button
                  onClick={() => handleOpenEmail(company.id!)}
                  className="icon-btn-glass-sm"
                  title="Send Email to All Company Members"
                >
                  <FaEnvelope /> Email All
                </button>
              </div>
            </div>
            <div className="connector-vertical"></div>
          </div>

          {/* Departments Level */}
          <div className="org-level departments-level">
            {departments.map(dept => (
              <div key={dept.id} className="org-branch">
                <div className="connector-horizontal-top"></div>
                <div className="org-node dept-node">
                  <div className="node-card dept-card">
                    <div className="node-title">{dept.organizationName}</div>
                    <button
                      onClick={() => handleOpenEmail(dept.id!)}
                      className="icon-btn-glass-sm"
                      title="Send Email to Dept"
                      style={{ marginTop: "5px", width: "100%" }}
                    >
                      <FaEnvelope />
                    </button>
                  </div>
                  {getTeams(dept.id!).length > 0 && (
                    <div className="connector-vertical"></div>
                  )}
                </div>

                {/* Teams Level */}
                <div className="org-level teams-level">
                  {getTeams(dept.id!).map(team => (
                    <div key={team.id} className="org-branch-team">
                      <div className="org-node team-node">
                        <div className="node-card team-card">
                          <div className="node-title">
                            {team.organizationName}
                          </div>
                          <div className="member-count">
                            {team.members?.length || 0} Members
                          </div>
                          <button
                            onClick={() => handleOpenEmail(team.id!)}
                            className="icon-btn-glass-sm"
                            title="Send Email to Team"
                            style={{ marginTop: "5px", width: "100%" }}
                          >
                            <FaEnvelope />
                          </button>
                        </div>

                        {/* Members List (Simple) */}
                        {team.members && team.members.length > 0 && (
                          <div className="members-list">
                            {getMembers(team.members).map(member => (
                              <div key={member.uid} className="member-item">
                                <div className="member-avatar-small">
                                  {member.photoURL ? (
                                    <img
                                      src={member.photoURL}
                                      alt={member.name}
                                    />
                                  ) : (
                                    <FaUser size={10} />
                                  )}
                                </div>
                                <span>{member.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile View: List Layout */}
      <div className="org-chart-mobile-view mobile-only">
        {/* Company Card */}
        <div className="mobile-card company-card">
          <div className="card-header">
            <h3>{company.organizationName}</h3>
            {company.presidentName && (
              <span className="subtitle">CEO: {company.presidentName}</span>
            )}
          </div>
          <button
            onClick={() => handleOpenEmail(company.id!)}
            className="mobile-action-btn"
          >
            <FaEnvelope /> Email All
          </button>
        </div>

        {/* Departments Loop */}
        <div className="mobile-org-list">
          {departments.map(dept => (
            <div key={dept.id} className="mobile-dept-section">
              <div className="mobile-card dept-card">
                <div className="card-header">
                  <h4>{dept.organizationName}</h4>
                </div>
                <button
                  onClick={() => handleOpenEmail(dept.id!)}
                  className="mobile-action-btn sm"
                >
                  <FaEnvelope />
                </button>
              </div>

              {/* Teams Loop */}
              {getTeams(dept.id!).map(team => (
                <div key={team.id} className="mobile-team-section">
                  <div className="mobile-branch-line"></div>
                  <div className="mobile-card team-card">
                    <div className="card-header">
                      <h5>{team.organizationName}</h5>
                      <span className="member-count-badge">
                        {team.members?.length || 0}
                      </span>
                    </div>
                    <button
                      onClick={() => handleOpenEmail(team.id!)}
                      className="mobile-action-btn sm"
                    >
                      <FaEnvelope />
                    </button>

                    {/* Members List */}
                    {team.members && team.members.length > 0 && (
                      <div className="mobile-members-list">
                        {getMembers(team.members).map(member => (
                          <div key={member.uid} className="mobile-member-item">
                            <div className="avatar">
                              {member.photoURL ? (
                                <img src={member.photoURL} alt={member.name} />
                              ) : (
                                <FaUser size={10} />
                              )}
                            </div>
                            <span>{member.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <SendEmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        targetEmails={targetEmails}
      />

      <DownloadDataWithExcelOrCsv
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        data={exportData}
        headers={[
          { key: "Company", label: "Company" },
          { key: "Department", label: "Department" },
          { key: "Team", label: "Team" },
          { key: "Name", label: "Name" },
          { key: "Role", label: "Role" },
          { key: "Email", label: "Email" },
          { key: "Phone", label: "Phone" },
        ]}
        fileName={`${company.organizationName}_Members`}
      />

      <style>{`
        .org-chart-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #0f172a;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          padding: 20px;
          overflow: auto;
          box-sizing: border-box;
        }

        .org-chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          color: white;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .org-chart-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-bottom: 50px;
        }

        .org-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        .node-card {
          padding: 15px 25px;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.3);
          border-radius: 8px;
          text-align: center;
          color: white;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          min-width: 150px;
          transition: transform 0.2s;
        }

        .node-card:hover {
            transform: translateY(-2px);
            border-color: #3b82f6;
        }

        .company-node .node-card {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(30, 41, 59, 0.9));
          border-color: #3b82f6;
          padding: 20px 40px;
        }

        .dept-card {
           background: rgba(255, 255, 255, 0.05);
        }

        .team-card {
           padding: 10px 15px;
           min-width: 120px;
           background: rgba(0, 0, 0, 0.2);
           border-color: rgba(255, 255, 255, 0.1);
        }

        .node-title {
          font-weight: 600;
          font-size: 1rem;
        }

        .company-node .node-title {
            font-size: 1.25rem;
            margin-bottom: 5px;
        }

        .node-subtitle, .member-count {
          font-size: 0.8rem;
          color: #94a3b8;
        }

        .connector-vertical {
          width: 2px;
          height: 30px;
          background: rgba(148, 163, 184, 0.3);
        }

        .org-level {
          display: flex;
          justify-content: center;
          gap: 40px;
          width: 100%;
        }

        .departments-level {
           position: relative;
           padding-top: 0;
           align-items: flex-start;
           flex-wrap: wrap; 
        }

        /* Connectors for branching */
        .org-branch {
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
        }
        
        /* Ideally we need a complex connector logic for perfect trees with CSS.
           For neo-brutalism/simple view, we will keep vertical flow mostly 
           but horizontal spacing for depts.
           A pure CSS tree line is tricky without fixed widths.
           Let's simplify visual connectors:
           Root -> Vertical Line -> Horizontal Bar covering children -> Vertical Lines to children
        */
        
        .org-branch::before {
            content: '';
            position: absolute;
            top: -30px; /* Connects to the line coming from root */
            left: 50%;
            width: 2px;
            height: 30px;
            background: rgba(148, 163, 184, 0.3);
        }
        
        /* Since we wrapped depts in a flex container, drawing a single horizontal bar 
           spanning all branches is hard without a wrapping parent logic 
           that knows the width. 
           We will use a simpler top-border approach for groups if possible, 
           or just individual vertical lines for now to keep it clean and robust.
        */

        .teams-level {
            flex-direction: column;
            gap: 20px;
            margin-top: 20px;
            padding-left: 0; /* Align directly under dept for now */
        }
        
        .org-branch-team {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .org-branch-team::before {
            content: '';
            position: absolute;
            top: -20px;
            width: 2px;
            height: 20px;
            background: rgba(148, 163, 184, 0.3);
        }

        .members-list {
            margin-top: 10px;
            display: flex;
            flex-direction: column;
            gap: 5px;
            background: rgba(0,0,0,0.2);
            padding: 8px;
            border-radius: 6px;
            width: 100%;
        }

        .member-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.8rem;
            color: #ccc;
            padding: 2px 0;
        }
        
        .member-avatar-small {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #334155;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            color: #cbd5e1;
        }
        
        .member-avatar-small img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .glass-btn {
            padding: 10px 20px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
        }
        
        .glass-btn-cancel {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #aaa;
        }
        
        .glass-btn-cancel:hover {
            background: rgba(255, 255, 255, 0.15);
            color: white;
            border-color: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .glass-btn-primary {
            background: rgba(59, 130, 246, 0.2);
            border: 1px solid rgba(59, 130, 246, 0.4);
            color: #60a5fa;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.1);
        }
        
        .glass-btn-primary:hover:not(:disabled) {
            background: rgba(59, 130, 246, 0.5);
            border-color: rgba(59, 130, 246, 0.8);
            color: white;
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
            transform: translateY(-2px);
        }

        .glass-btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .icon-btn-glass {
            background: transparent;
            border: none;
            color: #ccc;
            padding: 8px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        .icon-btn-glass:hover {
            background: rgba(255,255,255,0.1);
            color: white;
        }

        .icon-btn-glass-sm {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #ccc;
            padding: 4px 8px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            font-size: 0.75rem;
            transition: all 0.2s;
        }

        .icon-btn-glass-sm:hover {
            background: rgba(59, 130, 246, 0.3);
            border-color: rgba(59, 130, 246, 0.5);
            color: white;
        }

        .mobile-only { display: none; }
        
        @media (max-width: 768px) {
            .desktop-only { display: none !important; }
            .mobile-only { display: flex !important; flex-direction: column; width: 100%; padding-bottom: 50px; }
            .hide-on-mobile { display: none !important; }
            
            .org-chart-header { 
                display: grid !important; 
                grid-template-columns: auto auto; /* Two columns for buttons */
                gap: 15px; 
                margin-bottom: 20px; 
                width: 100%;
            }
            
            /* Magic trick to ungroup divs so we can reorder children via Grid */
            .header-title-group, .header-actions-group {
                display: contents !important;
            }
            
            /* First Row: Title */
            .org-chart-header h2 { 
                grid-column: 1 / -1; /* Span full width */
                order: 1;
                font-size: 1.2rem;
                margin: 0;
            }
            
            /* Second Row: Back Button */
            .glass-btn-cancel {
                order: 2;
                justify-self: start;
                width: auto;
            }
            
            /* Second Row: Excel Button */
            .header-actions-group .glass-btn-primary {
                order: 3;
                justify-self: start; /* Align next to back button */
                margin-right: 0 !important; /* Reset margin */
            }
            
            /* Mobile Card Styles */
            .mobile-card {
                background: rgba(30, 41, 59, 0.7);
                border: 1px solid rgba(148, 163, 184, 0.2);
                border-radius: 12px;
                padding: 15px;
                margin-bottom: 10px;
                backdrop-filter: blur(10px);
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: white;
            }
            
            .company-card {
                background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(15, 23, 42, 0.8));
                border-color: #3b82f6;
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
            
            .dept-card {
                background: rgba(255, 255, 255, 0.05);
                border-left: 4px solid #3b82f6;
            }
            
            .team-card {
                background: rgba(0, 0, 0, 0.2);
                flex-direction: column;
                align-items: stretch;
                gap: 10px;
            }
            
            .card-header h3 { margin: 0; font-size: 1.1rem; }
            .card-header h4 { margin: 0; font-size: 1rem; }
            .card-header h5 { margin: 0; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;}
            
            .subtitle { font-size: 0.8rem; color: #94a3b8; }
            
            .mobile-dept-section {
                margin-top: 15px;
                display: flex;
                flex-direction: column;
            }
            
            .mobile-team-section {
                margin-left: 20px;
                margin-top: 10px;
                position: relative;
                padding-left: 15px;
                border-left: 2px solid rgba(255, 255, 255, 0.1);
            }
            
            .mobile-action-btn {
                background: rgba(59, 130, 246, 0.2);
                color: #60a5fa;
                border: 1px solid rgba(59, 130, 246, 0.3);
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 0.85rem;
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
            }
            .mobile-action-btn.sm {
                padding: 4px 8px;
                font-size: 0.75rem;
            }
            
            .member-count-badge {
                background: rgba(255, 255, 255, 0.1);
                color: #cbd5e1;
                font-size: 0.7rem;
                padding: 2px 6px;
                border-radius: 10px;
            }
            
            .mobile-members-list {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 5px;
                padding-top: 10px;
                border-top: 1px solid rgba(255, 255, 255, 0.05);
            }
            
            .mobile-member-item {
                display: flex;
                align-items: center;
                gap: 5px;
                background: rgba(0, 0, 0, 0.3);
                padding: 4px 8px;
                border-radius: 20px;
                font-size: 0.8rem;
                color: #e2e8f0;
            }
            
            .mobile-member-item .avatar {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #475569;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }
            .mobile-member-item .avatar img { width: 100%; height: 100%; object-fit: cover; }
        }

        /* PDF Print Mode Overrides */
        .pdf-print-mode {
            background: white !important;
            color: black !important;
        }
        .pdf-print-mode .node-card {
            background: white !important;
            border: 1px solid #333 !important;
            color: black !important;
            box-shadow: none !important;
        }
        .pdf-print-mode .company-node .node-card {
            background: #eef2ff !important;
            border: 2px solid #3b82f6 !important;
        }
        .pdf-print-mode .dept-card, .pdf-print-mode .team-card {
            background: #f8fafc !important;
            border-color: #cbd5e1 !important;
        }
        .pdf-print-mode .node-subtitle, .pdf-print-mode .member-count {
            color: #64748b !important;
        }
        .pdf-print-mode .connector-vertical,
        .pdf-print-mode .connector-horizontal-top,
        .pdf-print-mode .org-branch::before,
        .pdf-print-mode .org-branch-team::before {
            background: #94a3b8 !important;
        }
        .pdf-print-mode .members-list {
            background: transparent !important;
            border: 1px solid #e2e8f0 !important;
        }
        .pdf-print-mode .member-item {
            color: #333 !important;
        }
        /* Hide external images in PDF to prevent CORS errors */
        .pdf-print-mode img {
            display: none !important;
        }
        /* Force show fallback icon container style if needed, or simply let the empty circle be */
        .pdf-print-mode .member-avatar-small {
            background: #ccc !important;
            border: 1px solid #999 !important;
        }
        .pdf-print-mode button {
            display: none !important;
        }
        /* Horizontal Layout Styles */
        .layout-horizontal .chart-inner-wrapper {
            flex-direction: row !important;
            align-items: flex-start !important; /* Start from top-left */
            justify-content: center;
        }

        .layout-horizontal .company-node {
            flex-direction: row;
            align-items: center;
            margin-right: 60px; /* Space for connections */
        }

        .layout-horizontal .connector-vertical,
        .layout-horizontal .connector-horizontal-top {
            display: none !important; /* Hide vertical layout connectors */
        }

        .layout-horizontal .departments-level {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 40px;
            position: relative;
            padding-left: 20px;
        }
        
        /* Line from Company to Depts List */
        .layout-horizontal .departments-level::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50px; /* Adjust based on first card height */
            bottom: 50px; /* Adjust based on last card height */
            width: 2px;
            background: rgba(148, 163, 184, 0.3);
        }
        
        .layout-horizontal .org-branch {
            flex-direction: row !important; /* Dept -> Teams */
            align-items: flex-start !important;
            position: relative;
        }
        
        /* Connector: Depts Vertical Bar -> Dept Card */
        .layout-horizontal .org-branch::before {
            content: '';
            position: absolute;
            left: -20px; /* Connect to the main vertical line */
            top: 35px; /* Middle of card approx */
            width: 20px;
            height: 2px;
            background: rgba(148, 163, 184, 0.3);
        }
        
        /* If it's the only child or first/last, logic gets complex for perfect trees. 
           Simplified: Just draw horizontal lines from a virtual vertical spine. */
           
        .layout-horizontal .org-node.dept-node {
            flex-direction: row;
            align-items: center;
            margin-right: 60px;
        }
        
        .layout-horizontal .org-level.teams-level {
            flex-direction: column !important;
            gap: 20px;
            margin-top: 0 !important;
            margin-left: 0 !important;
            border-left: 2px solid rgba(148, 163, 184, 0.3);
            padding-left: 40px; /* Indent teams */
            position: relative;
        }
        
        .layout-horizontal .org-branch-team {
             flex-direction: row !important;
             align-items: center !important;
             position: relative;
        }
        
        .layout-horizontal .org-branch-team::before {
             content: '';
             position: absolute;
             left: -40px; /* Connect to Team Level Border */
             top: 50%;
             width: 40px;
             height: 2px;
             background: rgba(148, 163, 184, 0.3);
        }

        .layout-horizontal .org-node.team-node {
             align-items: flex-start;
             text-align: left;
             background: rgba(0,0,0,0.2);
             padding: 10px;
             border-radius: 8px;
        }
        
        /* PDF Mode Adjustments for Horizontal */
        .pdf-print-mode.layout-horizontal .departments-level::before,
        .pdf-print-mode.layout-horizontal .org-branch::before,
        .pdf-print-mode.layout-horizontal .org-level.teams-level,
        .pdf-print-mode.layout-horizontal .org-branch-team::before {
             background: #94a3b8 !important;
             border-color: #94a3b8 !important;
        }

      `}</style>
    </div>
  );
};
