export interface LawyerConversation {
    id: string;
    user_id: string;
    title: string | null;
    lead_to_case: boolean;
    is_active: boolean;
    case_id: string | null;
    created_at: Date | null;
    updated_at: Date | null;
  }