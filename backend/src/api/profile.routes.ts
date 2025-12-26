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
    schema: {
      description: 'Get the current user\'s profile',
      tags: ['profile'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string', nullable: true },
            displayName: { type: 'string', nullable: true },
            avatarUrl: { type: 'string', nullable: true },
            aliasMode: { type: 'boolean', nullable: true },
            quokkaCitizenshipLevel: { type: 'number', nullable: true },
            quokkaStamps: { type: 'array', items: { type: 'string' } },
            quokkaBadges: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time', nullable: true },
            updatedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
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
    schema: {
      description: 'Create a profile for the authenticated user',
      tags: ['profile'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['username'],
        properties: {
          username: {
            type: 'string',
            description: 'Username (minimum 3 characters)',
            minLength: 3,
          },
          displayName: { type: 'string' },
          avatarUrl: { type: 'string' },
          aliasMode: { type: 'boolean' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string', nullable: true },
            displayName: { type: 'string', nullable: true },
            avatarUrl: { type: 'string', nullable: true },
            aliasMode: { type: 'boolean', nullable: true },
            quokkaCitizenshipLevel: { type: 'number', nullable: true },
            quokkaStamps: { type: 'array', items: { type: 'string' } },
            quokkaBadges: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time', nullable: true },
            updatedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        409: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
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
    schema: {
      description: 'Update the current user\'s profile',
      tags: ['profile'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          username: {
            type: 'string',
            description: 'Username (minimum 3 characters if provided)',
            minLength: 3,
          },
          displayName: { type: 'string' },
          avatarUrl: { type: 'string' },
          aliasMode: { type: 'boolean' },
          quokkaCitizenshipLevel: { type: 'number' },
          quokkaStamps: { type: 'array', items: { type: 'string' } },
          quokkaBadges: { type: 'array', items: { type: 'string' } },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string', nullable: true },
            displayName: { type: 'string', nullable: true },
            avatarUrl: { type: 'string', nullable: true },
            aliasMode: { type: 'boolean', nullable: true },
            quokkaCitizenshipLevel: { type: 'number', nullable: true },
            quokkaStamps: { type: 'array', items: { type: 'string' } },
            quokkaBadges: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time', nullable: true },
            updatedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        409: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
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
      if (err.message === "Username already taken") {
        const errorResponse: ErrorResponseDto = {
          error: "USERNAME_TAKEN",
          message: "This username is already in use",
        };
        return reply.code(409).send(errorResponse);
      }

      throw err; // let Fastify handle unexpected errors
    }
  });
}
