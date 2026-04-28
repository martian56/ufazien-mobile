// User Sites Screen - Browse Public Websites
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as LinkingModule from 'expo-linking';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { useThemedColors } from '@/contexts/ThemeContext';
import { RadiusMedium, ThemeColors } from '@/constants/theme';
import apiClient from '@/config/api';

interface PublicWebsite {
  id: number;
  name: string;
  domain: string;
  creator: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
  };
  description?: string;
  visit_count: number;
  storage_used: number; // in MB
  storage_limit: number; // in MB
  status: 'active' | 'building' | 'stopped' | 'error';
  created_at: string;
  is_public: boolean;
}

interface WebsitesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PublicWebsite[];
}

type SortOption = 'most_visited' | 'newest' | 'name';

export default function UserSitesScreen() {
  const c = useThemedColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [websites, setWebsites] = useState<PublicWebsite[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('most_visited');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const { toast, showError, hideToast } = useToast();

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    setCurrentPage(1);
    loadWebsites(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, sortBy]);

  const loadWebsites = async (pageNum: number, reset = false) => {
    if (reset && !refreshing) {
      setLoading(true);
    }

    try {
      const params: any = {
        page: pageNum,
        ordering: getOrderingParam(sortBy),
      };

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      const response = await apiClient.get<WebsitesResponse>('/hosting/public/websites/', {
        params,
      });

      const data = response.data;

      const newResults = data.results || [];
      if (reset) {
        setWebsites(newResults);
      } else {
        setWebsites((prev) => {
          const existingIds = new Set(prev.map((w) => w.id));
          const unique = newResults.filter((w) => !existingIds.has(w.id));
          return [...prev, ...unique];
        });
      }

      setHasMore(!!data.next);
      setTotalCount(data.count || 0);
    } catch (error: any) {
      console.error('Error loading websites:', error);
      showError(error.response?.data?.detail || 'Failed to load websites');
      if (reset) {
        setWebsites([]);
      }
    } finally {
      if (reset) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  const getOrderingParam = (sort: SortOption): string => {
    switch (sort) {
      case 'most_visited':
        return '-visit_count';
      case 'newest':
        return '-created_at';
      case 'name':
        return 'name';
      default:
        return '-visit_count';
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    loadWebsites(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore && !refreshing) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadWebsites(nextPage, false);
    }
  };

  const openWebsite = async (domain: string) => {
    try {
      const url = domain.startsWith('http') ? domain : `https://${domain}`;
      const canOpen = await LinkingModule.canOpenURL(url);

      if (canOpen) {
        await LinkingModule.openURL(url);
      } else {
        showError('Cannot open this website');
      }
    } catch (error) {
      console.error('Error opening website:', error);
      showError('Failed to open website');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge label="Active" variant="success" style={styles.statusBadge} />;
      case 'building':
        return <Badge label="Building" variant="warning" style={styles.statusBadge} />;
      case 'stopped':
        return <Badge label="Stopped" variant="default" style={styles.statusBadge} />;
      case 'error':
        return <Badge label="Error" variant="error" style={styles.statusBadge} />;
      default:
        return <Badge label={status} variant="default" style={styles.statusBadge} />;
    }
  };

  const formatStorage = (bytes: number | undefined | null): string => {
    if (!bytes || bytes === 0) return '0 MB';
    if (bytes < 1024) {
      return `${bytes.toFixed(0)} MB`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} GB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} TB`;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const renderWebsiteCard = ({ item }: { item: PublicWebsite }) => {
    const storageUsed = item.storage_used ?? 0;
    const storageLimit = (item.storage_limit ?? storageUsed) || 1;
    const storagePercentage = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0;

    return (
      <Card style={styles.websiteCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.websiteIcon}>
              <Ionicons name="globe" size={24} color={c.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.websiteName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.websiteDomain} numberOfLines={1}>
                {item.domain}
              </Text>
            </View>
          </View>
          {getStatusBadge(item.status)}
        </View>

        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.creatorRow}>
          <Ionicons name="person" size={16} color={c.textSecondary} />
          <Text style={styles.creatorText}>
            {item.creator.first_name && item.creator.last_name
              ? `${item.creator.first_name} ${item.creator.last_name}`
              : item.creator.username}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="eye" size={16} color={c.textSecondary} />
            <Text style={styles.statText}>{(item.visit_count ?? 0).toLocaleString()}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="calendar" size={16} color={c.textSecondary} />
            <Text style={styles.statText}>
              {item.created_at ? formatDate(item.created_at) : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.storageRow}>
          <View style={styles.storageInfo}>
            <Text style={styles.storageLabel}>Storage</Text>
            <Text style={styles.storageValue}>
              {formatStorage(item.storage_used)} /{' '}
              {formatStorage(item.storage_limit || item.storage_used || 0)}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${Math.min(storagePercentage, 100)}%` }]} />
          </View>
        </View>

        <TouchableOpacity style={styles.openButton} onPress={() => openWebsite(item.domain)}>
          <Ionicons name="open-outline" size={18} color={c.primary} />
          <Text style={styles.openButtonText}>Open Website</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Public Websites</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search and Sort */}
      <View style={styles.filtersContainer}>
        <Card style={styles.searchCard}>
          <Input
            placeholder="Search websites..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            leftIcon={<Ionicons name="search" size={20} color={c.textSecondary} />}
          />
        </Card>

        <Card style={styles.sortCard}>
          <Picker
            value={sortBy}
            options={[
              { label: 'Most Visited', value: 'most_visited' },
              { label: 'Newest', value: 'newest' },
              { label: 'Name (A-Z)', value: 'name' },
            ]}
            onValueChange={(value) => setSortBy(value as SortOption)}
            placeholder="Sort by..."
            style={styles.sortPicker}
          />
        </Card>
      </View>

      {/* Results Count */}
      {totalCount > 0 && (
        <View style={styles.resultsCount}>
          <Text style={styles.resultsCountText}>
            {totalCount} {totalCount === 1 ? 'website' : 'websites'} found
          </Text>
        </View>
      )}

      {/* Websites Grid */}
      {loading && websites.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={styles.loadingText}>Loading websites...</Text>
        </View>
      ) : websites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="globe-outline" size={64} color={c.textSecondary} />
          <Text style={styles.emptyTitle}>No websites found</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'Try adjusting your search or filters'
              : 'No public websites available at the moment'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={websites}
          renderItem={renderWebsiteCard}
          keyExtractor={(item, index) => item.id?.toString() || `website-${index}`}
          numColumns={1}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && websites.length > 0 ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color={c.primary} />
              </View>
            ) : null
          }
        />
      )}

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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: c.card,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    backButton: {
      padding: 8,
      marginLeft: -8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: c.text,
      flex: 1,
      textAlign: 'center',
    },
    headerRight: {
      width: 40,
    },
    filtersContainer: {
      padding: 16,
      paddingBottom: 8,
      gap: 12,
    },
    searchCard: {
      padding: 12,
    },
    searchInput: {
      marginBottom: 0,
    },
    sortCard: {
      padding: 12,
    },
    sortPicker: {
      marginBottom: 0,
    },
    resultsCount: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    resultsCountText: {
      fontSize: 14,
      color: c.textSecondary,
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 100,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: c.textSecondary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 100,
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: c.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
    },
    listContent: {
      padding: 16,
      paddingTop: 8,
    },
    websiteCard: {
      marginBottom: 16,
      padding: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    cardHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 8,
    },
    websiteIcon: {
      width: 48,
      height: 48,
      borderRadius: RadiusMedium,
      backgroundColor: c.primaryTint,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    cardHeaderText: {
      flex: 1,
    },
    websiteName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: c.text,
      marginBottom: 4,
    },
    websiteDomain: {
      fontSize: 14,
      color: c.textSecondary,
    },
    statusBadge: {
      alignSelf: 'flex-start',
    },
    description: {
      fontSize: 14,
      color: c.textSecondary,
      marginBottom: 12,
      lineHeight: 20,
    },
    creatorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 6,
    },
    creatorText: {
      fontSize: 14,
      color: c.textSecondary,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 12,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statText: {
      fontSize: 13,
      color: c.textSecondary,
    },
    storageRow: {
      marginBottom: 12,
    },
    storageInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    storageLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textSecondary,
    },
    storageValue: {
      fontSize: 12,
      color: c.text,
      fontWeight: '500',
    },
    progressBarContainer: {
      height: 6,
      backgroundColor: c.subtle,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: c.primary,
      borderRadius: 3,
    },
    openButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: RadiusMedium,
      borderWidth: 1,
      borderColor: c.primary,
      backgroundColor: c.primaryTint,
      gap: 8,
    },
    openButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.primary,
    },
    footerLoading: {
      paddingVertical: 20,
      alignItems: 'center',
    },
  });
