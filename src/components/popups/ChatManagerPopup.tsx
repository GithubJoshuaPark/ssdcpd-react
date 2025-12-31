import type { User } from "firebase/auth";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { FaPlus, FaSearch, FaTimes, FaTrash } from "react-icons/fa";
import type { UserProfile } from "../../types_interfaces/userProfile";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { UserPopup } from "../popups/UserPopup";

import {
  createOrUpdateChatRoom,
  deleteChatRoom,
  subscribeToChatRooms,
} from "../../services/firebaseService";
import type { ChatRoom } from "../../utils/chatUtils";
import {
  formatTime,
  getChatRoomId,
  getOtherParticipantName,
} from "../../utils/chatUtils";
import { ChatRoomPopup } from "./ChatRoomPopup";

interface ChatManagerPopupProps {
  currentUser: User;
  userProfile: UserProfile | null;
  onClose: () => void;
}

export const ChatManagerPopup: FC<ChatManagerPopupProps> = ({
  currentUser,
  userProfile,
  onClose,
}) => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [isUserPopupOpen, setIsUserPopupOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Load Chat Rooms list
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToChatRooms(currentUser.uid, rooms => {
      setChatRooms(rooms);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleUserSelect = async (selectedUsers: UserProfile[]) => {
    if (selectedUsers.length === 0) return;
    const targetUser = selectedUsers[0];
    const roomId = getChatRoomId(currentUser.uid, targetUser.uid);

    try {
      await createOrUpdateChatRoom(
        roomId,
        currentUser.uid,
        currentUser.email || "",
        userProfile?.name || "Unknown",
        targetUser.uid,
        targetUser.email || "",
        targetUser.name || "Unknown"
      );
      setIsUserPopupOpen(false);
      setActiveChatId(roomId);
    } catch (error) {
      console.error("Failed to create chat room:", error);
      alert("Failed to create chat room");
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      await deleteChatRoom(roomToDelete);
      if (activeChatId === roomToDelete) {
        setActiveChatId(null);
      }
    } catch (error) {
      console.error("Failed to delete chat room:", error);
      alert("Failed to delete chat room");
    } finally {
      setRoomToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const filteredRooms = chatRooms.filter(room =>
    getOtherParticipantName(room, currentUser.uid)
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div
        className="auth-modal-overlay"
        onClick={onClose}
        style={{
          zIndex: 10000,
          backgroundColor: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
        }}
      >
        <div
          className="glass-panel"
          onClick={e => e.stopPropagation()}
          style={{
            width: "400px",
            height: "600px",
            maxWidth: "95vw",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(30, 41, 59, 0.8)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px",
              background: "rgba(255,255,255,0.05)",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Chats</h3>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setIsUserPopupOpen(true)}
                className="glass-btn glass-btn-primary"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  padding: 0,
                }}
                title="New Chat"
              >
                <FaPlus />
              </button>
              <button
                onClick={onClose}
                className="glass-btn glass-btn-cancel"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  padding: 0,
                }}
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <FaSearch
                style={{
                  position: "absolute",
                  left: "12px",
                  color: "var(--text-muted)",
                  fontSize: "0.9rem",
                }}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search chats..."
                style={{
                  width: "100%",
                  padding: "10px 10px 10px 36px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  color: "var(--text-primary)",
                  outline: "none",
                  fontSize: "0.95rem",
                }}
              />
            </div>
          </div>

          {/* List Content */}
          <div className="chat-list" style={{ flex: 1, overflowY: "auto" }}>
            {filteredRooms.length === 0 ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                {searchTerm ? (
                  <p>No chats found.</p>
                ) : (
                  <>
                    <p>No chats yet.</p>
                    <p style={{ fontSize: "0.85rem" }}>
                      Press + to start a conversation.
                    </p>
                  </>
                )}
              </div>
            ) : (
              filteredRooms.map(room => (
                <div
                  key={room.id}
                  onClick={() => setActiveChatId(room.id)}
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={e =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.05)")
                  }
                  onMouseLeave={e =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div style={{ overflow: "hidden", flex: 1 }}>
                    <div
                      style={{
                        fontWeight: "bold",
                        marginBottom: "4px",
                        fontSize: "1rem",
                      }}
                    >
                      {getOtherParticipantName(room, currentUser.uid)}
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {room.lastMessage || "No messages"}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {room.lastMessageAt ? formatTime(room.lastMessageAt) : ""}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setRoomToDelete(room.id);
                        setDeleteConfirmOpen(true);
                      }}
                      className="glass-btn"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        padding: 0,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        background: "rgba(239, 68, 68, 0.1)",
                        backdropFilter: "blur(4px)",
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        color: "#ef4444",
                        fontSize: "0.8rem",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background =
                          "rgba(239, 68, 68, 0.2)";
                        e.currentTarget.style.transform = "scale(1.1)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background =
                          "rgba(239, 68, 68, 0.1)";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {activeChatId && (
        <ChatRoomPopup
          chatId={activeChatId}
          currentUser={currentUser}
          userProfile={userProfile}
          onClose={() => setActiveChatId(null)}
          roomData={chatRooms.find(r => r.id === activeChatId)}
        />
      )}

      <UserPopup
        isOpen={isUserPopupOpen}
        onClose={() => setIsUserPopupOpen(false)}
        onSelect={handleUserSelect}
        selectionMode="single"
        title="New Chat"
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Chat"
        message="Are you sure you want to delete this chat room? All history will be lost."
        confirmText="Delete"
        onConfirm={handleDeleteRoom}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setRoomToDelete(null);
        }}
      />
    </>
  );
};
