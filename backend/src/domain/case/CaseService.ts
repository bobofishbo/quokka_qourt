import { prisma } from "../../db/prisma";
import { toCaseDomain } from "./CaseMapper";

export class CaseService {
  static async createCase(input: {
    title: string;
    createdBy: string;
    severityLevel: number;
    relationshipType?: string;
  }) {
    const dbCase = await prisma.cases.create({
      data: {
        title: input.title,
        created_by: input.createdBy,
        severity_level: input.severityLevel,
        relationship_type: input.relationshipType,
        status: "lawyer_phase",
      },
    });

    return toCaseDomain(dbCase);
  }

  static async getCase(caseId: string) {
    const dbCase = await prisma.cases.findUnique({
      where: { id: caseId },
    });

    if (!dbCase) throw new Error("Case not found");

    return toCaseDomain(dbCase);
  }
}
