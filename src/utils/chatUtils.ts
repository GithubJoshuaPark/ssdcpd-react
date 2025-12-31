export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  read?: boolean;
}

export interface ChatRoom {
  id: string;
  participants: Record<string, { name: string; email: string }>;
  lastMessage?: string;
  lastMessageAt?: number;
}

export const getChatRoomId = (uid1: string, uid2: string) => {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
};

export const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getOtherParticipantName = (
  room: ChatRoom,
  currentUserId: string
) => {
  const otherId = Object.keys(room.participants).find(
    uid => uid !== currentUserId
  );
  return otherId ? room.participants[otherId]?.name : "Unknown";
};
