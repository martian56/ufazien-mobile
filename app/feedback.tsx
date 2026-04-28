// Feedback Screen
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useThemedColors } from '@/contexts/ThemeContext';
import { PrimaryBlue, PrimaryIndigo, RadiusMedium, ThemeColors } from '@/constants/theme';
import apiClient from '@/config/api';

interface FeedbackType {
  value: string;
  label: string;
}

interface RateLimitStatus {
  can_submit: boolean;
  message: string;
  next_allowed_at?: string;
  seconds_remaining?: number;
  last_feedback_at?: string;
}

interface Feedback {
  id: number;
  feedback_type: string;
  subject: string;
  message: string;
  status: 'pending' | 'in_review' | 'resolved' | 'closed';
  admin_response?: string;
  created_at: string;
  updated_at: string;
}

interface FeedbackResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Feedback[];
}

const getFeedbackTypeIcon = (
  type: string,
  c: ThemeColors,
): { name: keyof typeof Ionicons.glyphMap; color: string } => {
  switch (type) {
    case 'bug':
      return { name: 'bug', color: c.error };
    case 'vulnerability':
      return { name: 'shield', color: c.warning };
    case 'feature':
      return { name: 'bulb', color: c.warning };
    case 'improvement':
      return { name: 'star', color: c.primary };
    case 'share_me_on_testimonials':
      return { name: 'chatbubble', color: c.indigo };
    default:
      return { name: 'chatbubble-ellipses', color: c.textSecondary };
  }
};

