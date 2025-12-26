import React, { useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, View, Pressable, Modal, Dimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.9;

interface Conversation {
  id: string;
  title: string | null;
  is_active: boolean;
  created_at: Date | null;
  updated_at: Date | null;
  lastMessage?: string | null;
  messageCount?: number;
}

interface LawyerSidebarProps {
  visible: boolean;
  onClose: () => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

export function LawyerSidebar({
  visible,
  onClose,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
}: LawyerSidebarProps) {
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text') || '#000';
  const sidebarAnimation = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(sidebarAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(sidebarAnimation, {
        toValue: -SIDEBAR_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, sidebarAnimation]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Dark overlay on the right */}
        <Pressable 
          style={styles.overlay}
          onPress={onClose}
        />
        
        {/* Sidebar from the left */}
        <Animated.View
          style={[
            styles.sidebar,
            {
              width: SIDEBAR_WIDTH,
              transform: [{ translateX: sidebarAnimation }],
            },
          ]}
        >
          <ThemedView style={[styles.sidebarContent, { paddingTop: insets.top }]}>
            <View style={styles.header}>
              <ThemedText type="title" style={styles.title}>Conversations</ThemedText>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <IconSymbol name="xmark" size={24} color={textColor} />
              </Pressable>
            </View>
            
            <Pressable
              style={[styles.newChatButton, { backgroundColor: tintColor }]}
              onPress={onNewChat}
            >
              <IconSymbol name="plus" size={20} color="#fff" />
              <ThemedText style={styles.newChatButtonText}>New Chat</ThemedText>
            </Pressable>

            <ScrollView style={styles.conversationList}>
              {conversations.length === 0 ? (
                <ThemedText style={styles.emptyText}>No conversations yet. Start a new chat!</ThemedText>
              ) : (
                conversations.map((conv) => (
                  <Pressable
                    key={conv.id}
                    style={[
                      styles.conversationItem,
                      currentConversationId === conv.id && { backgroundColor: tintColor + '20' },
                    ]}
                    onPress={() => onSelectConversation(conv.id)}
                  >
                    <View style={styles.conversationItemContent}>
                      <ThemedText
                        style={[
                          styles.conversationTitle,
                          currentConversationId === conv.id && { color: tintColor, fontWeight: '600' },
                        ]}
                        numberOfLines={1}
                      >
                        {conv.title || 'New Chat'}
                      </ThemedText>
                      {conv.lastMessage && (
                        <ThemedText style={styles.conversationPreview} numberOfLines={1}>
                          {conv.lastMessage}
                        </ThemedText>
                      )}
                      {conv.messageCount !== undefined && (
                        <ThemedText style={styles.conversationMeta}>
                          {conv.messageCount} messages
                        </ThemedText>
                      )}
                    </View>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </ThemedView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    position: 'absolute',
    left: SIDEBAR_WIDTH,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
  },
  sidebarContent: {
    flex: 1,
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  conversationList: {
    flex: 1,
  },
  conversationItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  conversationItemContent: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  conversationPreview: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 4,
  },
  conversationMeta: {
    fontSize: 12,
    opacity: 0.4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    opacity: 0.6,
  },
});

