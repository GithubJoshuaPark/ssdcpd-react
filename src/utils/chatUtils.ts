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
  creatorId?: string;
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
  // 1. If Creator exists, use Creator Name + Others Count
  if (room.creatorId && room.participants[room.creatorId]) {
    const creatorName = room.participants[room.creatorId].name;
    const totalCount = Object.keys(room.participants).length;
    // "외 N명" -> Total - 1 (the creator themselves)
    const othersCount = totalCount - 1;

    if (othersCount > 0) {
      return `${creatorName} + ${othersCount}`;
    }
    return creatorName;
  }

  // 2. Fallback for rooms without creatorId (e.g. legacy or simple 1:1 without creator tracking)
  const otherIds = Object.keys(room.participants).filter(
    uid => uid !== currentUserId
  );

  if (otherIds.length === 0) return "Unknown";

  const firstOtherName = room.participants[otherIds[0]]?.name || "Member";
  const othersCount = otherIds.length - 1;

  if (othersCount > 0) {
    return `${firstOtherName} + ${othersCount}`;
  }

  return firstOtherName;
};
