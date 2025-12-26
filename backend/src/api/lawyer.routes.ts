import { FastifyInstance } from 'fastify';
import { LawyerService } from '../domain/lawyer/LawyerService';
import { authHook } from '../middleware/auth-hook';
import {
  ChatRequestDto,
  ChatResponseDto,
  ErrorResponseDto,
  ConversationDto,
  ConversationWithMessagesDto,
  CreateConversationDto,
  UpdateConversationDto,
} from '../dto/lawyer.dto';

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
          conversationId: {
            type: 'string',
            description: 'Optional conversation ID to continue an existing conversation',
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
      const result = await LawyerService.processChatMessage(
        userId,
        body.message.trim(),
        body.conversationId
      );

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

  /**
   * GET /lawyer/conversations
   * Get all conversations for the authenticated user
   */
  app.get('/lawyer/conversations', {
    preHandler: authHook,
    schema: {
      description: 'Get all conversations for the current user',
      tags: ['lawyer'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string', nullable: true },
              is_active: { type: 'boolean' },
              created_at: { type: 'string', format: 'date-time', nullable: true },
              updated_at: { type: 'string', format: 'date-time', nullable: true },
              messageCount: { type: 'number' },
              lastMessage: { type: 'string', nullable: true },
            },
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

    try {
      const conversations = await LawyerService.getUserConversations(userId);
      
      // Get message counts and last messages
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conv) => {
          const messages = await LawyerService.getConversationHistory(conv.id);
          const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : null;
          
          const dto: ConversationDto = {
            id: conv.id,
            title: conv.title,
            is_active: conv.is_active,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            messageCount: messages.length,
            lastMessage: lastMessage ? (lastMessage.length > 100 ? lastMessage.substring(0, 100) + '...' : lastMessage) : null,
          };
          return dto;
        })
      );

      return reply.code(200).send(conversationsWithDetails);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      const errorResponse: ErrorResponseDto = {
        error: 'FETCH_ERROR',
        message: err.message || 'Failed to fetch conversations',
      };
      return reply.code(500).send(errorResponse);
    }
  });

  /**
   * POST /lawyer/conversations
   * Create a new conversation
   */
  app.post('/lawyer/conversations', {
    preHandler: authHook,
    schema: {
      description: 'Create a new conversation',
      tags: ['lawyer'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string', nullable: true },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time', nullable: true },
            updated_at: { type: 'string', format: 'date-time', nullable: true },
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
    const body = request.body as CreateConversationDto;

    try {
      const conversation = await LawyerService.createConversation(userId, body.title);
      const dto: ConversationDto = {
        id: conversation.id,
        title: conversation.title,
        is_active: conversation.is_active,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
      };
      return reply.code(201).send(dto);
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      const errorResponse: ErrorResponseDto = {
        error: 'CREATE_ERROR',
        message: err.message || 'Failed to create conversation',
      };
      return reply.code(500).send(errorResponse);
    }
  });

  /**
   * GET /lawyer/conversations/:id
   * Get a conversation with all its messages
   */
  app.get('/lawyer/conversations/:id', {
    preHandler: authHook,
    schema: {
      description: 'Get a conversation with all its messages',
      tags: ['lawyer'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string', nullable: true },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time', nullable: true },
            updated_at: { type: 'string', format: 'date-time', nullable: true },
            messages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  role: { type: 'string', enum: ['user', 'assistant'] },
                  content: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time', nullable: true },
                },
              },
            },
          },
        },
        404: {
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
    const { id } = request.params as { id: string };

    try {
      const { conversation, messages } = await LawyerService.getConversationWithMessages(id, userId);
      
      const dto: ConversationWithMessagesDto = {
        id: conversation.id,
        title: conversation.title,
        is_active: conversation.is_active,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        messages: messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at,
        })),
      };

      return reply.code(200).send(dto);
    } catch (err: any) {
      if (err.message === 'Conversation not found') {
        const errorResponse: ErrorResponseDto = {
          error: 'NOT_FOUND',
          message: 'Conversation not found',
        };
        return reply.code(404).send(errorResponse);
      }
      console.error('Error fetching conversation:', err);
      const errorResponse: ErrorResponseDto = {
        error: 'FETCH_ERROR',
        message: err.message || 'Failed to fetch conversation',
      };
      return reply.code(500).send(errorResponse);
    }
  });

  /**
   * PATCH /lawyer/conversations/:id
   * Update a conversation (title, active status)
   */
  app.patch('/lawyer/conversations/:id', {
    preHandler: authHook,
    schema: {
      description: 'Update a conversation',
      tags: ['lawyer'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          is_active: { type: 'boolean' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string', nullable: true },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time', nullable: true },
            updated_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        404: {
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
    const { id } = request.params as { id: string };
    const body = request.body as UpdateConversationDto;

    try {
      const conversation = await LawyerService.updateConversation(id, userId, body);
      const dto: ConversationDto = {
        id: conversation.id,
        title: conversation.title,
        is_active: conversation.is_active,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
      };
      return reply.code(200).send(dto);
    } catch (err: any) {
      if (err.message === 'Conversation not found') {
        const errorResponse: ErrorResponseDto = {
          error: 'NOT_FOUND',
          message: 'Conversation not found',
        };
        return reply.code(404).send(errorResponse);
      }
      console.error('Error updating conversation:', err);
      const errorResponse: ErrorResponseDto = {
        error: 'UPDATE_ERROR',
        message: err.message || 'Failed to update conversation',
      };
      return reply.code(500).send(errorResponse);
    }
  });
}