export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  type: string | null;
  fileUrl: string | null;
  createdAt: string | null;
  isEdited: boolean | null;
  status: MessageStatus;
}

export type MessageStatus = string;

export interface SendMessageParams {
  conversationId?: string;
  targetUserId?: string;
  content: string;
  type?: "text" | "image" | "video" | "audio";
  fileUrl?: string;
}

export interface SendMessageResult {
  conversationId: string;
  messageId: string;
}

export interface MarkMessagesReadResult {
  updatedCount: number;
}
