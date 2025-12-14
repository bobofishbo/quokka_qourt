import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Pressable } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/auth-context';

export default function HomeScreen() {
  const tintColor = useThemeColor({}, 'tint');
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    // Navigation is handled automatically by auth context
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Welcome
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          You're signed in as {user?.email}
        </ThemedText>

        <Pressable
          style={[styles.button, { backgroundColor: tintColor }]}
          onPress={handleSignOut}
        >
          <ThemedText style={styles.buttonText}>
            Sign Out
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.7,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
    minWidth: 200,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
