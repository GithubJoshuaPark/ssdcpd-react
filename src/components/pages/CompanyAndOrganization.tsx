import { getAuth, onAuthStateChanged } from "firebase/auth";
import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  FaBuilding,
  FaEdit,
  FaPlus,
  FaTrash,
  FaUsers,
  FaUserTimes,
} from "react-icons/fa";
import {
  addOrganization,
  deleteOrganization,
  getAllOrganizations,
  getAllUserProfiles,
  getUserProfile,
  updateOrganization,
} from "../../services/firebaseService";
import type { Organization } from "../../types_interfaces/organization";
import type { UserProfile } from "../../types_interfaces/userProfile";
import { ConfirmDialog } from "../common/ConfirmDialog"; // Added
import { LoadingSpinner } from "../common/LoadingSpinner";
import { RichEditor } from "../common/RichEditor";
import { Toast } from "../common/Toast";
import { UserPopup } from "../popups/UserPopup";
import { ShowCompanyOrganization } from "./ShowCompanyOrganization";

export const CompanyAndOrganization: FC = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]); // For member mapping
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Selection States
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // User Popup State
  const [isUserPopupOpen, setIsUserPopupOpen] = useState(false);

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formType, setFormType] = useState<"company" | "dept" | "team">(
    "company"
  );
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    president: "", // Only for company
    description: "",
  });

  // Admin Check State
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Chart View State
  const [viewingCompanyId, setViewingCompanyId] = useState<string | null>(null);

  // Confirm Dialog State (Member Removal)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  // Confirm Dialog State (Organization Deletion)
  const [isOrgDeleteConfirmOpen, setIsOrgDeleteConfirmOpen] = useState(false);
  const [orgIdToDelete, setOrgIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile?.role === "admin") {
            setIsAdmin(true);
            loadData();
          } else {
            setIsAdmin(false);
            setToast({ message: "Access Denied. Admins only.", type: "error" });
          }
        } catch (error) {
          console.error(error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
        setToast({ message: "Please login first.", type: "error" });
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  // Responsive State
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [mobileView, setMobileView] = useState<
    "company" | "dept" | "team" | "members"
  >("company");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orgData, userData] = await Promise.all([
        getAllOrganizations(),
        getAllUserProfiles(),
      ]);
      setOrgs(orgData);
      setUsers(userData);
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to load data.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // --- Derived Lists ---

  const companies = useMemo(
    () =>
      orgs
        .filter(o => !o.parentId)
        .sort((a, b) => a.organizationName.localeCompare(b.organizationName)),
    [orgs]
  );

  const departments = useMemo(
    () =>
      selectedCompanyId
        ? orgs
            .filter(o => o.parentId === selectedCompanyId)
            .sort((a, b) =>
              a.organizationName.localeCompare(b.organizationName)
            )
        : [],
    [orgs, selectedCompanyId]
  );

  const teams = useMemo(
    () =>
      selectedDeptId
        ? orgs
            .filter(o => o.parentId === selectedDeptId)
            .sort((a, b) =>
              a.organizationName.localeCompare(b.organizationName)
            )
        : [],
    [orgs, selectedDeptId]
  );

  const selectedTeam = useMemo(
    () => orgs.find(o => o.id === selectedTeamId),
    [orgs, selectedTeamId]
  );

  const teamMembers = useMemo(() => {
    if (!selectedTeam || !selectedTeam.members) return [];
    return users.filter(u => selectedTeam.members!.includes(u.uid));
  }, [selectedTeam, users]);

  // --- Handlers ---

  const handleOpenCreate = (type: "company" | "dept" | "team") => {
    setFormType(type);
    setFormMode("create");
    setEditingOrg(null);
    setFormData({ name: "", president: "", description: "" });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (
    org: Organization,
    type: "company" | "dept" | "team"
  ) => {
    setFormType(type);
    setFormMode("edit");
    setEditingOrg(org);
    setFormData({
      name: org.organizationName,
      president: org.presidentName || "",
      description: org.description || "",
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setToast({ message: "Name is required.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const parentId =
        formType === "dept"
          ? selectedCompanyId
          : formType === "team"
          ? selectedDeptId
          : undefined;

      const now = new Date().toISOString();

      const commonData = {
        organizationName: formData.name,
        description: formData.description,
        updatedAt: now,
      };

      if (formMode === "create") {
        const newOrgId = await addOrganization({
          ...commonData,
          presidentName: formType === "company" ? formData.president : null,
          parentId: parentId || null,
          childIds: [],
          status: "active",
          startDate: now, // Default start
          endDate: "9999-12-31", // Default end
          createdAt: now,
          members: [],
        });

        // Update parent's childIds
        if (parentId) {
          const parentOrg = orgs.find(o => o.id === parentId);
          if (parentOrg) {
            const currentChildIds = parentOrg.childIds || [];
            // Remove duplicates just in case
            const uniqueChildIds = Array.from(
              new Set([...currentChildIds, newOrgId])
            );
            await updateOrganization(parentOrg.id!, {
              childIds: uniqueChildIds,
              updatedAt: now,
            });
          }
        }

        setToast({ message: "Created successfully.", type: "success" });
      } else if (editingOrg && editingOrg.id) {
        // 1. Calculate my correct childIds based on current orgs data (Self-correction)
        const myChildrenIds = orgs
          .filter(o => o.parentId === editingOrg.id)
          .map(o => o.id!);
        const uniqueMyChildrenIds = Array.from(new Set(myChildrenIds));

        await updateOrganization(editingOrg.id, {
          ...commonData,
          presidentName: formType === "company" ? formData.president : null,
          childIds: uniqueMyChildrenIds, // Update with actual children found
        });

        // 2. Ensure I am in my parent's childIds (Parent-correction)
        if (editingOrg.parentId) {
          const parent = orgs.find(o => o.id === editingOrg.parentId);
          if (parent) {
            const parentChildIds = parent.childIds || [];
            if (!parentChildIds.includes(editingOrg.id)) {
              const uniqueParentChildIds = Array.from(
                new Set([...parentChildIds, editingOrg.id])
              );
              await updateOrganization(parent.id!, {
                childIds: uniqueParentChildIds,
                updatedAt: now,
              });
            }
          }
        }

        setToast({ message: "Updated successfully.", type: "success" });
      }

      setIsFormOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to save.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    const org = orgs.find(o => o.id === id);
    if (org?.childIds && org.childIds.length > 0) {
      setToast({
        message:
          "Cannot delete organization with children. Please delete child organizations first.",
        type: "error",
      });
      return;
    }
    setOrgIdToDelete(id);
    setIsOrgDeleteConfirmOpen(true);
  };

  const executeDeleteOrg = async () => {
    if (!orgIdToDelete) return;

    setLoading(true);
    try {
      const org = orgs.find(o => o.id === orgIdToDelete);

      await deleteOrganization(orgIdToDelete);

      // Remove from parent's childIds
      if (org?.parentId) {
        const parentOrg = orgs.find(p => p.id === org.parentId);
        if (
          parentOrg &&
          parentOrg.childIds &&
          parentOrg.childIds.includes(orgIdToDelete)
        ) {
          const newChildIds = parentOrg.childIds.filter(
            cid => cid !== orgIdToDelete
          );
          await updateOrganization(parentOrg.id!, {
            childIds: newChildIds,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      setToast({ message: "Deleted successfully.", type: "success" });
      // Deselect if needed
      if (selectedCompanyId === orgIdToDelete) setSelectedCompanyId(null);
      if (selectedDeptId === orgIdToDelete) setSelectedDeptId(null);
      if (selectedTeamId === orgIdToDelete) setSelectedTeamId(null);
      loadData();
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to delete.", type: "error" });
    } finally {
      setLoading(false);
      setIsOrgDeleteConfirmOpen(false);
      setOrgIdToDelete(null);
    }
  };

  const handleAddMembers = async (selectedUsers: UserProfile[]) => {
    if (!selectedTeamId || !selectedTeam) return;

    const newMemberIds = selectedUsers.map(u => u.uid);
    const currentMemberIds = selectedTeam.members || [];
    // Merge unique
    const mergedIds = Array.from(
      new Set([...currentMemberIds, ...newMemberIds])
    );

    setLoading(true);
    try {
      await updateOrganization(selectedTeamId, {
        members: mergedIds,
        updatedAt: new Date().toISOString(),
      });
      setToast({ message: "Members added.", type: "success" });
      loadData();
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to add members.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = (uid: string) => {
    setMemberToRemove(uid);
    setIsConfirmOpen(true);
  };

  const executeRemoveMember = async () => {
    if (!memberToRemove || !selectedTeamId || !selectedTeam) return;

    const currentMemberIds = selectedTeam.members || [];
    const newMemberIds = currentMemberIds.filter(id => id !== memberToRemove);

    setLoading(true);
    try {
      await updateOrganization(selectedTeamId, {
        members: newMemberIds,
        updatedAt: new Date().toISOString(),
      });
      setToast({ message: "Member removed.", type: "success" });
      loadData();
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to remove member.", type: "error" });
    } finally {
      setLoading(false);
      setIsConfirmOpen(false);
      setMemberToRemove(null);
    }
  };

  // --- Render Helpers ---

  if (!authChecked) {
    return (
      <div style={{ padding: "20px", color: "#eee" }}>
        <LoadingSpinner message="Checking permissions..." />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        style={{
          padding: "50px",
          color: "#eee",
          textAlign: "center",
          fontSize: "1.2rem",
        }}
      >
        Access Denied. You do not have permission to view this page.
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    );
  }

  const renderCard = (
    org: Organization,
    isActive: boolean,
    onClick: () => void,
    type: "company" | "dept" | "team"
  ) => (
    <div
      key={org.id}
      onClick={onClick}
      style={{
        padding: "15px",
        borderRadius: "8px",
        background: isActive
          ? "linear-gradient(145deg, #1e293b, #0f172a)"
          : "rgba(255,255,255,0.03)",
        border: isActive
          ? "1px solid #3b82f6"
          : "1px solid rgba(255,255,255,0.1)",
        marginBottom: "10px",
        cursor: "pointer",
        transition: "all 0.2s",
        position: "relative",
      }}
    >
      <div
        style={{
          fontWeight: "600",
          fontSize: "1rem",
          color: isActive ? "#3b82f6" : "white",
        }}
      >
        {org.organizationName}
      </div>
      {org.description && (
        <div
          style={{
            marginTop: "5px",
            fontSize: "0.8rem",
            color: "#888",
            maxHeight: "3.6em",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              pointerEvents: "none",
              transform: "scale(0.9)",
              transformOrigin: "top left",
              width: "110%",
            }}
          >
            <RichEditor value={org.description} readOnly={true} />
          </div>
        </div>
      )}

      {isActive && (
        <div
          style={{
            marginTop: "10px",
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          {type === "company" && (
            <button
              onClick={e => {
                e.stopPropagation();
                setViewingCompanyId(org.id!);
              }}
              style={{
                fontSize: "0.8rem",
                padding: "4px 8px",
                borderRadius: "4px",
                background: "rgba(59, 130, 246, 0.2)",
                color: "#60a5fa",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                cursor: "pointer",
                marginRight: "auto", // Push to left
              }}
            >
              조직도보기
            </button>
          )}
          <button
            onClick={e => {
              e.stopPropagation();
              handleOpenEdit(org, type);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#aaa",
              cursor: "pointer",
            }}
          >
            <FaEdit />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              handleDelete(org.id!);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#ef4444",
              cursor: "pointer",
            }}
          >
            <FaTrash />
          </button>
        </div>
      )}
    </div>
  );

  // If viewing chart, show chart component full screen (or overlay)
  if (viewingCompanyId) {
    return (
      <ShowCompanyOrganization
        companyId={viewingCompanyId}
        orgs={orgs}
        users={users}
        onClose={() => setViewingCompanyId(null)}
      />
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        height: "100%",
        overflowY: "auto",
        color: "#eee",
      }}
    >
      {loading && <LoadingSpinner message="Processing..." />}
      <h2
        style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: "20px" }}
      >
        Company & Organization
      </h2>

      {isMobile && (
        <div
          style={{
            marginBottom: "15px",
            display: "flex",
            gap: "10px",
            alignItems: "center",
            overflowX: "auto",
            paddingBottom: "5px",
          }}
        >
          {mobileView !== "company" && (
            <button
              onClick={() => {
                if (mobileView === "dept") setMobileView("company");
                if (mobileView === "team") setMobileView("dept");
                if (mobileView === "members") setMobileView("team");
              }}
              className="glass-btn glass-btn-cancel"
              style={{
                padding: "6px 14px",
                fontSize: "0.85rem",
                height: "auto",
              }}
            >
              ← Back
            </button>
          )}
          <div
            style={{
              display: "flex",
              gap: "5px",
              fontSize: "0.9rem",
              color: "#888",
            }}
          >
            <span
              onClick={() => setMobileView("company")}
              style={{
                color: mobileView === "company" ? "#3b82f6" : "inherit",
                cursor: "pointer",
                fontWeight: mobileView === "company" ? "bold" : "normal",
              }}
            >
              Company
            </span>
            <span>/</span>
            <span
              onClick={() => selectedCompanyId && setMobileView("dept")}
              style={{
                color:
                  mobileView === "dept"
                    ? "#3b82f6"
                    : selectedCompanyId
                    ? "inherit"
                    : "#555",
                cursor: selectedCompanyId ? "pointer" : "default",
                fontWeight: mobileView === "dept" ? "bold" : "normal",
              }}
            >
              Dept
            </span>
            <span>/</span>
            <span
              onClick={() => selectedDeptId && setMobileView("team")}
              style={{
                color:
                  mobileView === "team"
                    ? "#3b82f6"
                    : selectedDeptId
                    ? "inherit"
                    : "#555",
                cursor: selectedDeptId ? "pointer" : "default",
                fontWeight: mobileView === "team" ? "bold" : "normal",
              }}
            >
              Team
            </span>
            <span>/</span>
            <span
              onClick={() => selectedTeamId && setMobileView("members")}
              style={{
                color:
                  mobileView === "members"
                    ? "#3b82f6"
                    : selectedTeamId
                    ? "inherit"
                    : "#555",
                cursor: selectedTeamId ? "pointer" : "default",
                fontWeight: mobileView === "members" ? "bold" : "normal",
              }}
            >
              Members
            </span>
          </div>
        </div>
      )}

      <div
        style={{
          display: isMobile ? "block" : "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "20px",
          height: "calc(100vh - 150px)",
        }}
      >
        {/* 1. Company Column */}
        <div
          className="org-col"
          style={{
            display: isMobile && mobileView !== "company" ? "none" : "flex",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaBuilding /> Company
            </h3>
            <button
              onClick={() => handleOpenCreate("company")}
              className="icon-btn"
            >
              <FaPlus />
            </button>
          </div>
          <div className="org-list">
            {companies.map(c =>
              renderCard(
                c,
                selectedCompanyId === c.id,
                () => {
                  setSelectedCompanyId(c.id!);
                  if (isMobile) {
                    setSelectedDeptId(null);
                    setSelectedTeamId(null);
                    setMobileView("dept");
                  } else {
                    setSelectedDeptId(null);
                    setSelectedTeamId(null);
                  }
                },
                "company"
              )
            )}
          </div>
        </div>

        {/* 2. Department Column */}
        <div
          className="org-col"
          style={{
            display: isMobile && mobileView !== "dept" ? "none" : "flex",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              Department
            </h3>
            <button
              onClick={() => handleOpenCreate("dept")}
              className="icon-btn"
              disabled={!selectedCompanyId}
              style={{ opacity: !selectedCompanyId ? 0.3 : 1 }}
            >
              <FaPlus />
            </button>
          </div>
          <div className="org-list">
            {!selectedCompanyId ? (
              <div className="empty-msg">Select a Company first</div>
            ) : (
              departments.map(d =>
                renderCard(
                  d,
                  selectedDeptId === d.id,
                  () => {
                    setSelectedDeptId(d.id!);
                    if (isMobile) {
                      setSelectedTeamId(null);
                      setMobileView("team");
                    } else {
                      setSelectedTeamId(null);
                    }
                  },
                  "dept"
                )
              )
            )}
          </div>
        </div>

        {/* 3. Team Column */}
        <div
          className="org-col"
          style={{
            display: isMobile && mobileView !== "team" ? "none" : "flex",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              Team
            </h3>
            <button
              onClick={() => handleOpenCreate("team")}
              className="icon-btn"
              disabled={!selectedDeptId}
              style={{ opacity: !selectedDeptId ? 0.3 : 1 }}
            >
              <FaPlus />
            </button>
          </div>
          <div className="org-list">
            {!selectedDeptId ? (
              <div className="empty-msg">Select a Department first</div>
            ) : (
              teams.map(t =>
                renderCard(
                  t,
                  selectedTeamId === t.id,
                  () => {
                    setSelectedTeamId(t.id!);
                    if (isMobile) setMobileView("members");
                  },
                  "team"
                )
              )
            )}
          </div>
        </div>

        {/* 4. Members Column */}
        <div
          className="org-col"
          style={{
            background: "rgba(0,0,0,0.2)",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.05)",
            display: isMobile && mobileView !== "members" ? "none" : "flex",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
              padding: "0 5px",
            }}
          >
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaUsers /> Members
            </h3>
            <button
              onClick={() => setIsUserPopupOpen(true)}
              className="icon-btn"
              disabled={!selectedTeamId}
              style={{ opacity: !selectedTeamId ? 0.3 : 1 }}
            >
              <FaPlus />
            </button>
          </div>
          <div className="org-list">
            {!selectedTeamId ? (
              <div className="empty-msg">Select a Team first</div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {teamMembers.length === 0 ? (
                  <div className="empty-msg">No members assigned</div>
                ) : (
                  teamMembers.map(u => (
                    <div
                      key={u.uid}
                      style={{
                        padding: "10px",
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          background: "#444",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.8rem",
                        }}
                      >
                        {u.photoURL ? (
                          <img
                            src={u.photoURL}
                            style={{ width: "100%", height: "100%" }}
                          />
                        ) : (
                          u.name?.[0] || "U"
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.9rem", fontWeight: "600" }}>
                          {u.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#888" }}>
                          {u.email}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(u.uid)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#666",
                          cursor: "pointer",
                        }}
                      >
                        <FaUserTimes />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Styles for this page */}
      <style>{`
            .org-col {
                display: flex;
                flex-direction: column;
                background: rgba(255, 255, 255, 0.02);
                border-radius: 12px;
                padding: 15px;
                height: 100%;
            }
            .org-list {
                flex: 1;
                overflow-y: auto;
                padding-right: 5px;
            }
            .org-list::-webkit-scrollbar {
                width: 4px;
            }
            .org-list::-webkit-scrollbar-thumb {
                background: #444;
                borderRadius: 2px;
            }
            .icon-btn {
                background: rgba(59, 130, 246, 0.1);
                color: #3b82f6;
                border: 1px solid rgba(59, 130, 246, 0.3);
                border-radius: 6px;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
            }
            .icon-btn:hover:not(:disabled) {
                background: #3b82f6;
                color: white;
            }
            .empty-msg {
                color: #555;
                font-size: 0.9rem;
                text-align: center;
                margin-top: 20px;
                font-style: italic;
            }
            .glass-btn {
                padding: 10px 24px;
                border-radius: 12px;
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                transition: all 0.3s ease;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
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
            }
            .glass-btn-primary {
                background: rgba(59, 130, 246, 0.3);
                border: 1px solid rgba(59, 130, 246, 0.5);
                color: white;
                box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
            }
            .glass-btn-primary:hover {
                background: rgba(59, 130, 246, 0.6);
                border-color: rgba(59, 130, 246, 0.8);
                box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
                transform: translateY(-2px);
            }
        `}</style>

      {/* Form Modal */}
      {isFormOpen && (
        <div
          className="auth-modal-overlay"
          onClick={() => setIsFormOpen(false)}
        >
          <div
            className="auth-modal-content"
            onClick={e => e.stopPropagation()}
          >
            <h3>
              {formMode === "create" ? "Add" : "Edit"}{" "}
              {formType === "company"
                ? "Company"
                : formType === "dept"
                ? "Department"
                : "Team"}
            </h3>
            <div className="auth-form-group">
              <label>Name</label>
              <input
                className="auth-input"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                autoFocus
              />
            </div>
            {formType === "company" && (
              <div className="auth-form-group">
                <label>President</label>
                <input
                  className="auth-input"
                  value={formData.president}
                  onChange={e =>
                    setFormData({ ...formData, president: e.target.value })
                  }
                />
              </div>
            )}
            <div className="auth-form-group">
              <label>Description</label>
              <RichEditor
                value={formData.description}
                onChange={val => setFormData({ ...formData, description: val })}
                placeholder="Description"
                minHeight="150px"
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                onClick={() => setIsFormOpen(false)}
                className="glass-btn glass-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="glass-btn glass-btn-primary"
              >
                {formMode === "create" ? "Add" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <UserPopup
        isOpen={isUserPopupOpen}
        onClose={() => setIsUserPopupOpen(false)}
        onSelect={users => {
          handleAddMembers(users);
          setIsUserPopupOpen(false);
        }}
        selectionMode="multiple"
        title="Select Members"
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Remove Member"
        message="Are you sure you want to remove this member from the team?"
        confirmText="Remove"
        onConfirm={executeRemoveMember}
        onCancel={() => {
          setIsConfirmOpen(false);
          setMemberToRemove(null);
        }}
      />

      <ConfirmDialog
        isOpen={isOrgDeleteConfirmOpen}
        title="Delete Organization"
        message="Are you sure you want to delete this organization? Children will be orphaned."
        confirmText="Delete"
        onConfirm={executeDeleteOrg}
        onCancel={() => {
          setIsOrgDeleteConfirmOpen(false);
          setOrgIdToDelete(null);
        }}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
