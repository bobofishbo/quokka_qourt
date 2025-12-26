import { prisma } from '../../db/prisma';
import { OpenAI } from 'openai';
import { toConversationDomain, toMessageDomain } from './LawyerMapper';
import { LawyerConversation } from './LawyerConversation';
import { LawyerMessage as LawyerMessageType } from './LawyerMessage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class LawyerService {
  /**
   * Get or create active conversation for a user
   */
  static async getOrCreateActiveConversation(userId: string): Promise<LawyerConversation> {
    // Try to find active conversation
    let conversation = await prisma.lawyer_conversations.findFirst({
      where: {
        user_id: userId,
        is_active: true,
      },
    });

    // If no active conversation, create one
    if (!conversation) {
      conversation = await prisma.lawyer_conversations.create({
        data: {
          user_id: userId,
          is_active: true,
          lead_to_case: false,
        },
      });
    }

    return toConversationDomain(conversation);
  }

  /**
   * Get conversation history (all messages in order)
   */
  static async getConversationHistory(conversationId: string): Promise<LawyerMessageType[]> {
    const messages = await prisma.lawyer_messages.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: 'asc' },
    });

    return messages.map(toMessageDomain);
  }

  /**
   * Save a message to the database
   */
  static async saveMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    tokenCount?: number
  ): Promise<LawyerMessageType> {
    const message = await prisma.lawyer_messages.create({
      data: {
        conversation_id: conversationId,
        role,
        content,
        token_count: tokenCount ?? null,
      },
    });

    return toMessageDomain(message);
  }

  /**
   * Send message to OpenAI and get response
   */
  static async sendMessageToOpenAI(
    conversationId: string,
    userMessage: string
  ): Promise<string> {
    // Get conversation history
    const history = await this.getConversationHistory(conversationId);

    // Format messages for OpenAI (convert to OpenAI format)
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = history.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content,
    }));

    // Add the new user message
    messages.push({
      role: 'user' as const,
      content: userMessage,
    });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // or 'gpt-3.5-turbo' for cheaper option
      messages: messages,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    return aiResponse;
  }

  /**
   * Process a chat message: save user message, get AI response, save AI response
   */
  static async processChatMessage(
    userId: string,
    userMessage: string,
    conversationId?: string
  ): Promise<{ userMessage: LawyerMessageType; aiMessage: LawyerMessageType }> {
    // Get or create conversation
    let conversation: LawyerConversation;
    if (conversationId) {
      const found = await prisma.lawyer_conversations.findFirst({
        where: {
          id: conversationId,
          user_id: userId,
        },
      });
      if (!found) {
        throw new Error('Conversation not found');
      }
      conversation = toConversationDomain(found);
    } else {
      conversation = await this.getOrCreateActiveConversation(userId);
    }

    // Save user message
    const savedUserMessage = await this.saveMessage(
      conversation.id,
      'user',
      userMessage
    );

    // Get AI response from OpenAI
    const aiResponse = await this.sendMessageToOpenAI(conversation.id, userMessage);

    // Save AI response
    const savedAiMessage = await this.saveMessage(
      conversation.id,
      'assistant',
      aiResponse
    );

    // Update conversation title if it's the first message
    const messageCount = await prisma.lawyer_messages.count({
      where: { conversation_id: conversation.id },
    });
    
    if (messageCount === 2 && !conversation.title) {
      // Generate a title from the first user message (first 50 chars)
      const title = userMessage.length > 50 
        ? userMessage.substring(0, 50) + '...' 
        : userMessage;
      await prisma.lawyer_conversations.update({
        where: { id: conversation.id },
        data: { title, updated_at: new Date() },
      });
    } else {
      await prisma.lawyer_conversations.update({
        where: { id: conversation.id },
        data: { updated_at: new Date() },
      });
    }

    return {
      userMessage: savedUserMessage,
      aiMessage: savedAiMessage,
    };
  }

  /**
   * Get all conversations for a user
   */
  static async getUserConversations(userId: string): Promise<LawyerConversation[]> {
    const conversations = await prisma.lawyer_conversations.findMany({
      where: { user_id: userId },
      orderBy: { updated_at: 'desc' },
    });

    return conversations.map(toConversationDomain);
  }

  /**
   * Get a conversation with all its messages
   */
  static async getConversationWithMessages(
    conversationId: string,
    userId: string
  ): Promise<{ conversation: LawyerConversation; messages: LawyerMessageType[] }> {
    const conversation = await prisma.lawyer_conversations.findFirst({
      where: {
        id: conversationId,
        user_id: userId,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const messages = await this.getConversationHistory(conversationId);

    return {
      conversation: toConversationDomain(conversation),
      messages,
    };
  }

  /**
   * Create a new conversation
   */
  static async createConversation(
    userId: string,
    title?: string
  ): Promise<LawyerConversation> {
    // Deactivate all other conversations
    await prisma.lawyer_conversations.updateMany({
      where: { user_id: userId, is_active: true },
      data: { is_active: false },
    });

    // Create new conversation
    const conversation = await prisma.lawyer_conversations.create({
      data: {
        user_id: userId,
        title: title || null,
        is_active: true,
        lead_to_case: false,
      },
    });

    return toConversationDomain(conversation);
  }

  /**
   * Update a conversation
   */
  static async updateConversation(
    conversationId: string,
    userId: string,
    updates: { title?: string; is_active?: boolean }
  ): Promise<LawyerConversation> {
    // Verify ownership
    const existing = await prisma.lawyer_conversations.findFirst({
      where: {
        id: conversationId,
        user_id: userId,
      },
    });

    if (!existing) {
      throw new Error('Conversation not found');
    }

    // If activating this conversation, deactivate others
    if (updates.is_active === true) {
      await prisma.lawyer_conversations.updateMany({
        where: { user_id: userId, is_active: true, id: { not: conversationId } },
        data: { is_active: false },
      });
    }

    const updated = await prisma.lawyer_conversations.update({
      where: { id: conversationId },
      data: {
        ...updates,
        updated_at: new Date(),
      },
    });

    return toConversationDomain(updated);
  }
}