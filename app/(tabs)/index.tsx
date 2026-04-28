import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useThemedColors } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ShadowMedium, ThemeColors } from '@/constants/theme';
import { formatYearWithOrdinal, getMajorDisplayName } from '@/utils/majorUtils';
import apiClient from '@/config/api';

interface Notification {
  id: number;
  message: string;
  created_at: string;
  read: boolean;
}

export default function DashboardScreen() {
  const c = useThemedColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [notificationsRes, countRes] = await Promise.all([
        apiClient.get('/notifications/', { params: { limit: 5 } }),
        apiClient.get('/notifications/count/'),
      ]);
      setNotifications(notificationsRes.data.results || []);
      setNotificationsCount(countRes.data.unread_count || 0);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), loadDashboardData()]);
  };

  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.username || '';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting + Avatar */}
      <View style={styles.header}>
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>{getGreeting()},</Text>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.first_name || user?.username || 'Student'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} activeOpacity={0.7}>
          <Avatar uri={user?.avatar} name={displayName} size="md" />
        </TouchableOpacity>
      </View>

      {/* Profile Summary Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileTop}>
          <View>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileDetail}>
              {[
                user?.year ? formatYearWithOrdinal(user.year) : null,
                user?.major ? getMajorDisplayName(user.major) : null,
              ]
                .filter(Boolean)
                .join(' · ') || 'Undeclared'}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {user?.gpa != null && typeof user.gpa === 'number' ? user.gpa.toFixed(2) : '0.00'}
            </Text>
            <Text style={styles.statLabel}>GPA</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{user?.credits_completed || 0}</Text>
            <Text style={styles.statLabel}>Credits</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{user?.followers_count || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionLabel}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <ActionTile
          icon="calculator-outline"
          label="GPA"
          onPress={() => router.push('/(tabs)/gpa-calculator')}
        />
        <ActionTile
          icon="stats-chart-outline"
          label="Average"
          onPress={() => router.push('/(tabs)/average-calculator')}
        />
        <ActionTile
          icon="newspaper-outline"
          label="Blog"
          onPress={() => router.push('/(tabs)/blog')}
        />
        <ActionTile icon="globe-outline" label="Sites" onPress={() => router.push('/user-sites')} />
      </View>

      {/* Notifications */}
      {notifications.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Notifications</Text>
            {notificationsCount > 0 && (
              <Badge label={String(notificationsCount)} variant="primary" size="sm" />
            )}
          </View>
          <Card style={styles.notificationsCard}>
            {notifications.slice(0, 3).map((n, i) => (
              <View
                key={n.id}
                style={[
                  styles.notifItem,
                  i < Math.min(notifications.length, 3) - 1 && styles.notifItemBorder,
                ]}
              >
                <View style={[styles.notifDot, n.read && styles.notifDotRead]} />
                <View style={styles.notifContent}>
                  <Text style={styles.notifText} numberOfLines={2}>
                    {n.message}
                  </Text>
                  <Text style={styles.notifTime}>{formatRelativeDate(n.created_at)}</Text>
                </View>
              </View>
            ))}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

function ActionTile({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  const c = useThemedColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <TouchableOpacity style={styles.actionTile} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon as any} size={22} color={c.primary} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatRelativeDate(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.background,
    },

    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    greeting: {
      flex: 1,
      marginRight: 16,
    },
    greetingText: {
      fontSize: 14,
      color: c.textSecondary,
      marginBottom: 2,
    },
    userName: {
      fontSize: 22,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.3,
    },

    // Profile Card
    profileCard: {
      marginHorizontal: 20,
      marginBottom: 24,
      backgroundColor: c.cardElevated,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      ...ShadowMedium,
    },
    profileTop: {
      marginBottom: 20,
    },
    profileName: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
      marginBottom: 3,
      letterSpacing: -0.2,
    },
    profileDetail: {
      fontSize: 14,
      color: c.textSecondary,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.subtle,
      borderRadius: 12,
      paddingVertical: 14,
    },
    stat: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 12,
      color: c.textSecondary,
      fontWeight: '500',
    },
    statDivider: {
      width: 1,
      height: 28,
      backgroundColor: c.border,
    },

    // Actions
    sectionLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: c.textSecondary,
      paddingHorizontal: 20,
      marginBottom: 12,
      letterSpacing: 0.1,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    actionsRow: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 12,
      marginBottom: 28,
    },
    actionTile: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: c.cardElevated,
      borderRadius: 14,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    actionIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: c.primaryTint,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    actionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: c.text,
    },

    // Notifications
    notificationsCard: {
      marginHorizontal: 20,
      padding: 0,
    },
    notifItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 14,
    },
    notifItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
    },
    notifDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.primary,
      marginTop: 5,
      marginRight: 12,
    },
    notifDotRead: {
      backgroundColor: c.border,
    },
    notifContent: {
      flex: 1,
    },
    notifText: {
      fontSize: 14,
      color: c.text,
      lineHeight: 19,
      marginBottom: 3,
    },
    notifTime: {
      fontSize: 12,
      color: c.textTertiary,
    },
  });
