import { StyleSheet, Image, View, ScrollView, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const tintColor = useThemeColor({}, 'tint');

  // Get initials for avatar placeholder
  const getInitials = () => {
    if (profile?.displayName) {
      return profile.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };


  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          {profile?.avatarUrl ? (
            <Image
              source={{ uri: profile.avatarUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholderContainer}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: tintColor }]}>
                <ThemedText style={styles.avatarText}>
                  {getInitials()}
                </ThemedText>
              </View>
            </View>
          )}
          {profile?.displayName ? (
            <ThemedText type="title" style={styles.displayName}>
              {profile.displayName}
            </ThemedText>
          ) : profile?.username ? (
            <ThemedText type="title" style={styles.displayName}>
              {profile.username}
            </ThemedText>
          ) : null}
          {user?.email && (
            <ThemedText style={styles.email}>
              {user.email}
            </ThemedText>
          )}
        </View>

        {/* Profile Information Section */}
        {profile ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Profile Information
            </ThemedText>
            
            <View style={styles.infoCard}>
              <InfoRow label="Username" value={profile.username || 'Not set'} />
              {profile.displayName && (
                <InfoRow label="Display Name" value={profile.displayName} />
              )}
            </View>

            {/* Quokka Stats Section */}
            {(profile.quokkaCitizenshipLevel !== null || 
              (profile.quokkaStamps && profile.quokkaStamps.length > 0) ||
              (profile.quokkaBadges && profile.quokkaBadges.length > 0)) && (
              <View style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Quokka Stats
                </ThemedText>
                
                <View style={styles.infoCard}>
                  {profile.quokkaCitizenshipLevel !== null && (
                    <InfoRow 
                      label="Citizenship Level" 
                      value={profile.quokkaCitizenshipLevel.toString()} 
                    />
                  )}
                  {profile.quokkaStamps && profile.quokkaStamps.length > 0 && (
                    <View style={styles.infoRow}>
                      <ThemedText style={styles.infoLabel}>Stamps</ThemedText>
                      <View style={styles.badgeContainer}>
                        {profile.quokkaStamps.map((stamp, index) => (
                          <View key={index} style={[styles.badge, { backgroundColor: tintColor }, index > 0 && styles.badgeSpacing]}>
                            <ThemedText style={styles.badgeText}>{stamp}</ThemedText>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  {profile.quokkaBadges && profile.quokkaBadges.length > 0 && (
                    <View style={styles.infoRow}>
                      <ThemedText style={styles.infoLabel}>Badges</ThemedText>
                      <View style={styles.badgeContainer}>
                        {profile.quokkaBadges.map((badge, index) => (
                          <View key={index} style={[styles.badge, { backgroundColor: tintColor }, index > 0 && styles.badgeSpacing]}>
                            <ThemedText style={styles.badgeText}>{badge}</ThemedText>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <ThemedText style={styles.emptyState}>
              No profile data available
            </ThemedText>
          </View>
        )}

        {/* Sign Out Button */}
        <Pressable
          style={[styles.signOutButton, { backgroundColor: tintColor }]}
          onPress={handleSignOut}
        >
          <ThemedText style={styles.signOutButtonText}>
            Sign Out
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

// Helper component for info rows
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <ThemedText style={styles.infoLabel}>{label}</ThemedText>
      <ThemedText style={styles.infoValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 40,
    paddingTop: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  avatarPlaceholderContainer: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 42,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
    lineHeight: 50,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '400',
    flex: 2,
    textAlign: 'right',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 2,
    justifyContent: 'flex-end',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSpacing: {
    marginLeft: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    textAlign: 'center',
    opacity: 0.5,
    padding: 20,
  },
  signOutButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 52,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
