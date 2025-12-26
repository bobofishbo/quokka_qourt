import { StyleSheet, ScrollView, View, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useState, useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedTextInput } from '@/components/themed-text-input';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/auth-context';
import Constants from 'expo-constants';

const quokkaImage = require('@/assets/images/quokka.png');
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'quokka';
  timestamp: Date;
}

export default function LawyerScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your Quokka lawyer. How can I help you today?',
      sender: 'quokka',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    // Scroll to bottom when new messages are added
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    if (!session?.access_token) {
      alert('Please sign in to chat with the lawyer');
      return;
    }

    const messageText = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // Add user message immediately (optimistic update)
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Add loading message
    const loadingMessageId = (Date.now() + 1).toString();
    const loadingMessage: Message = {
      id: loadingMessageId,
      text: '...',
      sender: 'quokka',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Call backend API
      const response = await fetch(`${API_BASE_URL}/lawyer/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: messageText,
        }),
      });

      // Remove loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get response');
      }

      const data = await response.json();

      // Add AI response
      const aiMessage: Message = {
        id: data.aiMessage.id || Date.now().toString(),
        text: data.aiMessage.content,
        sender: 'quokka',
        timestamp: data.aiMessage.created_at ? new Date(data.aiMessage.created_at) : new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      // Remove loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));

      // Show error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: `Sorry, I encountered an error: ${error.message || 'Please try again'}`,
        sender: 'quokka',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);

      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ThemedView style={styles.container}>
        {/* Header with Quokka */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Image
            source={quokkaImage}
            style={styles.quokkaHeaderImage}
            contentFit="contain"
            accessibilityLabel="Quokka lawyer"
          />
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Your Quokka Lawyer
          </ThemedText>
        </View>

        {/* Messages List */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.sender === 'user' ? styles.userMessage : styles.quokkaMessage,
              ]}
            >
              {message.sender === 'quokka' && (
                <Image
                  source={quokkaImage}
                  style={styles.quokkaAvatar}
                  contentFit="contain"
                />
              )}
              <View
                style={[
                  styles.messageContent,
                  message.sender === 'user' && { backgroundColor: tintColor },
                  message.sender === 'quokka' && styles.quokkaMessageContent,
                ]}
              >
                <ThemedText
                  style={[
                    styles.messageText,
                    message.sender === 'user' && styles.userMessageText,
                  ]}
                >
                  {message.text}
                </ThemedText>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <ThemedTextInput
            style={styles.input}
            placeholder="Type your message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <Pressable
            style={[styles.sendButton, { backgroundColor: tintColor }, (isLoading || !inputText.trim()) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={isLoading || !inputText.trim()}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.sendButtonText}>Send</ThemedText>
            )}
          </Pressable>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    gap: 12,
  },
  quokkaHeaderImage: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  quokkaMessage: {
    justifyContent: 'flex-start',
  },
  quokkaAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageContent: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  quokkaMessageContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    gap: 8,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
