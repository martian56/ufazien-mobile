// Hosting Screen (Read-Only)
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useThemedColors } from '@/contexts/ThemeContext';
import { PrimaryBlue, PrimaryPurple, RadiusMedium, ThemeColors } from '@/constants/theme';
import apiClient from '@/config/api';

interface Subscription {
  plan: {
    name: string;
    display_name: string;
    price: number;
    max_websites: number;
    max_databases: number;
    storage_limit_mb: number;
    bandwidth_limit_mb: number;
  };
  storage_used_mb: number;
  bandwidth_used_mb: number;
  created_at: string;
  expires_at?: string;
}

interface Website {
  id: number;
  name: string;
  website_type: 'static' | 'php';
  status: 'active' | 'building' | 'inactive' | 'error';
  url: string;
  domain?: {
    domain_name: string;
    domain_type: 'custom' | 'subdomain';
    ssl_enabled: boolean;
  };
  last_deployment?: string;
  total_visits: number;
  storage_used_mb: number;
  created_at: string;
  updated_at: string;
}

interface Database {
  id: number;
  name: string;
  db_type: 'mysql' | 'postgresql';
  status: 'active' | 'building' | 'inactive' | 'error';
  host: string;
  port: number;
  size_mb: number;
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  total_websites: number;
  active_websites: number;
  total_visits: number;
  total_storage_used_mb: number;
}

interface Activity {
  id: number;
  action: string;
  target_name?: string;
  website_name?: string;
  database_name?: string;
  description: string;
  created_at: string;
  timestamp: string;
}

type TabType = 'overview' | 'websites' | 'databases' | 'analytics';

const formatStorage = (mb: number): string => {
  if (!mb || mb === 0) return '0 MB';
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
};

const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getStatusColor = (status: string, c: ThemeColors) => {
  switch (status) {
    case 'active':
      return {
        bg: c.success + '20',
        text: c.success,
        border: c.success + '40',
      };
    case 'building':
      return {
        bg: c.warning + '20',
        text: c.warning,
        border: c.warning + '40',
      };
    case 'inactive':
      return { bg: c.textSecondary + '20', text: c.textSecondary, border: c.textSecondary + '40' };
    default:
      return {
        bg: c.error + '20',
        text: c.error,
        border: c.error + '40',
      };
  }
};

const getActivityIcon = (
  action: string,
  c: ThemeColors,
): { name: keyof typeof Ionicons.glyphMap; color: string } => {
  if (action.includes('created') || action.includes('deployed')) {
    return { name: 'checkmark-circle', color: c.success };
  }
  if (action.includes('deleted')) {
    return { name: 'trash', color: c.error };
  }
  if (action.includes('database')) {
    return { name: 'server', color: c.primary };
  }
  if (action.includes('domain') || action.includes('ssl')) {
    return { name: 'shield-checkmark', color: c.success };
  }
  if (action.includes('backup')) {
    return { name: 'save', color: c.purple };
  }
  return { name: 'pulse', color: c.textSecondary };
};

