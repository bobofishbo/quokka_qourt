export interface LawyerMessage {
    id: string;
    conversation_id: string;
    role: 'user' | 'assistant';
    content: string;
    token_count: number | null;
    created_at: Date | null;
  }