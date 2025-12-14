import { FastifyInstance } from "fastify";
import { CaseService } from "../domain/case/CaseService";

export async function caseRoutes(app: FastifyInstance) {
  app.post("/cases", async (req: any) => {
    return CaseService.createCase(req.body);
  });

  app.get("/cases/:id", async (req: any) => {
    return CaseService.getCase(req.params.id);
  });
}
