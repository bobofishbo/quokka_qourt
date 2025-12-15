// api/profile.routes.ts

import { FastifyInstance } from "fastify";
import { ProfileService } from "../domain/profile/ProfileService";
import { authHook } from "../middleware/auth-hook";

export async function profileRoutes(app: FastifyInstance) {
  /**
   * GET /profile/me
   * Fetch the current user's profile
   * Protected route - requires authentication
   */
  app.get("/profile/me", {
    preHandler: authHook, // Apply auth hook before handler
  }, async (request, reply) => {
    const userId = request.user!.id; // Safe to use ! since authHook ensures user exists

    const profile = await ProfileService.getProfileByUserId(userId);

    if (!profile) {
      return reply.code(404).send({
        error: "PROFILE_NOT_FOUND",
        message: "Profile does not exist yet",
      });
    }

    return profile;
  });

  /**
   * POST /profile/onboarding
   * Create a profile for the authenticated user
   * Protected route - requires authentication
   */
  app.post("/profile/onboarding", {
    preHandler: authHook, // Apply auth hook before handler
  }, async (request, reply) => {
    const userId = request.user!.id; // Safe to use ! since authHook ensures user exists

    const body = request.body as {
      username: string;
      displayName?: string;
      avatarUrl?: string;
      aliasMode?: boolean;
    };

    // Minimal validation here (DTO validation can come later)
    if (!body.username || body.username.length < 3) {
      return reply.code(400).send({
        error: "INVALID_USERNAME",
        message: "Username must be at least 3 characters",
      });
    }

    try {
      const profile = await ProfileService.createProfile({
        userId,
        username: body.username,
        displayName: body.displayName,
        avatarUrl: body.avatarUrl,
        aliasMode: body.aliasMode,
      });

      return reply.code(201).send(profile);
    } catch (err: any) {
      if (err.message === "Profile already exists") {
        return reply.code(409).send({
          error: "PROFILE_ALREADY_EXISTS",
          message: "Profile has already been created",
        });
      }

      throw err; // let Fastify handle unexpected errors
    }
  });
}
