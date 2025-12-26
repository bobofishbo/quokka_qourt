export interface ChatRequestDto {
    message: string;
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
  
  export interface ErrorResponseDto {
    error: string;
    message: string;
  }