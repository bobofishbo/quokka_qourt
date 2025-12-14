import { casesModel as PrismaCase } from "../../generated/prisma/models/cases";
import { Case } from "./Case";

export function toCaseDomain(db: PrismaCase): Case {
  return {
    id: db.id,
    title: db.title,
    relationshipType: db.relationship_type,
    severityLevel: db.severity_level,
    status: db.status as any,
    juryEnabled: db.jury_enabled,
    createdAt: db.created_at,
  };
}