export default function HostingScreen() {
  const c = useThemedColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [databases, setDatabases] = useState<Database[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, setSubLoading] = useState(false);
  const [websitesLoading, setWebsitesLoading] = useState(false);
  const [databasesLoading, setDatabasesLoading] = useState(false);
  const [, setStatsLoading] = useState(false);
  const { toast, showError, hideToast } = useToast();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'websites') {
      loadWebsites();
    } else if (activeTab === 'databases') {
      loadDatabases();
    } else if (activeTab === 'overview') {
      loadActivities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadSubscription(), loadStats()]);
    if (activeTab === 'websites') {
      await loadWebsites();
    } else if (activeTab === 'databases') {
      await loadDatabases();
    } else if (activeTab === 'overview') {
      await loadActivities();
    }
    setLoading(false);
  };

  const loadSubscription = async () => {
    setSubLoading(true);
    try {
      const response = await apiClient.get('/hosting/subscriptions/current/');
      setSubscription(response.data);
    } catch (error: any) {
      console.error('Error loading subscription:', error);
    } finally {
      setSubLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const response = await apiClient.get('/hosting/dashboard/stats/');
      setStats(response.data);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadWebsites = async () => {
    setWebsitesLoading(true);
    try {
      const response = await apiClient.get('/hosting/websites/');
      const data = response.data?.results || response.data || [];
      setWebsites(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading websites:', error);
      showError(error.response?.data?.detail || 'Failed to load websites');
    } finally {
      setWebsitesLoading(false);
    }
  };

  const loadDatabases = async () => {
    setDatabasesLoading(true);
    try {
      const response = await apiClient.get('/hosting/databases/');
      const data = response.data?.results || response.data || [];
      setDatabases(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading databases:', error);
      showError(error.response?.data?.detail || 'Failed to load databases');
    } finally {
      setDatabasesLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const response = await apiClient.get('/hosting/activity-logs/', {
        params: { page: 1, page_size: 20 },
      });
      const data = response.data?.results || response.data || [];
      setActivities(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading activities:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openWebsite = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        showError('Cannot open this website');
      }
    } catch {
      showError('Failed to open website');
    }
  };

  const renderSubscriptionBanner = () => {
    if (!subscription || !subscription.plan) return null;

    const storageUsed = formatStorage(subscription.storage_used_mb ?? 0);
    const storageLimit = formatStorage(subscription.plan.storage_limit_mb ?? 0);
    const maxWebsites = subscription.plan.max_websites ?? 0;
    const maxDatabases = subscription.plan.max_databases ?? 0;

    return (
      <LinearGradient
        colors={[PrimaryBlue, PrimaryPurple]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.subscriptionBanner}
      >
        <View style={styles.subscriptionContent}>
          <View style={styles.subscriptionHeader}>
            <Ionicons name="diamond" size={24} color="#FFFFFF" />
            <Text style={styles.planName}>{subscription.plan.display_name || 'Free'} Plan</Text>
          </View>
          <View style={styles.usageGrid}>
            <View style={styles.usageItem}>
              <Text style={styles.usageLabel}>Websites</Text>
              <Text style={styles.usageValue}>
                {websites.length} / {maxWebsites === -1 ? '∞' : maxWebsites}
              </Text>
            </View>
            <View style={styles.usageItem}>
              <Text style={styles.usageLabel}>Databases</Text>
              <Text style={styles.usageValue}>
                {databases.length} / {maxDatabases === -1 ? '∞' : maxDatabases}
              </Text>
            </View>
            <View style={styles.usageItem}>
              <Text style={styles.usageLabel}>Storage</Text>
              <Text style={styles.usageValue}>
                {storageUsed} / {storageLimit}
              </Text>
            </View>
            <View style={styles.usageItem}>
              <Text style={styles.usageLabel}>Price</Text>
              <Text style={styles.usageValue}>
                ${(Number(subscription.plan.price) || 0).toFixed(2)}/mo
              </Text>
            </View>
          </View>
          {(subscription.plan.name === 'free' || !subscription.plan.name) && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => {
                // Show message that upgrade is only available on desktop
                showError('Website management is only available on desktop');
              }}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    );
  };

  const renderStatsCards = () => {
    const totalWebsites = stats?.total_websites || websites.length;
    const activeWebsites =
      stats?.active_websites || websites.filter((w) => w.status === 'active').length;
    const totalVisits = stats?.total_visits || 0;
    const storageUsed = stats?.total_storage_used_mb || 0;

    return (
      <View style={styles.statsContainer}>
        <Card style={[styles.statCard, styles.statCardBlue]}>
          <Ionicons name="server" size={24} color={c.primary} />
          <Text style={styles.statValue}>{totalWebsites}</Text>
          <Text style={styles.statLabel}>Total Websites</Text>
        </Card>
        <Card style={[styles.statCard, styles.statCardGreen]}>
          <Ionicons name="pulse" size={24} color={c.success} />
          <Text style={styles.statValue}>{activeWebsites}</Text>
          <Text style={styles.statLabel}>Active Sites</Text>
        </Card>
        <Card style={[styles.statCard, styles.statCardPurple]}>
          <Ionicons name="eye" size={24} color={PrimaryPurple} />
          <Text style={styles.statValue}>{totalVisits.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Visits</Text>
        </Card>
        <Card style={[styles.statCard, styles.statCardYellow]}>
          <Ionicons name="hardware-chip" size={24} color={c.warning} />
          <Text style={styles.statValue}>{formatStorage(storageUsed)}</Text>
          <Text style={styles.statLabel}>Storage Used</Text>
        </Card>
      </View>
    );
  };

  const renderWebsiteCard = ({ item }: { item: Website }) => {
    const statusColors = getStatusColor(item.status, c);
    const domain = item.domain?.domain_name || item.url?.replace('https://', '') || 'N/A';

    return (
      <Card style={styles.websiteCard}>
        <View style={styles.websiteHeader}>
          <View style={styles.websiteIcon}>
            <Ionicons
              name={item.website_type === 'php' ? 'code' : 'globe'}
              size={24}
              color={c.primary}
            />
          </View>
          <View style={styles.websiteInfo}>
            <Text style={styles.websiteName}>{item.name}</Text>
            <Badge
              label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              variant="default"
              style={[
                styles.statusBadge,
                { backgroundColor: statusColors.bg, borderColor: statusColors.border },
              ]}
            />
          </View>
        </View>

        <Text style={styles.websiteDomain}>{domain}</Text>

        {item.domain && (
          <View style={styles.badgesRow}>
            <Badge label="Custom Domain" variant="primary" style={styles.customBadge} />
            {item.domain.ssl_enabled && (
              <Badge
                label="SSL"
                variant="default"
                style={[styles.sslBadge, { backgroundColor: c.success + '20' }]}
              />
            )}
          </View>
        )}

        <View style={styles.websiteMeta}>
          {item.last_deployment && (
            <View style={styles.metaItem}>
              <Ionicons name="time" size={16} color={c.textSecondary} />
              <Text style={styles.metaText}>
                Deployed: {new Date(item.last_deployment).toLocaleDateString()}
              </Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="eye" size={16} color={c.textSecondary} />
            <Text style={styles.metaText}>{item.total_visits.toLocaleString()} visits</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="hardware-chip" size={16} color={c.textSecondary} />
            <Text style={styles.metaText}>{formatStorage(item.storage_used_mb)}</Text>
          </View>
        </View>

        <View style={styles.websiteActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => openWebsite(item.url)}>
            <Ionicons name="open-outline" size={18} color={c.primary} />
            <Text style={styles.actionButtonText}>Visit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonDisabled]} disabled>
            <Ionicons name="create-outline" size={18} color={c.textSecondary} />
            <Text style={[styles.actionButtonText, styles.actionButtonTextDisabled]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonDisabled]} disabled>
            <Ionicons name="settings-outline" size={18} color={c.textSecondary} />
            <Text style={[styles.actionButtonText, styles.actionButtonTextDisabled]}>Settings</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderDatabaseCard = ({ item }: { item: Database }) => {
    const statusColors = getStatusColor(item.status, c);
    const dbTypeName = item.db_type === 'mysql' ? 'MySQL' : 'PostgreSQL';

    return (
      <Card style={styles.databaseCard}>
        <View style={styles.databaseHeader}>
          <Ionicons
            name="server"
            size={32}
            color={item.db_type === 'mysql' ? c.primary : c.indigo}
          />
          <View style={styles.databaseInfo}>
            <Text style={styles.databaseName}>{item.name}</Text>
            <Text style={styles.databaseType}>{dbTypeName}</Text>
          </View>
          <Badge
            label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            variant="default"
            style={[
              styles.statusBadge,
              { backgroundColor: statusColors.bg, borderColor: statusColors.border },
            ]}
          />
        </View>

        <View style={styles.databaseMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="hardware-chip" size={16} color={c.textSecondary} />
            <Text style={styles.metaText}>{formatStorage(item.size_mb)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="server" size={16} color={c.textSecondary} />
            <Text style={[styles.metaText, styles.monoText]}>
              {item.host}:{item.port}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={16} color={c.textSecondary} />
            <Text style={styles.metaText}>
              Created: {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.databaseActions}>
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonDisabled]} disabled>
            <Text style={[styles.actionButtonText, styles.actionButtonTextDisabled]}>Manage</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonDisabled]} disabled>
            <Text style={[styles.actionButtonText, styles.actionButtonTextDisabled]}>Backup</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderActivityItem = ({ item }: { item: Activity }) => {
    const icon = getActivityIcon(item.action, c);
    const target = item.target_name || item.website_name || item.database_name || '';

    return (
      <View style={styles.activityItem}>
        <View style={[styles.activityIcon, { backgroundColor: icon.color + '20' }]}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{item.description}</Text>
          {target && <Text style={styles.activitySubtitle}>{target}</Text>}
          <Text style={styles.activityTime}>{getRelativeTime(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Card style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Ionicons name="information-circle" size={20} color={c.warning} />
          <Text style={styles.infoText}>Website management is only available on desktop</Text>
        </View>
      </Card>

      {renderStatsCards()}

      <Card style={styles.activitiesCard}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="pulse" size={48} color={c.textSecondary} />
            <Text style={styles.emptyText}>No recent activity</Text>
          </View>
        ) : (
          <FlatList
            data={activities}
            renderItem={renderActivityItem}
            keyExtractor={(item, index) => item.id?.toString() || `activity-${index}`}
            scrollEnabled={false}
          />
        )}
      </Card>
    </ScrollView>
  );

  const renderWebsitesTab = () => (
    <View style={styles.tabContent}>
      {websitesLoading && websites.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : websites.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="globe" size={64} color={c.textSecondary} />
          <Text style={styles.emptyTitle}>No websites found</Text>
          <Text style={styles.emptySubtext}>
            Get started by creating your first website (desktop only)
          </Text>
        </Card>
      ) : (
        <FlatList
          data={websites}
          renderItem={renderWebsiteCard}
          keyExtractor={(item, index) => item.id?.toString() || `website-${index}`}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        />
      )}
    </View>
  );

  const renderDatabasesTab = () => (
    <View style={styles.tabContent}>
      {databasesLoading && databases.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : databases.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="server" size={64} color={c.textSecondary} />
          <Text style={styles.emptyTitle}>No databases found</Text>
          <Text style={styles.emptySubtext}>
            Get started by creating your first database (desktop only)
          </Text>
        </Card>
      ) : (
        <FlatList
          data={databases}
          renderItem={renderDatabaseCard}
          keyExtractor={(item, index) => item.id?.toString() || `database-${index}`}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        />
      )}
    </View>
  );

  const renderAnalyticsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Card style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Ionicons name="information-circle" size={20} color={c.primary} />
          <Text style={styles.infoText}>Analytics charts are only available on desktop</Text>
        </View>
      </Card>

      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard}>
          <Ionicons name="speedometer" size={24} color={c.success} />
          <Text style={styles.metricValue}>1.2s</Text>
          <Text style={styles.metricLabel}>Avg Load Time</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Ionicons name="checkmark-circle" size={24} color={c.success} />
          <Text style={styles.metricValue}>99.9%</Text>
          <Text style={styles.metricLabel}>Uptime</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Ionicons name="shield-checkmark" size={24} color={c.success} />
          <Text style={styles.metricValue}>A+</Text>
          <Text style={styles.metricLabel}>SSL Score</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Ionicons name="lock-closed" size={24} color={c.success} />
          <Text style={styles.metricValue}>95/100</Text>
          <Text style={styles.metricLabel}>Security</Text>
        </Card>
      </View>
    </ScrollView>
  );

  const tabs: { id: TabType; name: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'overview', name: 'Overview', icon: 'stats-chart' },
    { id: 'websites', name: 'Websites', icon: 'globe' },
    { id: 'databases', name: 'Databases', icon: 'server' },
    { id: 'analytics', name: 'Analytics', icon: 'pulse' },
  ];

  if (loading && !subscription && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hosting</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Subscription Banner */}
        {renderSubscriptionBanner()}

        {/* Tabs */}
        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={activeTab === tab.id ? c.primary : c.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Tab Content */}
      <View style={styles.tabContentContainer}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'websites' && renderWebsitesTab()}
        {activeTab === 'databases' && renderDatabasesTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </View>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    scrollView: {
      flexGrow: 0,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingBottom: 8,
    },
    backButton: {
      marginRight: 12,
      padding: 4,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: c.text,
    },
    subscriptionBanner: {
      margin: 16,
      marginTop: 8,
      borderRadius: RadiusMedium,
      padding: 20,
    },
    subscriptionContent: {
      gap: 16,
    },
    subscriptionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    planName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    usageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    usageItem: {
      flex: 1,
      minWidth: '45%',
    },
    usageLabel: {
      fontSize: 12,
      color: '#FFFFFF',
      opacity: 0.9,
      marginBottom: 4,
    },
    usageValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    upgradeButton: {
      backgroundColor: '#FFFFFF',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: RadiusMedium,
      alignItems: 'center',
      marginTop: 8,
    },
    upgradeButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.primary,
    },
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: 12,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      gap: 8,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: c.primary,
    },
    tabText: {
      fontSize: 12,
      color: c.textSecondary,
      fontWeight: '600',
    },
    tabTextActive: {
      color: c.primary,
    },
    tabContentContainer: {
      flex: 1,
    },
    tabContent: {
      flex: 1,
    },
    statsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 16,
      gap: 12,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      padding: 16,
      alignItems: 'center',
      gap: 8,
    },
    statCardBlue: {
      backgroundColor: c.primaryTint,
    },
    statCardGreen: {
      backgroundColor: c.successTint,
    },
    statCardPurple: {
      backgroundColor: PrimaryPurple + '15',
    },
    statCardYellow: {
      backgroundColor: c.warningTint,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: c.text,
    },
    statLabel: {
      fontSize: 12,
      color: c.textSecondary,
      textAlign: 'center',
    },
    infoCard: {
      margin: 16,
      marginBottom: 8,
      padding: 16,
      backgroundColor: c.warning + '10',
      borderColor: c.warning + '30',
    },
    infoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    infoText: {
      fontSize: 14,
      color: c.text,
      flex: 1,
    },
    activitiesCard: {
      margin: 16,
      marginTop: 8,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: c.text,
      marginBottom: 16,
    },
    activityItem: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: 12,
    },
    activityIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
      marginBottom: 4,
    },
    activitySubtitle: {
      fontSize: 12,
      color: c.textSecondary,
      marginBottom: 4,
    },
    activityTime: {
      fontSize: 11,
      color: c.textSecondary,
    },
    listContent: {
      padding: 16,
      paddingBottom: 32,
    },
    websiteCard: {
      marginBottom: 16,
      padding: 16,
    },
    websiteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 12,
    },
    websiteIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.primaryTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    websiteInfo: {
      flex: 1,
    },
    websiteName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: c.text,
      marginBottom: 4,
    },
    statusBadge: {
      alignSelf: 'flex-start',
    },
    websiteDomain: {
      fontSize: 14,
      color: c.textSecondary,
      marginBottom: 8,
    },
    badgesRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    customBadge: {
      backgroundColor: c.primaryTint,
    },
    sslBadge: {
      borderColor: c.success + '40',
    },
    websiteMeta: {
      gap: 8,
      marginBottom: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    metaText: {
      fontSize: 12,
      color: c.textSecondary,
    },
    monoText: {
      fontFamily: 'monospace',
    },
    websiteActions: {
      flexDirection: 'row',
      gap: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: RadiusMedium,
      borderWidth: 1,
      borderColor: c.primary,
      gap: 6,
    },
    actionButtonDisabled: {
      borderColor: c.border,
      opacity: 0.5,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.primary,
    },
    actionButtonTextDisabled: {
      color: c.textSecondary,
    },
    databaseCard: {
      marginBottom: 16,
      padding: 16,
    },
    databaseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
    },
    databaseInfo: {
      flex: 1,
    },
    databaseName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: c.text,
      marginBottom: 4,
    },
    databaseType: {
      fontSize: 14,
      color: c.textSecondary,
    },
    databaseMeta: {
      gap: 8,
      marginBottom: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    databaseActions: {
      flexDirection: 'row',
      gap: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 16,
      gap: 12,
    },
    metricCard: {
      flex: 1,
      minWidth: '45%',
      padding: 16,
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.success + '10',
    },
    metricValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: c.success,
    },
    metricLabel: {
      fontSize: 12,
      color: c.textSecondary,
      textAlign: 'center',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    emptyCard: {
      margin: 16,
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: c.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: c.textSecondary,
      marginTop: 16,
    },
  });
