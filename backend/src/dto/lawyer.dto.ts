export interface ChatRequestDto {
  message: string;
  conversationId?: string;
}

export interface ChatResponseDto {
  userMessage: {
    id: string;
    content: string;
    role: 'user';
    created_at: Date | null;
  };
  aiMessage: {
    id: string;
    content: string;
    role: 'assistant';
    created_at: Date | null;
  };
  conversationId: string;
}

export interface ConversationDto {
  id: string;
  title: string | null;
  is_active: boolean;
  created_at: Date | null;
  updated_at: Date | null;
  messageCount?: number;
  lastMessage?: string | null;
}

export interface ConversationWithMessagesDto extends ConversationDto {
  messages: MessageDto[];
}

export interface MessageDto {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: Date | null;
}

export interface CreateConversationDto {
  title?: string;
}

export interface UpdateConversationDto {
  title?: string;
  is_active?: boolean;
}

export interface ErrorResponseDto {
  error: string;
  message: string;
}