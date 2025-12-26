import { FastifyInstance } from 'fastify';
import { LawyerService } from '../domain/lawyer/LawyerService';
import { authHook } from '../middleware/auth-hook';
import { ChatRequestDto, ChatResponseDto, ErrorResponseDto } from '../dto/lawyer.dto';

export async function lawyerRoutes(app: FastifyInstance) {
  /**
   * POST /lawyer/chat
   * Send a message to the Quokka lawyer and get AI response
   * Protected route - requires authentication
   */
  app.post('/lawyer/chat', {
    preHandler: authHook,
    schema: {
      description: 'Send a message to the Quokka lawyer AI',
      tags: ['lawyer'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['message'],
        properties: {
          message: {
            type: 'string',
            description: 'The user\'s message to the lawyer',
            minLength: 1,
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            userMessage: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                content: { type: 'string' },
                role: { type: 'string', enum: ['user'] },
                created_at: { type: 'string', format: 'date-time', nullable: true },
              },
            },
            aiMessage: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                content: { type: 'string' },
                role: { type: 'string', enum: ['assistant'] },
                created_at: { type: 'string', format: 'date-time', nullable: true },
              },
            },
            conversationId: { type: 'string' },
          },
        },
        400: {
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
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const userId = request.user!.id;

    const body = request.body as ChatRequestDto;

    // Validate message
    if (!body.message || body.message.trim().length === 0) {
      const errorResponse: ErrorResponseDto = {
        error: 'INVALID_MESSAGE',
        message: 'Message cannot be empty',
      };
      return reply.code(400).send(errorResponse);
    }

    try {
      // Process the chat message
      const result = await LawyerService.processChatMessage(userId, body.message.trim());

      // Format response
      const response: ChatResponseDto = {
        userMessage: {
          id: result.userMessage.id,
          content: result.userMessage.content,
          role: 'user',
          created_at: result.userMessage.created_at,
        },
        aiMessage: {
          id: result.aiMessage.id,
          content: result.aiMessage.content,
          role: 'assistant',
          created_at: result.aiMessage.created_at,
        },
        conversationId: result.userMessage.conversation_id,
      };

      return reply.code(200).send(response);
    } catch (err: any) {
      console.error('Error processing chat message:', err);

      // Handle OpenAI API errors
      if (err.message?.includes('API key')) {
        const errorResponse: ErrorResponseDto = {
          error: 'OPENAI_API_ERROR',
          message: 'OpenAI API configuration error',
        };
        return reply.code(500).send(errorResponse);
      }

      // Generic error
      const errorResponse: ErrorResponseDto = {
        error: 'CHAT_ERROR',
        message: err.message || 'Failed to process chat message',
      };
      return reply.code(500).send(errorResponse);
    }
  });
}