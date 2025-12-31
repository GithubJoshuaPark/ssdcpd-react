import type { User } from "firebase/auth";
import type { FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowDown,
  FaArrowLeft,
  FaArrowUp,
  FaPaperPlane,
  FaSearch,
  FaTimes,
  FaUser,
  FaUserPlus,
} from "react-icons/fa";
import {
  addParticipantsToChatRoom,
  sendChatMessage,
  subscribeToChatMessages,
} from "../../services/firebaseService";
import type { UserProfile } from "../../types_interfaces/userProfile";
import type { ChatMessage, ChatRoom } from "../../utils/chatUtils";
import { formatTime, getOtherParticipantName } from "../../utils/chatUtils";
import { Toast } from "../common/Toast"; // Import Toast
import { UserPopup } from "../popups/UserPopup";

interface ChatRoomPopupProps {
  chatId: string;
  currentUser: User;
  userProfile: UserProfile | null;
  onClose: () => void;
  roomData?: ChatRoom;
}

export const ChatRoomPopup: FC<ChatRoomPopupProps> = ({
  chatId,
  currentUser,
  userProfile,
  onClose,
  roomData,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Search state
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  // Invite state
  const [isInvitePopupOpen, setIsInvitePopupOpen] = useState(false);

  // Participants View state
  const [isParticipantsViewOpen, setIsParticipantsViewOpen] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Derive other participant's name directly during render
  const otherName = roomData
    ? getOtherParticipantName(roomData, currentUser.uid)
    : "Chat";

  // Subscribe to messages
  useEffect(() => {
    const unsubscribe = subscribeToChatMessages(chatId, currentUser.uid, msgs =>
      setMessages(msgs)
    );
    return () => unsubscribe();
  }, [chatId, currentUser.uid]);

  // Derive matches
  const matchIds = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return messages
      .filter(msg => msg.text.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(msg => msg.id);
  }, [messages, searchTerm]);

  // Handle Search Change - Update index immediately
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setCurrentMatchIndex(-1);
      return;
    }
    const matches = messages
      .filter(msg => msg.text.toLowerCase().includes(term.toLowerCase()))
      .map(msg => msg.id);

    if (matches.length > 0) {
      setCurrentMatchIndex(matches.length - 1);
    } else {
      setCurrentMatchIndex(-1);
    }
  };

  // Auto-scroll to bottom behavior for NEW messages if NOT searching
  useEffect(() => {
    if (!searchTerm && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, searchTerm]);

  // Scroll to Current Match
  useEffect(() => {
    if (currentMatchIndex >= 0 && matchIds.length > 0) {
      const safeIndex = Math.min(currentMatchIndex, matchIds.length - 1);
      const activeId = matchIds[safeIndex];
      const el = messageRefs.current[activeId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentMatchIndex, matchIds]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await sendChatMessage(
        chatId,
        currentUser.uid,
        userProfile?.name || "Unknown",
        newMessage
      );
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
      setToast({ message: "Failed to send message.", type: "error" });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Search Navigation Handlers
  const handleNextMatch = () => {
    if (matchIds.length === 0) return;
    setCurrentMatchIndex(prev => (prev + 1) % matchIds.length);
  };

  const handlePrevMatch = () => {
    if (matchIds.length === 0) return;
    setCurrentMatchIndex(
      prev => (prev - 1 + matchIds.length) % matchIds.length
    );
  };

  const clearSearch = () => {
    handleSearchChange("");
  };

  const handleInviteUsers = async (selectedUsers: UserProfile[]) => {
    if (selectedUsers.length === 0) return;
    try {
      await addParticipantsToChatRoom(chatId, selectedUsers);
      setToast({ message: "Users invited successfully!", type: "success" });
      setIsInvitePopupOpen(false);
    } catch (error) {
      console.error("Failed to invite users:", error);
      setToast({ message: "Failed to invite users.", type: "error" });
    }
  };

  // Text Highlighter
  const renderHighlightedText = (text: string, isActive: boolean) => {
    if (!searchTerm) return text;

    const parts = text.split(new RegExp(`(${searchTerm})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <span
          key={i}
          style={{
            backgroundColor: isActive ? "#fbbf24" : "#fef08a",
            color: "black",
            borderRadius: "2px",
            padding: "0 2px",
          }}
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <>
      <div
        className="auth-modal-overlay"
        onClick={onClose}
        style={{
          zIndex: 12000,
          backgroundColor: "transparent",
        }}
      >
        <div
          className="glass-panel"
          onClick={e => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "380px",
            height: "550px",
            maxWidth: "90vw",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "#1e293b",
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
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={onClose}
                className="glass-btn"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  padding: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  background: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(5px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "var(--text-primary)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <FaArrowLeft />
              </button>
              <h3
                onClick={() => setIsParticipantsViewOpen(true)}
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  maxWidth: "200px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
                title="View Participants"
                onMouseEnter={e =>
                  (e.currentTarget.style.textDecoration = "underline")
                }
                onMouseLeave={e =>
                  (e.currentTarget.style.textDecoration = "none")
                }
              >
                {otherName}
              </h3>
            </div>

            {/* Invite Button */}
            <button
              onClick={() => setIsInvitePopupOpen(true)}
              className="glass-btn"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                padding: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(5px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "var(--text-primary)",
                transition: "all 0.2s ease",
              }}
              title="Invite Users"
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <FaUserPlus />
            </button>
          </div>

          {/* Search Bar with Navigation */}
          <div
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div style={{ position: "relative", flex: 1 }}>
                <FaSearch
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    fontSize: "0.8rem",
                  }}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => handleSearchChange(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      if (e.shiftKey) handlePrevMatch();
                      else handleNextMatch();
                    }
                  }}
                  placeholder="Find in chat..."
                  style={{
                    width: "100%",
                    padding: "8px 30px 8px 32px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "10px",
                    color: "var(--text-primary)",
                    outline: "none",
                    fontSize: "0.85rem",
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: 2,
                      display: "flex",
                    }}
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </div>

              {/* Navigation Controls */}
              {searchTerm && (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginRight: "4px",
                      minWidth: "30px",
                      textAlign: "center",
                    }}
                  >
                    {matchIds.length > 0
                      ? `${
                          Math.min(currentMatchIndex, matchIds.length - 1) + 1
                        }/${matchIds.length}`
                      : "0/0"}
                  </span>
                  <button
                    onClick={handlePrevMatch}
                    disabled={matchIds.length === 0}
                    className="glass-btn"
                    style={{
                      width: "24px",
                      height: "24px",
                      padding: 0,
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(255,255,255,0.1)",
                    }}
                  >
                    <FaArrowUp size={12} />
                  </button>
                  <button
                    onClick={handleNextMatch}
                    disabled={matchIds.length === 0}
                    className="glass-btn"
                    style={{
                      width: "24px",
                      height: "24px",
                      padding: 0,
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(255,255,255,0.1)",
                    }}
                  >
                    <FaArrowDown size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "var(--text-muted)",
                  marginTop: "20px",
                }}
              >
                No messages yet.
              </div>
            ) : (
              messages.map(msg => {
                const isMine = msg.senderId === currentUser.uid;
                const isMatch = matchIds.includes(msg.id);
                const safeIndex = Math.min(
                  currentMatchIndex,
                  matchIds.length - 1
                );
                const isActiveMatch = isMatch && matchIds[safeIndex] === msg.id;

                return (
                  <div
                    key={msg.id}
                    ref={el => {
                      messageRefs.current[msg.id] = el;
                    }}
                    style={{
                      alignSelf: isMine ? "flex-end" : "flex-start",
                      maxWidth: "75%",
                      transition: "all 0.3s ease",
                      transform: isActiveMatch ? "scale(1.02)" : "scale(1)",
                    }}
                  >
                    <div
                      style={{
                        background: isMine
                          ? "#3b82f6"
                          : "rgba(255,255,255,0.1)",
                        color: isMine ? "white" : "var(--text-primary)",
                        padding: "8px 12px",
                        borderRadius: "12px",
                        borderBottomRightRadius: isMine ? "2px" : "12px",
                        borderBottomLeftRadius: isMine ? "12px" : "2px",
                        fontSize: "0.95rem",
                        wordBreak: "break-word",
                        boxShadow: isActiveMatch ? "0 0 0 2px #fbbf24" : "none",
                      }}
                    >
                      {renderHighlightedText(msg.text, isActiveMatch)}
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--text-muted)",
                        marginTop: "4px",
                        textAlign: isMine ? "right" : "left",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: isMine ? "flex-end" : "flex-start",
                        gap: "4px",
                      }}
                    >
                      <span>{formatTime(msg.timestamp)}</span>
                      {isMine && (
                        <span
                          style={{ color: msg.read ? "#34d399" : "inherit" }}
                        >
                          {msg.read ? "Read" : "Sent"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: "12px",
              background: "rgba(255,255,255,0.05)",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              gap: "8px",
            }}
          >
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              style={{
                flex: 1,
                background: "rgba(0,0,0,0.2)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "20px",
                padding: "10px 16px",
                color: "var(--text-primary)",
                resize: "none",
                height: "44px",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="glass-btn glass-btn-primary"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                padding: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                opacity: newMessage.trim() ? 1 : 0.5,
              }}
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </div>

      {/* Participants Modal */}
      {isParticipantsViewOpen && roomData && (
        <div
          className="auth-modal-overlay"
          onClick={() => setIsParticipantsViewOpen(false)}
          style={{
            zIndex: 12100,
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            className="glass-panel"
            onClick={e => e.stopPropagation()}
            style={{
              width: "300px",
              maxHeight: "400px",
              borderRadius: "16px",
              padding: "0",
              overflow: "hidden",
              background: "rgba(30, 41, 59, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(255,255,255,0.05)",
              }}
            >
              <h4 style={{ margin: 0 }}>
                Participants ({Object.keys(roomData.participants).length})
              </h4>
              <button
                onClick={() => setIsParticipantsViewOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div
              style={{
                padding: "8px 0",
                overflowY: "auto",
                maxHeight: "350px",
              }}
            >
              {Object.entries(roomData.participants).map(([uid, info]) => (
                <div
                  key={uid}
                  style={{
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    <FaUser size={14} />
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: "500" }}>
                      {info.name} {uid === currentUser.uid && "(You)"}
                      {roomData.creatorId === uid && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "#fbbf24",
                            marginLeft: "6px",
                          }}
                        >
                          Owner
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {info.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <UserPopup
        isOpen={isInvitePopupOpen}
        onClose={() => setIsInvitePopupOpen(false)}
        onSelect={handleInviteUsers}
        selectionMode="multiple"
        title="Invite Users"
        excludedIds={[
          currentUser.uid,
          ...(roomData ? Object.keys(roomData.participants) : []),
        ]}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};
