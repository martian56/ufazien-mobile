// Blog Detail Screen
import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import RenderHTML from 'react-native-render-html';
import * as Linking from 'expo-linking';
import { useThemedColors } from '@/contexts/ThemeContext';
import { ThemeColors } from '@/constants/theme';
import { formatYearWithOrdinal, getMajorDisplayName } from '@/utils/majorUtils';
import apiClient from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  featured_image_url?: string;
  author: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    followers_count?: number;
    following_count?: number;
    is_following?: boolean;
    year?: string;
    bio?: string;
    avatar?: string;
    avatar_url?: string;
    major?: string;
    completed_credits?: number;
    is_staff?: boolean;
    is_active?: boolean;
  };
  category?: number; // Category ID
  category_name?: string;
  tags?: string[]; // Array of tag name strings
  published_at: string;
  updated_at: string;
  read_time?: string; // e.g., "5 min read"
  likes_count: number;
  comments?: Comment[]; // Comments are nested in the post response
  views?: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  is_published?: boolean;
  is_featured?: boolean;
}

interface Comment {
  id: number;
  post: number;
  content: string;
  author: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    followers_count?: number;
    following_count?: number;
    is_following?: boolean;
    year?: string;
    bio?: string;
    avatar?: string;
    avatar_url?: string;
    major?: string;
    completed_credits?: number;
    is_staff?: boolean;
    is_active?: boolean;
  };
  published_at: string;
  parent?: number | null;
  replies?: Comment[]; // Nested replies
  likes_count: number;
  is_liked: boolean;
}

