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
    userMessage: string
  ): Promise<{ userMessage: LawyerMessageType; aiMessage: LawyerMessageType }> {
    // Get or create active conversation
    const conversation = await this.getOrCreateActiveConversation(userId);

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

    // Update conversation updated_at (trigger handles this, but we can also update is_active)
    await prisma.lawyer_conversations.update({
      where: { id: conversation.id },
      data: { updated_at: new Date() },
    });

    return {
      userMessage: savedUserMessage,
      aiMessage: savedAiMessage,
    };
  }
}