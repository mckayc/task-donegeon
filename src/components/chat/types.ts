export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId?: string; // For DMs
  guildId?: string; // For guild chats
  message: string;
  timestamp: string;
  readBy: string[]; // Array of user IDs who have read it
  isAnnouncement?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
    author: 'user' | 'ai';
    text: string;
}