const getStatusColor = (status: string, c: ThemeColors) => {
  switch (status) {
    case 'pending':
      return {
        bg: c.warning + '20',
        text: c.warning,
        border: c.warning + '40',
      };
    case 'in_review':
      return { bg: c.primary + '20', text: c.primary, border: c.primary + '40' };
    case 'resolved':
      return {
        bg: c.success + '20',
        text: c.success,
        border: c.success + '40',
      };
    default:
      return { bg: c.textSecondary + '20', text: c.textSecondary, border: c.textSecondary + '40' };
  }
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

const formatCountdown = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function FeedbackScreen() {
  const c = useThemedColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [feedbackTypes, setFeedbackTypes] = useState<FeedbackType[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [rateLimit, setRateLimit] = useState<RateLimitStatus | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();

  useEffect(() => {
    loadFeedbackTypes();
    checkRateLimit();
    loadFeedbackHistory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (rateLimit && rateLimit.seconds_remaining && rateLimit.seconds_remaining > 0) {
      setCountdown(rateLimit.seconds_remaining);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            checkRateLimit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rateLimit?.seconds_remaining]);

  const loadFeedbackTypes = async () => {
    try {
      const response = await apiClient.get('/feedback/types/');
      const types = response.data?.feedback_types || response.data || [];
      setFeedbackTypes(Array.isArray(types) ? types : []);
    } catch (error: any) {
      console.error('Error loading feedback types:', error);
    }
  };

  const checkRateLimit = async () => {
    try {
      const response = await apiClient.get('/feedback/status/');
      setRateLimit(response.data);
    } catch (error: any) {
      console.error('Error checking rate limit:', error);
    }
  };

  const loadFeedbackHistory = async (page: number) => {
    setLoadingHistory(true);
    try {
      const response = await apiClient.get<FeedbackResponse>('/feedback/', {
        params: { page, page_size: 10 },
      });
      const data = response.data;
      const newFeedbacks = data.results || [];

      if (page === 1) {
        setFeedbacks(newFeedbacks);
      } else {
        setFeedbacks((prev) => [...prev, ...newFeedbacks]);
      }

      setTotalCount(data.count || 0);
      setHasMore(!!data.next);
    } catch (error: any) {
      console.error('Error loading feedback history:', error);
      showError(error.response?.data?.detail || 'Failed to load feedback history');
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await Promise.all([checkRateLimit(), loadFeedbackHistory(1)]);
  };

  const handleLoadMore = () => {
    if (!loadingHistory && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadFeedbackHistory(nextPage);
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedType) {
      newErrors.feedback_type = 'Please select a feedback type';
    }

    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    }

    if (!message.trim()) {
      newErrors.message = 'Message is required';
    } else if (message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    if (!rateLimit?.can_submit) {
      showError('Please wait before submitting another feedback');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/feedback/', {
        feedback_type: selectedType,
        subject: subject.trim(),
        message: message.trim(),
      });

      showSuccess('Feedback submitted successfully! Thank you for your input.');
      setSelectedType('');
      setSubject('');
      setMessage('');
      setErrors({});
      await Promise.all([checkRateLimit(), loadFeedbackHistory(1)]);
      setCurrentPage(1);
    } catch (error: any) {
      if (error.response?.status === 429) {
        showError('Rate limit exceeded. Please wait before submitting another feedback.');
        checkRateLimit();
      } else if (error.response?.status === 400) {
        const errorData = error.response.data;
        const newErrors: { [key: string]: string } = {};
        if (errorData.feedback_type) newErrors.feedback_type = errorData.feedback_type[0];
        if (errorData.subject) newErrors.subject = errorData.subject[0];
        if (errorData.message) newErrors.message = errorData.message[0];
        setErrors(newErrors);
      } else {
        showError(error.response?.data?.detail || 'Failed to submit feedback');
      }
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = rateLimit?.can_submit && !loading && validate();

  const renderFeedbackTypeButton = (type: FeedbackType) => {
    const icon = getFeedbackTypeIcon(type.value, c);
    const isSelected = selectedType === type.value;

    return (
      <TouchableOpacity
        key={type.value}
        onPress={() => {
          setSelectedType(type.value);
          setErrors({ ...errors, feedback_type: '' });
        }}
        style={[styles.typeButton, isSelected && styles.typeButtonActive]}
      >
        <View style={[styles.typeIcon, { backgroundColor: icon.color + '15' }]}>
          <Ionicons name={icon.name} size={24} color={icon.color} />
        </View>
        <Text style={[styles.typeButtonText, isSelected && styles.typeButtonTextActive]}>
          {type.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFeedbackCard = ({ item }: { item: Feedback }) => {
    const icon = getFeedbackTypeIcon(item.feedback_type, c);
    const statusColors = getStatusColor(item.status, c);

    return (
      <Card style={styles.feedbackCard}>
        <View style={styles.feedbackHeader}>
          <View style={[styles.feedbackIcon, { backgroundColor: icon.color + '15' }]}>
            <Ionicons name={icon.name} size={24} color={icon.color} />
          </View>
          <View style={styles.feedbackContent}>
            <Text style={styles.feedbackSubject}>{item.subject}</Text>
            <Text style={styles.feedbackMessage} numberOfLines={2}>
              {item.message}
            </Text>
            <View style={styles.feedbackMeta}>
              <Text style={styles.feedbackTime}>{getRelativeTime(item.created_at)}</Text>
              <Text style={styles.feedbackSeparator}> • </Text>
              <Text style={styles.feedbackType}>
                {feedbackTypes.find((t) => t.value === item.feedback_type)?.label ||
                  item.feedback_type}
              </Text>
            </View>
          </View>
          <Badge
            label={item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')}
            variant="default"
            style={[
              styles.statusBadge,
              { backgroundColor: statusColors.bg, borderColor: statusColors.border },
            ]}
          />
        </View>

        {item.admin_response && (
          <View style={styles.adminResponse}>
            <Text style={styles.adminResponseLabel}>Admin Response:</Text>
            <Text style={styles.adminResponseText}>{item.admin_response}</Text>
          </View>
        )}
      </Card>
    );
  };

  const pendingCount = feedbacks.filter((f) => f.status === 'pending').length;
  const resolvedCount = feedbacks.filter((f) => f.status === 'resolved').length;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={c.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Feedback</Text>
        </View>

        {/* Rate Limit Banner */}
        {rateLimit && !rateLimit.can_submit && countdown > 0 && (
          <Card style={styles.rateLimitBanner}>
            <View style={styles.rateLimitContent}>
              <Ionicons name="time" size={20} color={c.warning} />
              <Text style={styles.rateLimitText}>
                You can submit another feedback in {formatCountdown(countdown)}
              </Text>
            </View>
          </Card>
        )}

        {/* Statistics */}
        <LinearGradient
          colors={[PrimaryBlue, PrimaryIndigo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.statsCard}
        >
          <Text style={styles.statsTitle}>Your Feedback</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalCount}</Text>
              <Text style={styles.statLabel}>Total Submitted</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{resolvedCount}</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Feedback Form */}
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Submit Feedback</Text>

          {/* Type Selection */}
          <View style={styles.typesContainer}>
            <Text style={styles.fieldLabel}>Feedback Type *</Text>
            <View style={styles.typesGrid}>{feedbackTypes.map(renderFeedbackTypeButton)}</View>
            {errors.feedback_type && <Text style={styles.errorText}>{errors.feedback_type}</Text>}
          </View>

          {/* Subject */}
          <View style={styles.fieldContainer}>
            <Input
              label="Subject *"
              placeholder="Brief summary of your feedback"
              value={subject}
              onChangeText={(text) => {
                setSubject(text);
                setErrors({ ...errors, subject: '' });
              }}
              error={errors.subject}
              maxLength={200}
            />
            <Text style={styles.charCount}>{subject.length}/200</Text>
          </View>

          {/* Message */}
          <View style={styles.fieldContainer}>
            <Input
              label="Message *"
              placeholder="Describe your feedback in detail..."
              value={message}
              onChangeText={(text) => {
                setMessage(text);
                setErrors({ ...errors, message: '' });
              }}
              error={errors.message}
              multiline
              numberOfLines={6}
              style={styles.messageInput}
            />
            <Text style={styles.charCount}>{message.length} characters</Text>
          </View>

          {/* Submit Button */}
          <Button
            title="Submit Feedback"
            onPress={handleSubmit}
            loading={loading}
            disabled={!canSubmit}
            style={styles.submitButton}
          />
        </Card>

        {/* Guidelines */}
        <Card style={styles.guidelinesCard}>
          <Text style={styles.guidelinesTitle}>Guidelines</Text>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={20} color={c.success} />
            <Text style={styles.guidelineText}>Be specific and descriptive</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={20} color={c.success} />
            <Text style={styles.guidelineText}>Include steps to reproduce bugs</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={20} color={c.success} />
            <Text style={styles.guidelineText}>One feedback per submission</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={20} color={c.success} />
            <Text style={styles.guidelineText}>Rate limit: 1 feedback per 5 minutes</Text>
          </View>
        </Card>

        {/* Feedback History */}
        <Card style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Feedback History</Text>
            {totalCount > 0 && (
              <Text style={styles.historyCount}>
                Showing {feedbacks.length} of {totalCount}
              </Text>
            )}
          </View>

          {loadingHistory && feedbacks.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={c.primary} />
            </View>
          ) : feedbacks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-ellipses" size={64} color={c.textSecondary} />
              <Text style={styles.emptyTitle}>No feedback submitted yet</Text>
              <Text style={styles.emptySubtext}>Your feedback history will appear here</Text>
            </View>
          ) : (
            <FlatList
              data={feedbacks}
              renderItem={renderFeedbackCard}
              keyExtractor={(item, index) => item.id?.toString() || `feedback-${index}`}
              scrollEnabled={false}
              ListFooterComponent={
                loadingHistory && feedbacks.length > 0 ? (
                  <ActivityIndicator size="small" color={c.primary} style={styles.footerLoader} />
                ) : null
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
            />
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
    rateLimitBanner: {
      margin: 16,
      marginTop: 8,
      marginBottom: 8,
      padding: 16,
      backgroundColor: c.warning + '10',
      borderColor: c.warning + '30',
    },
    rateLimitContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    rateLimitText: {
      fontSize: 14,
      color: c.text,
      flex: 1,
      fontWeight: '600',
    },
    statsCard: {
      margin: 16,
      marginTop: 8,
      borderRadius: RadiusMedium,
      padding: 20,
    },
    statsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: 16,
    },
    statItem: {
      flex: 1,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    formCard: {
      margin: 16,
      marginTop: 8,
      padding: 20,
    },
    formTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: c.text,
      marginBottom: 20,
    },
    typesContainer: {
      marginBottom: 20,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
      marginBottom: 12,
    },
    typesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    typeButton: {
      flex: 1,
      minWidth: '45%',
      padding: 16,
      borderRadius: RadiusMedium,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.card,
    },
    typeButtonActive: {
      borderColor: c.primary,
      backgroundColor: c.primaryTint,
    },
    typeIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
      textAlign: 'center',
    },
    typeButtonTextActive: {
      color: c.primary,
    },
    fieldContainer: {
      marginBottom: 20,
    },
    charCount: {
      fontSize: 12,
      color: c.textSecondary,
      marginTop: 4,
      textAlign: 'right',
    },
    messageInput: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    errorText: {
      fontSize: 12,
      color: c.error,
      marginTop: 4,
    },
    submitButton: {
      marginTop: 8,
    },
    guidelinesCard: {
      margin: 16,
      marginTop: 8,
      padding: 20,
    },
    guidelinesTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: c.text,
      marginBottom: 16,
    },
    guidelineItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    guidelineText: {
      fontSize: 14,
      color: c.text,
      flex: 1,
    },
    historyCard: {
      margin: 16,
      marginTop: 8,
      padding: 20,
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    historyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: c.text,
    },
    historyCount: {
      fontSize: 12,
      color: c.textSecondary,
    },
    loadingContainer: {
      padding: 32,
      alignItems: 'center',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
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
    feedbackCard: {
      marginBottom: 16,
      padding: 16,
    },
    feedbackHeader: {
      flexDirection: 'row',
      gap: 12,
    },
    feedbackIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    feedbackContent: {
      flex: 1,
    },
    feedbackSubject: {
      fontSize: 16,
      fontWeight: 'bold',
      color: c.text,
      marginBottom: 4,
    },
    feedbackMessage: {
      fontSize: 14,
      color: c.textSecondary,
      marginBottom: 8,
      lineHeight: 20,
    },
    feedbackMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    feedbackTime: {
      fontSize: 12,
      color: c.textSecondary,
    },
    feedbackSeparator: {
      fontSize: 12,
      color: c.textSecondary,
    },
    feedbackType: {
      fontSize: 12,
      color: c.textSecondary,
    },
    statusBadge: {
      alignSelf: 'flex-start',
    },
    adminResponse: {
      marginTop: 16,
      padding: 12,
      backgroundColor: c.primaryTint,
      borderRadius: RadiusMedium,
      borderLeftWidth: 3,
      borderLeftColor: c.primary,
    },
    adminResponseLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: c.primary,
      marginBottom: 4,
    },
    adminResponseText: {
      fontSize: 14,
      color: c.text,
      lineHeight: 20,
    },
    footerLoader: {
      marginVertical: 16,
    },
  });