export default function BlogDetailScreen() {
  const c = useThemedColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: post?.title || 'Blog Post',
      headerShown: false, // Keep our custom header
    });
  }, [navigation, post?.title]);

  useEffect(() => {
    if (id) {
      loadPost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/blog/posts/${id}/`);
      const postData = response.data;
      setPost(postData);
      // Comments are included in the post response
      setComments(postData.comments || []);
      // Set initial follow status
      setIsFollowing(postData.author?.is_following || false);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to load post');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async () => {
    if (!post) return;

    try {
      await apiClient.post(`/blog/posts/${post.id}/like/`);
      setPost({
        ...post,
        is_liked: !post.is_liked,
        likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1,
      });
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to toggle like');
    }
  };

  const toggleBookmark = async () => {
    if (!post) return;

    try {
      await apiClient.post(`/blog/posts/${post.id}/bookmark/`);
      setPost({
        ...post,
        is_bookmarked: !post.is_bookmarked,
      });
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to toggle bookmark');
    }
  };

  const submitComment = async () => {
    if (!post || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await apiClient.post(`/blog/posts/${post.id}/comments/`, {
        content: newComment,
      });
      if (response.data) {
        const newCommentData: Comment = {
          ...response.data,
          replies: [], // New comments have no replies initially
        };
        setComments([newCommentData, ...(comments || [])]);
        setNewComment('');
        showSuccess('Comment added successfully');
        // Reload post to get updated comment count
        await loadPost();
      }
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const likeComment = async (commentId: number) => {
    try {
      await apiClient.post(`/blog/comments/${commentId}/like/`);
      const updateCommentLikes = (commentList: Comment[]): Comment[] => {
        return commentList.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              is_liked: !comment.is_liked,
              likes_count: comment.is_liked
                ? (comment.likes_count || 0) - 1
                : (comment.likes_count || 0) + 1,
            };
          }
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateCommentLikes(comment.replies),
            };
          }
          return comment;
        });
      };
      setComments(updateCommentLikes(comments || []));
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to toggle like');
    }
  };

  const sharePost = async () => {
    if (!post) return;

    try {
      const url = `https://ufazien.com/blog/${post.id}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Sharing not available', 'Cannot open sharing dialog');
      }
    } catch {
      showError('Failed to share post');
    }
  };

  const handleFollowToggle = async () => {
    if (!post?.author?.id || !user) return;

    // Don't allow following yourself
    if (post.author.id === user.id) return;

    setFollowingLoading(true);
    try {
      const response = await apiClient.post(`/auth/user/${post.author.id}/follow/`);
      const data = response.data;

      setIsFollowing(data.following);

      // Update the post object with new followers count
      setPost((prevPost) => {
        if (!prevPost) return null;
        return {
          ...prevPost,
          author: {
            ...prevPost.author,
            followers_count: data.followers_count,
            is_following: data.following,
          },
        };
      });
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to update follow status');
    } finally {
      setFollowingLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Post not found</Text>
        <Button title="Go Back" onPress={() => router.back()} style={styles.backButton} />
      </View>
    );
  }

  const htmlContent = {
    html: post.content,
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Card style={styles.headerCard}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={c.text} />
          </TouchableOpacity>

          {/* Author Info */}
          <View style={styles.authorSection}>
            <Avatar
              uri={post.author.avatar_url || post.author.avatar}
              name={
                `${post.author.first_name || ''} ${post.author.last_name || ''}`.trim() ||
                post.author.username
              }
              size="md"
            />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>
                {post.author.first_name && post.author.last_name
                  ? `${post.author.first_name} ${post.author.last_name}`
                  : post.author.username}
              </Text>
              <View style={styles.authorMeta}>
                {post.author.year && (
                  <Text style={styles.authorMetaText}>
                    {formatYearWithOrdinal(post.author.year)}
                  </Text>
                )}
                {post.author.major && (
                  <>
                    <Text style={styles.authorMetaSeparator}> • </Text>
                    <Text style={styles.authorMetaText}>
                      {getMajorDisplayName(post.author.major)}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{post.title}</Text>

          {/* Category and Tags */}
          {(post.category_name ||
            (post.tags && Array.isArray(post.tags) && post.tags.length > 0)) && (
            <View style={styles.metaSection}>
              {post.category_name && (
                <Badge label={post.category_name} variant="primary" style={styles.categoryBadge} />
              )}
              {post.tags &&
                Array.isArray(post.tags) &&
                post.tags.map((tag, index) => (
                  <Badge
                    key={`tag-${tag}-${index}`}
                    label={tag}
                    variant="default"
                    style={styles.tagBadge}
                  />
                ))}
            </View>
          )}

          {/* Post Meta */}
          <View style={styles.postMeta}>
            <Text style={styles.metaText}>
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : ''}
            </Text>
            {post.read_time && (
              <>
                <Text style={styles.metaSeparator}> • </Text>
                <Text style={styles.metaText}>{post.read_time}</Text>
              </>
            )}
          </View>
        </Card>

        {/* Content */}
        <Card style={styles.contentCard}>
          <RenderHTML
            contentWidth={width - 64}
            source={htmlContent}
            baseStyle={{
              color: c.text,
              fontSize: 16,
              lineHeight: 24,
            }}
          />
        </Card>

        {/* Author Bio */}
        {post.author && (
          <Card style={styles.authorBioCard}>
            <View style={styles.authorBioHeader}>
              <Avatar
                uri={post.author.avatar_url || post.author.avatar}
                name={
                  `${post.author.first_name || ''} ${post.author.last_name || ''}`.trim() ||
                  post.author.username
                }
                size="lg"
              />
              <View style={styles.authorBioInfo}>
                <Text style={styles.authorBioName}>
                  {post.author.first_name && post.author.last_name
                    ? `${post.author.first_name} ${post.author.last_name}`
                    : post.author.username}
                </Text>
                <View style={styles.authorBioMeta}>
                  {post.author.year && (
                    <Text style={styles.authorBioMetaText}>
                      {formatYearWithOrdinal(post.author.year)}
                    </Text>
                  )}
                  {post.author.major && (
                    <>
                      <Text style={styles.authorBioMetaSeparator}> • </Text>
                      <Text style={styles.authorBioMetaText}>
                        {getMajorDisplayName(post.author.major)}
                      </Text>
                    </>
                  )}
                </View>
                {post.author.bio && (
                  <Text style={styles.authorBioText} numberOfLines={3}>
                    {post.author.bio}
                  </Text>
                )}
                <View style={styles.authorBioStats}>
                  <Text style={styles.authorBioStatText}>
                    {post.author.followers_count || 0} followers
                  </Text>
                </View>
              </View>
            </View>
            {/* Follow Button - only show if not own post */}
            {post.author.id !== user?.id && (
              <Button
                title={isFollowing ? 'Following' : 'Follow'}
                onPress={handleFollowToggle}
                loading={followingLoading}
                disabled={followingLoading}
                variant={isFollowing ? 'outline' : 'primary'}
                size="md"
                style={styles.followButton}
              />
            )}
          </Card>
        )}

        {/* Actions */}
        <Card style={styles.actionsCard}>
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={toggleLike} style={styles.actionButton}>
              <Ionicons
                name={post.is_liked ? 'heart' : 'heart-outline'}
                size={24}
                color={post.is_liked ? c.error : c.textSecondary}
              />
              <Text style={[styles.actionText, post.is_liked && styles.actionTextActive]}>
                {post.likes_count}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={24} color={c.textSecondary} />
              <Text style={styles.actionText}>{comments.length}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleBookmark} style={styles.actionButton}>
              <Ionicons
                name={post.is_bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={post.is_bookmarked ? c.primary : c.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={sharePost} style={styles.actionButton}>
              <Ionicons name="share-outline" size={24} color={c.textSecondary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Comments Section */}
        <Card style={styles.commentsCard}>
          <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>

          {/* Add Comment */}
          <View style={styles.commentInputContainer}>
            <Input
              placeholder="Write a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              style={styles.commentInput}
            />
            <Button
              title="Post"
              onPress={submitComment}
              loading={submitting}
              disabled={!newComment.trim()}
              size="sm"
              style={styles.commentButton}
            />
          </View>

          {/* Comments List */}
          {!comments || comments.length === 0 ? (
            <Text style={styles.noComments}>No comments yet. Be the first to comment!</Text>
          ) : (
            comments
              .filter((comment) => !comment.parent) // Only show top-level comments
              .map((comment) => (
                <View key={comment.id}>
                  <Card style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                      <Avatar
                        uri={comment.author.avatar_url || comment.author.avatar}
                        name={
                          `${comment.author.first_name || ''} ${comment.author.last_name || ''}`.trim() ||
                          comment.author.username
                        }
                        size="sm"
                      />
                      <View style={styles.commentAuthorInfo}>
                        <Text style={styles.commentAuthorName}>
                          {comment.author.first_name && comment.author.last_name
                            ? `${comment.author.first_name} ${comment.author.last_name}`
                            : comment.author.username}
                        </Text>
                        <Text style={styles.commentDate}>
                          {new Date(comment.published_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                    <TouchableOpacity
                      onPress={() => likeComment(comment.id)}
                      style={styles.commentLikeButton}
                    >
                      <Ionicons
                        name={comment.is_liked ? 'heart' : 'heart-outline'}
                        size={16}
                        color={comment.is_liked ? c.error : c.textSecondary}
                      />
                      <Text
                        style={[
                          styles.commentLikeText,
                          comment.is_liked && styles.commentLikeTextActive,
                        ]}
                      >
                        {comment.likes_count}
                      </Text>
                    </TouchableOpacity>
                  </Card>

                  {/* Render replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <View style={styles.repliesContainer}>
                      {comment.replies.map((reply) => (
                        <Card key={reply.id} style={styles.replyCard}>
                          <View style={styles.commentHeader}>
                            <Avatar
                              uri={reply.author.avatar_url || reply.author.avatar}
                              name={
                                `${reply.author.first_name || ''} ${reply.author.last_name || ''}`.trim() ||
                                reply.author.username
                              }
                              size="sm"
                            />
                            <View style={styles.commentAuthorInfo}>
                              <Text style={styles.commentAuthorName}>
                                {reply.author.first_name && reply.author.last_name
                                  ? `${reply.author.first_name} ${reply.author.last_name}`
                                  : reply.author.username}
                              </Text>
                              <Text style={styles.commentDate}>
                                {new Date(reply.published_at).toLocaleDateString()}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.commentContent}>{reply.content}</Text>
                          <TouchableOpacity
                            onPress={() => likeComment(reply.id)}
                            style={styles.commentLikeButton}
                          >
                            <Ionicons
                              name={reply.is_liked ? 'heart' : 'heart-outline'}
                              size={16}
                              color={reply.is_liked ? c.error : c.textSecondary}
                            />
                            <Text
                              style={[
                                styles.commentLikeText,
                                reply.is_liked && styles.commentLikeTextActive,
                              ]}
                            >
                              {reply.likes_count}
                            </Text>
                          </TouchableOpacity>
                        </Card>
                      ))}
                    </View>
                  )}
                </View>
              ))
          )}
        </Card>
      </ScrollView>

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
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.background,
      padding: 32,
    },
    errorText: {
      fontSize: 18,
      color: c.textSecondary,
      marginBottom: 24,
    },
    headerCard: {
      margin: 16,
      marginBottom: 8,
      padding: 20,
    },
    backButton: {
      marginBottom: 16,
      padding: 4,
    },
    authorSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    authorInfo: {
      marginLeft: 12,
      flex: 1,
    },
    authorName: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
      marginBottom: 4,
    },
    authorMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    authorMetaText: {
      fontSize: 12,
      color: c.textSecondary,
    },
    authorMetaSeparator: {
      fontSize: 12,
      color: c.textSecondary,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: c.text,
      marginBottom: 16,
      lineHeight: 36,
    },
    metaSection: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 12,
      gap: 8,
    },
    categoryBadge: {
      marginRight: 4,
      marginBottom: 4,
    },
    tagBadge: {
      marginRight: 4,
      marginBottom: 4,
    },
    postMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      fontSize: 14,
      color: c.textSecondary,
    },
    metaSeparator: {
      fontSize: 14,
      color: c.textSecondary,
    },
    contentCard: {
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 20,
    },
    actionsCard: {
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 16,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 8,
    },
    actionText: {
      fontSize: 14,
      color: c.textSecondary,
      fontWeight: '600',
    },
    actionTextActive: {
      color: c.primary,
    },
    commentsCard: {
      margin: 16,
      marginBottom: 32,
      padding: 20,
    },
    commentsTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: c.text,
      marginBottom: 16,
    },
    commentInputContainer: {
      marginBottom: 24,
    },
    commentInput: {
      marginBottom: 12,
    },
    commentButton: {
      alignSelf: 'flex-end',
    },
    noComments: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      padding: 24,
    },
    commentCard: {
      marginBottom: 16,
      padding: 16,
    },
    commentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    commentAuthorInfo: {
      marginLeft: 12,
      flex: 1,
    },
    commentAuthorName: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
      marginBottom: 2,
    },
    commentDate: {
      fontSize: 12,
      color: c.textSecondary,
    },
    commentContent: {
      fontSize: 14,
      color: c.text,
      lineHeight: 20,
      marginBottom: 12,
    },
    commentLikeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
    },
    commentLikeText: {
      fontSize: 12,
      color: c.textSecondary,
    },
    commentLikeTextActive: {
      color: c.error,
    },
    repliesContainer: {
      marginLeft: 32,
      marginTop: 8,
    },
    replyCard: {
      marginBottom: 12,
      padding: 12,
      backgroundColor: c.subtle,
    },
    authorBioCard: {
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 20,
    },
    authorBioHeader: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    authorBioInfo: {
      marginLeft: 16,
      flex: 1,
    },
    authorBioName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: c.text,
      marginBottom: 4,
    },
    authorBioMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    authorBioMetaText: {
      fontSize: 14,
      color: c.textSecondary,
    },
    authorBioMetaSeparator: {
      fontSize: 14,
      color: c.textSecondary,
    },
    authorBioText: {
      fontSize: 14,
      color: c.text,
      lineHeight: 20,
      marginBottom: 12,
    },
    authorBioStats: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    authorBioStatText: {
      fontSize: 12,
      color: c.textSecondary,
      fontWeight: '600',
    },
    followButton: {
      marginTop: 8,
      width: '100%',
    },
  });
