// api/profile.routes.ts

import { FastifyInstance } from "fastify";
import { ProfileService } from "../domain/profile/ProfileService";
import { authHook } from "../middleware/auth-hook";
import { CreateProfileRequestDto, UpdateProfileRequestDto, ErrorResponseDto } from "../dto/profile.dto";

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
      const errorResponse: ErrorResponseDto = {
        error: "PROFILE_NOT_FOUND",
        message: "Profile does not exist yet",
      };
      return reply.code(404).send(errorResponse);
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

    const body = request.body as CreateProfileRequestDto;

    // Validate required fields
    if (!body.username || body.username.length < 3) {
      const errorResponse: ErrorResponseDto = {
        error: "INVALID_USERNAME",
        message: "Username must be at least 3 characters",
      };
      return reply.code(400).send(errorResponse);
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
        const errorResponse: ErrorResponseDto = {
          error: "PROFILE_ALREADY_EXISTS",
          message: "Profile has already been created",
        };
        return reply.code(409).send(errorResponse);
      }

      throw err; // let Fastify handle unexpected errors
    }
  });

  /**
   * PATCH /profile/me
   * Update the current user's profile
   * Protected route - requires authentication
   */
  app.patch("/profile/me", {
    preHandler: authHook, // Apply auth hook before handler
  }, async (request, reply) => {
    const userId = request.user!.id; // Safe to use ! since authHook ensures user exists

    const body = request.body as UpdateProfileRequestDto;

    // Validate username if provided
    if (body.username !== undefined && body.username.length < 3) {
      const errorResponse: ErrorResponseDto = {
        error: "INVALID_USERNAME",
        message: "Username must be at least 3 characters",
      };
      return reply.code(400).send(errorResponse);
    }

    try {
      const profile = await ProfileService.updateProfile(userId, body);
      return profile;
    } catch (err: any) {
      if (err.message === "Profile not found") {
        const errorResponse: ErrorResponseDto = {
          error: "PROFILE_NOT_FOUND",
          message: "Profile does not exist yet",
        };
        return reply.code(404).send(errorResponse);
      }

      throw err; // let Fastify handle unexpected errors
    }
  });
}
