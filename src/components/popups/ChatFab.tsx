import type { FC } from "react";
import { useEffect, useState } from "react";
import { FaCommentDots } from "react-icons/fa";
import { useAuth } from "../../auth/useAuth";
import { subscribeToUnreadCount } from "../../services/firebaseService";
import { ChatManagerPopup } from "./ChatManagerPopup";

// --- Main Component: ChatFab (Entry Point) ---
export const ChatFab: FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToUnreadCount(currentUser.uid, count => {
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <>
      <style>{`
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
          justify-content: center;
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
        }
        .glass-btn-cancel:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
          transform: translateY(-1px);
          color: #fca5a5;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
        }
      `}</style>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="chat-fab glass-btn-primary"
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "24px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
          zIndex: 9999,
          padding: 0,
        }}
      >
        <FaCommentDots />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              background: "#ef4444",
              color: "white",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              fontSize: "12px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontWeight: "bold",
              border: "2px solid #fff",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Manager Popup */}
      {isOpen && (
        <ChatManagerPopup
          currentUser={currentUser}
          userProfile={userProfile}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
