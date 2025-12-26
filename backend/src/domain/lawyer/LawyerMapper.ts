import { LawyerConversation } from './LawyerConversation';
import { LawyerMessage } from './LawyerMessage';
import { lawyer_conversationsModel, lawyer_messagesModel } from '../../generated/prisma/models';

export function toConversationDomain(dbConversation: lawyer_conversationsModel): LawyerConversation {
  return {
    id: dbConversation.id,
    user_id: dbConversation.user_id,
    title: dbConversation.title,
    lead_to_case: dbConversation.lead_to_case ?? false,
    is_active: dbConversation.is_active ?? true,
    case_id: dbConversation.case_id,
    created_at: dbConversation.created_at,
    updated_at: dbConversation.updated_at,
  };
}

export function toMessageDomain(dbMessage: lawyer_messagesModel): LawyerMessage {
  return {
    id: dbMessage.id,
    conversation_id: dbMessage.conversation_id,
    role: dbMessage.role as 'user' | 'assistant',
    content: dbMessage.content,
    token_count: dbMessage.token_count,
    created_at: dbMessage.created_at,
  };
}