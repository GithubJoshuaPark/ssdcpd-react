import type { User } from "firebase/auth";
import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { FaArrowLeft, FaPaperPlane } from "react-icons/fa";
import {
  sendChatMessage,
  subscribeToChatMessages,
} from "../../services/firebaseService";
import type { UserProfile } from "../../types_interfaces/userProfile";
import type { ChatMessage, ChatRoom } from "../../utils/chatUtils";
import { formatTime, getOtherParticipantName } from "../../utils/chatUtils";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      alert("Failed to send message.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <div
        className="auth-modal-overlay"
        onClick={onClose}
        style={{
          zIndex: 12000,
          backgroundColor: "transparent", // Transparent overlay for child popup
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
            background: "#1e293b", // Solid background for chat room
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
              gap: "10px",
            }}
          >
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
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{otherName}</h3>
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
            {messages.map(msg => {
              const isMine = msg.senderId === currentUser.uid;
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isMine ? "flex-end" : "flex-start",
                    maxWidth: "75%",
                  }}
                >
                  <div
                    style={{
                      background: isMine ? "#3b82f6" : "rgba(255,255,255,0.1)",
                      color: isMine ? "white" : "var(--text-primary)",
                      padding: "8px 12px",
                      borderRadius: "12px",
                      borderBottomRightRadius: isMine ? "2px" : "12px",
                      borderBottomLeftRadius: isMine ? "12px" : "2px",
                      fontSize: "0.95rem",
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.text}
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
                      <span style={{ color: msg.read ? "#34d399" : "inherit" }}>
                        {msg.read ? "Read" : "Sent"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
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
    </>
  );
};
