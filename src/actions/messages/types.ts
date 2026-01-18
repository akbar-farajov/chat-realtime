export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  type: string | null;
  fileUrl: string | null;
  createdAt: string | null;
  isEdited: boolean | null;
}

export interface SendMessageParams {
  conversationId?: string;
  targetUserId?: string;
  content: string;
  type?: "text" | "image" | "video" | "audio";
}

export interface SendMessageResult {
  conversationId: string;
  messageId: string;
}
