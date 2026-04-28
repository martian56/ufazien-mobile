import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useThemedColors } from '@/contexts/ThemeContext';
import { RadiusFull, ShadowLight, ThemeColors } from '@/constants/theme';

import apiClient from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

interface Post {
  id: number;
  title: string;
  excerpt?: string;
  content?: string;
  author: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
    avatar_url?: string;
    year?: string;
    major?: string;
  };
  category?: number;
  category_name?: string;
  tags?: string[];
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  read_time?: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface Category {
  id: number;
  name: string;
  color?: string;
}

export default function BlogScreen() {
  const c = useThemedColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'bookmarked' | 'my-posts'>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { toast, showError, hideToast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setPage(1);
    if (activeTab === 'bookmarked') setSelectedCategory(null);
    loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedCategory, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPosts(true);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/blog/categories/');
      setCategories(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadPosts = async (reset = false) => {
    if (loading) return;
    const currentPage = reset ? 1 : page;
    setLoading(true);

    try {
      let endpoint = '/blog/posts/';
      let params: any = { page: currentPage, page_size: 20 };

      if (activeTab === 'bookmarked') {
        endpoint = '/blog/bookmarks/me/';
        if (searchQuery) params.search = searchQuery;
        params.ordering = '-published_at';
      } else if (activeTab === 'my-posts') {
        if (user?.id) params.by = user.id;
        if (searchQuery) params.search = searchQuery;
        if (selectedCategory) params.category = selectedCategory;
        params.ordering =
          sortBy === 'latest'
            ? '-published_at'
            : sortBy === 'popular'
              ? '-likes_count'
              : '-published_at';
      } else {
        if (searchQuery) params.search = searchQuery;
        if (selectedCategory) params.category = selectedCategory;
        params.ordering =
          sortBy === 'latest'
            ? '-published_at'
            : sortBy === 'popular'
              ? '-likes_count'
              : '-published_at';
        if (sortBy === 'popular') endpoint = '/blog/posts/popular/';
      }

      const response = await apiClient.get(endpoint, { params });
      const newPosts = response.data.results || response.data || [];

      if (reset) {
        setPosts(newPosts);
        setPage(2);
      } else {
        setPosts([...posts, ...newPosts]);
        setPage(currentPage + 1);
      }
      setHasMore(newPosts.length >= 20);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedCategory, sortBy, searchQuery, user?.id]);

  const handleLoadMore = () => {
    if (!loading && hasMore) loadPosts(false);
  };

  const toggleLike = async (postId: number) => {
    try {
      await apiClient.post(`/blog/posts/${postId}/like/`);
      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_liked: !post.is_liked,
                likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1,
              }
            : post,
        ),
      );
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to toggle like');
    }
  };

  const toggleBookmark = async (postId: number) => {
    try {
      await apiClient.post(`/blog/posts/${postId}/bookmark/`);
      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_bookmarked: !post.is_bookmarked,
                bookmarks_count: post.is_bookmarked
                  ? post.bookmarks_count - 1
                  : post.bookmarks_count + 1,
              }
            : post,
        ),
      );
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to toggle bookmark');
    }
  };

  const renderPost = ({ item }: { item: Post }) => {
    const authorName =
      item.author.first_name && item.author.last_name
        ? `${item.author.first_name} ${item.author.last_name}`
        : item.author.username;

    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() => router.push(`/blog/${item.id}` as any)}
        activeOpacity={0.7}
      >
        {/* Title first for visual hierarchy */}
        <Text style={styles.postTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Excerpt */}
        {item.excerpt && (
          <Text style={styles.postExcerpt} numberOfLines={2}>
            {item.excerpt}
          </Text>
        )}

        {/* Tags */}
        {(item.category_name || (item.tags && item.tags.length > 0)) && (
          <View style={styles.tagsRow}>
            {item.category_name && <Badge label={item.category_name} variant="primary" size="sm" />}
            {item.tags?.slice(0, 2).map((tag, index) => (
              <Badge key={`${tag}-${index}`} label={tag} variant="default" size="sm" />
            ))}
          </View>
        )}

        {/* Footer: author + stats */}
        <View style={styles.postFooter}>
          <View style={styles.authorRow}>
            <Avatar
              uri={item.author.avatar_url || item.author.avatar}
              name={authorName}
              size="sm"
            />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName} numberOfLines={1}>
                {authorName}
              </Text>
              {item.read_time && <Text style={styles.readTime}>{item.read_time} min</Text>}
            </View>
          </View>
          <View style={styles.statsRow}>
            <TouchableOpacity
              onPress={() => toggleLike(item.id)}
              style={styles.statBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={item.is_liked ? 'heart' : 'heart-outline'}
                size={16}
                color={item.is_liked ? c.error : c.textTertiary}
              />
              <Text style={[styles.statNum, item.is_liked && { color: c.error }]}>
                {item.likes_count}
              </Text>
            </TouchableOpacity>
            <View style={styles.statBtn}>
              <Ionicons name="chatbubble-outline" size={15} color={c.textTertiary} />
              <Text style={styles.statNum}>{item.comments_count}</Text>
            </View>
            <TouchableOpacity
              onPress={() => toggleBookmark(item.id)}
              style={styles.statBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={item.is_bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={16}
                color={item.is_bookmarked ? c.primary : c.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const TABS = [
    { key: 'all' as const, label: 'All Posts' },
    { key: 'bookmarked' as const, label: 'Saved' },
    { key: 'my-posts' as const, label: 'My Posts' },
  ];

  const SORTS = ['latest', 'popular', 'trending'] as const;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.screenTitle}>Blog</Text>

        {/* Search */}
        <Input
          placeholder="Search posts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search" size={18} color={c.textTertiary} />}
          containerStyle={styles.searchWrap}
        />

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => {
                setActiveTab(tab.key);
                setPage(1);
                setSelectedCategory(null);
              }}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sort + Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {SORTS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSortBy(s)}
              style={[styles.chip, sortBy === s && styles.chipActive]}
            >
              <Text style={[styles.chipText, sortBy === s && styles.chipTextActive]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
          {categories.length > 0 && activeTab !== 'bookmarked' && (
            <>
              <View style={styles.chipSeparator} />
              <TouchableOpacity
                onPress={() => setSelectedCategory(null)}
                style={[styles.chip, selectedCategory === null && styles.chipActive]}
              >
                <Text style={[styles.chipText, selectedCategory === null && styles.chipTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((cat, i) => (
                <TouchableOpacity
                  key={cat.id || `cat-${i}`}
                  onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  style={[styles.chip, selectedCategory === cat.id && styles.chipActive]}
                >
                  <Text
                    style={[styles.chipText, selectedCategory === cat.id && styles.chipTextActive]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </View>

      {/* Posts */}
      {loading && posts.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item, index) => item.id?.toString() || `post-${index}`}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 16 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={c.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && posts.length > 0 ? (
              <ActivityIndicator size="small" color={c.primary} style={{ marginVertical: 16 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="document-text-outline" size={40} color={c.textTertiary} />
              <Text style={styles.emptyTitle}>No posts found</Text>
              <Text style={styles.emptyDesc}>
                {activeTab === 'bookmarked'
                  ? "You haven't saved any posts yet"
                  : activeTab === 'my-posts'
                    ? "You haven't written any posts yet"
                    : 'Be the first to share your thoughts'}
              </Text>
            </View>
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
      backgroundColor: c.card,
      paddingHorizontal: 20,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
    },
    screenTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: c.text,
      marginBottom: 14,
      letterSpacing: -0.3,
    },
    searchWrap: {
      marginBottom: 8,
    },

    // Tabs
    tabs: {
      flexDirection: 'row',
      gap: 4,
      marginBottom: 10,
    },
    tab: {
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: RadiusFull,
    },
    tabActive: {
      backgroundColor: c.primaryTint,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textSecondary,
    },
    tabTextActive: {
      color: c.primary,
    },

    // Filters
    filtersRow: {
      paddingBottom: 10,
      gap: 6,
      alignItems: 'center',
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: RadiusFull,
      backgroundColor: c.subtle,
    },
    chipActive: {
      backgroundColor: c.primary,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textSecondary,
    },
    chipTextActive: {
      color: '#FFFFFF',
    },
    chipSeparator: {
      width: 1,
      height: 16,
      backgroundColor: c.border,
      marginHorizontal: 4,
    },

    // Posts
    listContent: {
      padding: 20,
      paddingTop: 12,
    },
    postCard: {
      backgroundColor: c.cardElevated,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      ...ShadowLight,
    },
    postTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      lineHeight: 22,
      marginBottom: 6,
      letterSpacing: -0.2,
    },
    postExcerpt: {
      fontSize: 14,
      color: c.textSecondary,
      lineHeight: 20,
      marginBottom: 10,
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 12,
    },
    postFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.borderSubtle,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    authorInfo: {
      marginLeft: 8,
      flex: 1,
    },
    authorName: {
      fontSize: 13,
      fontWeight: '600',
      color: c.text,
    },
    readTime: {
      fontSize: 11,
      color: c.textTertiary,
      marginTop: 1,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    statBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    statNum: {
      fontSize: 12,
      color: c.textTertiary,
      fontWeight: '500',
    },

    // Empty / Loading
    loadingWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyWrap: {
      alignItems: 'center',
      paddingVertical: 48,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
      marginTop: 12,
      marginBottom: 4,
    },
    emptyDesc: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
    },
  });
