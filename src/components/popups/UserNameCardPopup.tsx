import html2canvas from "html2canvas";
import type { FC } from "react";
import { useRef } from "react";
import {
  FaBuilding,
  FaDownload,
  FaEnvelope,
  FaIdCard,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import type { Organization } from "../../types_interfaces/organization";
import type { UserProfile } from "../../types_interfaces/userProfile";

interface UserNameCardPopupProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  company?: Organization;
  department?: Organization;
  team?: Organization;
}

export const UserNameCardPopup: FC<UserNameCardPopupProps> = ({
  isOpen,
  onClose,
  user,
  company,
  department,
  team,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true, // Enable CORS to capture remote images
        allowTaint: true, // Allow tainted canvas just in case
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `${user.name}_NameCard.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Failed to download card:", err);
      alert("Failed to download name card.");
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: "500px",
          width: "90%",
          padding: "0",
          background: "transparent",
          boxShadow: "none",
          border: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "10px",
          }}
        >
          <button
            onClick={handleDownload}
            className="glass-btn glass-btn-primary"
            style={{ marginRight: "10px" }}
          >
            <FaDownload /> Download
          </button>
          <button
            onClick={onClose}
            className="glass-btn glass-btn-cancel"
            style={{ width: "auto", padding: "8px 12px" }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Name Card Container */}
        <div
          ref={cardRef}
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            borderRadius: "16px",
            padding: "30px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
            position: "relative",
            overflow: "hidden",
            color: "white",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Background Decor */}
          <div
            style={{
              position: "absolute",
              top: "-50px",
              right: "-50px",
              width: "200px",
              height: "200px",
              background: "rgba(59, 130, 246, 0.1)",
              borderRadius: "50%",
              filter: "blur(40px)",
              zIndex: 0,
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              bottom: "-30px",
              left: "-30px",
              width: "150px",
              height: "150px",
              background: "rgba(16, 185, 129, 0.1)",
              borderRadius: "50%",
              filter: "blur(30px)",
              zIndex: 0,
            }}
          ></div>

          {/* Header: Company Logo / Name */}
          <div
            style={{
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              paddingBottom: "15px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "1.2rem",
              }}
            >
              <FaBuilding />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "bold" }}>
                {company?.organizationName || "Company Name"}
              </h3>
              <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                {[department?.organizationName, team?.organizationName]
                  .filter(Boolean)
                  .join(" / ")}
              </div>
            </div>
          </div>

          {/* Content: User Info */}
          <div
            style={{
              zIndex: 1,
              display: "flex",
              gap: "20px",
              alignItems: "center",
            }}
          >
            {/* Photo */}
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                border: "3px solid rgba(59, 130, 246, 0.5)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#334155",
                flexShrink: 0,
              }}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  crossOrigin="anonymous" // Essential for html2canvas CORS
                  alt={user.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <FaUser size={30} color="#cbd5e1" />
              )}
            </div>

            {/* Details */}
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: "0 0 5px 0", fontSize: "1.5rem" }}>
                {user.name}
              </h2>
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  background: "rgba(59, 130, 246, 0.2)",
                  borderRadius: "20px",
                  fontSize: "0.8rem",
                  color: "#60a5fa",
                  marginBottom: "10px",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                }}
              >
                {user.role === "admin" ? "Administrator" : "Team Member"}
              </div>
            </div>
          </div>

          {/* Footer: Contact */}
          <div
            style={{
              zIndex: 1,
              marginTop: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#e2e8f0",
                fontSize: "0.9rem",
              }}
            >
              <FaEnvelope style={{ color: "#94a3b8" }} />
              {user.email}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#e2e8f0",
                fontSize: "0.9rem",
              }}
            >
              <FaIdCard style={{ color: "#94a3b8" }} />
              UID: {user.uid.slice(0, 8)}...
            </div>
          </div>

          {/* Watermark-like branding */}
          <div
            style={{
              position: "absolute",
              bottom: "15px",
              right: "20px",
              fontSize: "3rem",
              color: "rgba(255,255,255,0.03)",
              fontWeight: "bold",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            ID CARD
          </div>
        </div>
      </div>
    </div>
  );
};
