export type CaseStatus =
  | "draft"
  | "lawyer_phase"
  | "intake_ready"
  | "waiting_defendant"
  | "court_in_session"
  | "judge_deliberating"
  | "resolved";

export interface Case {
  id: string;
  title: string;
  relationshipType: string | null;
  severityLevel: number;
  status: CaseStatus;
  juryEnabled: boolean;
  createdAt: Date;
}
