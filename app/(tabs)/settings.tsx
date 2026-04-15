// Settings Screen - Full Implementation with 6 Tabs
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Picker } from '@/components/ui/Picker';
import { Switch } from '@/components/ui/Switch';
import { Avatar } from '@/components/ui/Avatar';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import {
  BackgroundPrimary,
  TextPrimary,
  TextSecondary,
  TextTertiary,
  PrimaryBlue,
  Colors,
  RadiusMedium,
  RadiusFull,
} from '@/constants/theme';
import apiClient from '@/config/api';
import { majorOptions } from '@/utils/majorUtils';

type TabType = 'profile' | 'academic' | 'notifications' | 'privacy' | 'appearance' | 'security';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  major: string;
  year: string;
  phone: string;
  bio: string;
  avatar?: string;
  avatar_url?: string;
  gpa?: number;
  completed_credits?: number;
  followers_count?: number;
}

interface AcademicSettings {
  gradeSystem: string;
  defaultCredits: number;
  semesterGoal: number;
  showGPA: boolean;
  trackAttendance: boolean;
  reminderTime: string;
  studyGoalHours: number;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  assignmentReminders: boolean;
  gradeUpdates: boolean;
  eventReminders: boolean;
  communityMessages: boolean;
  weeklyReports: boolean;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  loginAlerts: boolean;
  sessionTimeout: string;
}

interface PrivacySettings {
  profileVisibility: string;
  showGrades: boolean;
  showSchedule: boolean;
  allowMessages: boolean;
  showOnlineStatus: boolean;
  dataSharing: boolean;
}

interface AppearanceSettings {
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  autoSave: boolean;
  offlineMode: boolean;
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, refreshUser, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Profile state
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    major: '',
    year: '',
    phone: '',
    bio: '',
  });
  const [hasPassword, setHasPassword] = useState(true);

  // Academic state
  const [academicSettings, setAcademicSettings] = useState<AcademicSettings>({
    gradeSystem: 'ufaz',
    defaultCredits: 3,
    semesterGoal: 85,
    showGPA: true,
    trackAttendance: false,
    reminderTime: '30',
    studyGoalHours: 20,
  });

  // Notifications state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    assignmentReminders: true,
    gradeUpdates: true,
    eventReminders: true,
    communityMessages: true,
    weeklyReports: false,
  });

  // Security state
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: '30',
  });
  const [passwordData, setPasswordData] = useState({
    password: '',
    password_confirm: '',
  });

  // Privacy state (placeholder)
  const [privacySettings] = useState<PrivacySettings>({
    profileVisibility: 'friends',
    showGrades: false,
    showSchedule: true,
    allowMessages: true,
    showOnlineStatus: true,
    dataSharing: false,
  });

  // Appearance state (placeholder)
  const [appearanceSettings] = useState<AppearanceSettings>({
    theme: 'light',
    language: 'en',
    timezone: 'Asia/Baku',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    autoSave: true,
    offlineMode: false,
  });

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Load user profile
      if (user) {
        setProfileData({
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          email: user.email || '',
          username: user.username || '',
          major: user.major || '',
          year: user.year || '',
          phone: user.phone || '',
          bio: user.bio || '',
          avatar: user.avatar,
          avatar_url: (user as any).avatar_url || user.avatar,
          gpa: user.gpa,
          completed_credits: user.credits_completed,
          followers_count: user.followers_count,
        });
        // Check has_password from API response
        // Assuming the API returns has_password field
        // For now, default to true (users have passwords)
        setHasPassword((user as any).has_password !== false);
      }

      // Load academic settings from AsyncStorage
      try {
        const academicData = await AsyncStorage.getItem('ufaz_academic_settings');
        if (academicData) {
          setAcademicSettings({ ...academicSettings, ...JSON.parse(academicData) });
        }
      } catch (e) {
        console.error('Error loading academic settings:', e);
      }

      // Load notification settings
      try {
        const notifData = await AsyncStorage.getItem('ufaz_notification_settings');
        if (notifData) {
          setNotificationSettings({ ...notificationSettings, ...JSON.parse(notifData) });
        }
      } catch (e) {
        console.error('Error loading notification settings:', e);
      }

      // Load security settings
      try {
        const securityData = await AsyncStorage.getItem('ufaz_security_settings');
        if (securityData) {
          setSecuritySettings({ ...securitySettings, ...JSON.parse(securityData) });
        }
      } catch (e) {
        console.error('Error loading security settings:', e);
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      showError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    setProfileData({ ...profileData, [field]: value });
  };

  const handleAvatarUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError('Permission to access media library is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Validate file size (5MB)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          showError('Image size must be less than 5MB');
          return;
        }

        setUploadingAvatar(true);

        // Create FormData
        const formData = new FormData();
        const uriParts = asset.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('avatar', {
          uri: asset.uri,
          type: `image/${fileType}`,
          name: `avatar.${fileType}`,
        } as any);

        const response = await apiClient.patch('/auth/user/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const newAvatarUrl = response.data.avatar_url || response.data.avatar;
        setProfileData({
          ...profileData,
          avatar: response.data.avatar,
          avatar_url: newAvatarUrl,
        });
        await refreshUser();
        showSuccess('Avatar uploaded successfully!');
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      showError(error.response?.data?.detail || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAcademicChange = (field: keyof AcademicSettings, value: any) => {
    setAcademicSettings({ ...academicSettings, [field]: value });
  };

  const handleNotificationChange = (field: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings({ ...notificationSettings, [field]: value });
  };

  const handleSecurityChange = (field: keyof SecuritySettings, value: any) => {
    setSecuritySettings({ ...securitySettings, [field]: value });
  };

  const handlePasswordChange = (field: 'password' | 'password_confirm', value: string) => {
    setPasswordData({ ...passwordData, [field]: value });
  };

  const handleSetPassword = async () => {
    if (!passwordData.password || !passwordData.password_confirm) {
      showError('Please fill in both password fields');
      return;
    }

    if (passwordData.password.length < 8) {
      showError('Password must be at least 8 characters');
      return;
    }

    if (passwordData.password !== passwordData.password_confirm) {
      showError('Passwords do not match');
      return;
    }

    setSettingPassword(true);
    try {
      await apiClient.post('/auth/set-password/', {
        password: passwordData.password,
        password_confirm: passwordData.password_confirm,
      });
      setHasPassword(true);
      setPasswordData({ password: '', password_confirm: '' });
      showSuccess('Password set successfully!');
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to set password');
    } finally {
      setSettingPassword(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save profile to API
      const profileUpdate: any = {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        major: profileData.major,
        year: profileData.year,
        phone: profileData.phone || null,
        bio: profileData.bio || null,
      };

      await updateUser(profileUpdate);
      await refreshUser();

      // Save other settings to AsyncStorage
      await AsyncStorage.setItem('ufaz_academic_settings', JSON.stringify(academicSettings));
      await AsyncStorage.setItem(
        'ufaz_notification_settings',
        JSON.stringify(notificationSettings),
      );
      await AsyncStorage.setItem('ufaz_security_settings', JSON.stringify(securitySettings));
      await AsyncStorage.setItem('ufaz_privacy_settings', JSON.stringify(privacySettings));
      await AsyncStorage.setItem('ufaz_app_settings', JSON.stringify(appearanceSettings));

      showSuccess('Settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      showError(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Profile Picture</Text>
        <View style={styles.avatarSection}>
          <Avatar
            uri={profileData.avatar_url || profileData.avatar || undefined}
            name={`${profileData.firstName} ${profileData.lastName}`.trim() || profileData.username}
            size="lg"
          />
          <Button
            title={uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
            onPress={handleAvatarUpload}
            variant="outline"
            size="sm"
            loading={uploadingAvatar}
            style={styles.uploadButton}
          />
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <Input
          label="First Name *"
          value={profileData.firstName}
          onChangeText={(value) => handleProfileChange('firstName', value)}
        />
        <Input
          label="Last Name *"
          value={profileData.lastName}
          onChangeText={(value) => handleProfileChange('lastName', value)}
        />
        <Input
          label="Email *"
          value={profileData.email}
          onChangeText={(value) => handleProfileChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Username"
          value={profileData.username}
          editable={false}
          style={styles.disabledInput}
        />
        <Input
          label="Phone"
          value={profileData.phone}
          onChangeText={(value) => handleProfileChange('phone', value)}
          keyboardType="phone-pad"
        />
        <Input
          label="Bio"
          value={profileData.bio}
          onChangeText={(value) => handleProfileChange('bio', value)}
          multiline
          numberOfLines={4}
          placeholder="Tell us about yourself..."
        />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Academic Information</Text>
        <Picker
          label="Major"
          value={profileData.major}
          options={majorOptions.map((m) => ({ label: m.display, value: m.code }))}
          onValueChange={(value) => handleProfileChange('major', value)}
          placeholder="Select major"
        />
        <Picker
          label="Academic Year"
          value={profileData.year}
          options={[
            { label: '1st Year', value: '1' },
            { label: '2nd Year', value: '2' },
            { label: '3rd Year', value: '3' },
            { label: '4th Year', value: '4' },
            { label: 'Graduate', value: '5' },
          ]}
          onValueChange={(value) => handleProfileChange('year', value)}
          placeholder="Select year"
        />
      </Card>

      <View style={styles.statsGrid}>
        <Card style={[styles.statCard, styles.statCardBlue]}>
          <Text style={styles.statValue}>
            {profileData.gpa != null &&
            typeof profileData.gpa === 'number' &&
            !isNaN(profileData.gpa)
              ? profileData.gpa.toFixed(2)
              : '0.00'}
          </Text>
          <Text style={styles.statLabel}>Current GPA</Text>
        </Card>
        <Card style={[styles.statCard, styles.statCardGreen]}>
          <Text style={styles.statValue}>{profileData.completed_credits || 0}</Text>
          <Text style={styles.statLabel}>Credits Completed</Text>
        </Card>
        <Card style={[styles.statCard, styles.statCardPurple]}>
          <Text style={styles.statValue}>{profileData.followers_count || 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </Card>
      </View>
    </ScrollView>
  );

  const renderAcademicTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Grade System</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[
              styles.radioOption,
              academicSettings.gradeSystem === 'ufaz' && styles.radioOptionActive,
            ]}
            onPress={() => handleAcademicChange('gradeSystem', 'ufaz')}
          >
            <View style={styles.radioButton}>
              {academicSettings.gradeSystem === 'ufaz' && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={styles.radioLabel}>UFAZ 20-point system</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.radioOption,
              academicSettings.gradeSystem === 'standard' && styles.radioOptionActive,
            ]}
            onPress={() => handleAcademicChange('gradeSystem', 'standard')}
          >
            <View style={styles.radioButton}>
              {academicSettings.gradeSystem === 'standard' && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
            <Text style={styles.radioLabel}>Standard 100-point system</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Goals & Preferences</Text>
        <Input
          label="Default Course Credits"
          value={academicSettings.defaultCredits.toString()}
          onChangeText={(value) => {
            const num = parseInt(value) || 0;
            if (num >= 1 && num <= 6) {
              handleAcademicChange('defaultCredits', num);
            }
          }}
          keyboardType="numeric"
        />
        <Input
          label="Semester GPA Goal (0-100)"
          value={academicSettings.semesterGoal.toString()}
          onChangeText={(value) => {
            const num = parseInt(value) || 0;
            if (num >= 0 && num <= 100) {
              handleAcademicChange('semesterGoal', num);
            }
          }}
          keyboardType="numeric"
        />
        <Input
          label="Weekly Study Goal (hours)"
          value={academicSettings.studyGoalHours.toString()}
          onChangeText={(value) => {
            const num = parseInt(value) || 0;
            if (num >= 1 && num <= 100) {
              handleAcademicChange('studyGoalHours', num);
            }
          }}
          keyboardType="numeric"
        />
        <Picker
          label="Class Reminder Time"
          value={academicSettings.reminderTime}
          options={[
            { label: '15 minutes', value: '15' },
            { label: '30 minutes', value: '30' },
            { label: '1 hour', value: '60' },
            { label: '2 hours', value: '120' },
          ]}
          onValueChange={(value) => handleAcademicChange('reminderTime', value)}
        />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Display Options</Text>
        <Switch
          value={academicSettings.showGPA}
          onValueChange={(value) => handleAcademicChange('showGPA', value)}
          label="Show GPA on Dashboard"
          description="Display your current GPA prominently"
        />
        <Switch
          value={academicSettings.trackAttendance}
          onValueChange={(value) => handleAcademicChange('trackAttendance', value)}
          label="Track Attendance"
          description="Monitor class attendance automatically"
        />
      </Card>
    </ScrollView>
  );

  const renderNotificationsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionSubtitle}>General Notifications</Text>
        <Switch
          value={notificationSettings.emailNotifications}
          onValueChange={(value) => handleNotificationChange('emailNotifications', value)}
          label="Email Notifications"
          description="Receive notifications via email"
        />
        <Switch
          value={notificationSettings.pushNotifications}
          onValueChange={(value) => handleNotificationChange('pushNotifications', value)}
          label="Push Notifications"
          description="Browser and mobile push notifications"
        />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionSubtitle}>Academic Notifications</Text>
        <Switch
          value={notificationSettings.assignmentReminders}
          onValueChange={(value) => handleNotificationChange('assignmentReminders', value)}
          label="Assignment Reminders"
          description="Get reminded about upcoming assignments"
        />
        <Switch
          value={notificationSettings.gradeUpdates}
          onValueChange={(value) => handleNotificationChange('gradeUpdates', value)}
          label="Grade Updates"
          description="Notifications when grades are posted"
        />
        <Switch
          value={notificationSettings.eventReminders}
          onValueChange={(value) => handleNotificationChange('eventReminders', value)}
          label="Event Reminders"
          description="Calendar events and class schedules"
        />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionSubtitle}>Community Notifications</Text>
        <Switch
          value={notificationSettings.communityMessages}
          onValueChange={(value) => handleNotificationChange('communityMessages', value)}
          label="Community Messages"
          description="New messages in study groups and forums"
        />
        <Switch
          value={notificationSettings.weeklyReports}
          onValueChange={(value) => handleNotificationChange('weeklyReports', value)}
          label="Weekly Reports"
          description="Weekly summary of your activity"
        />
      </Card>
    </ScrollView>
  );

  const renderPrivacyTab = () => (
    <View style={styles.placeholderContainer}>
      <Ionicons name="lock-closed-outline" size={40} color={TextTertiary} />
      <Text style={styles.placeholderTitle}>Privacy Settings</Text>
      <Text style={styles.placeholderText}>This section is under development</Text>
    </View>
  );

  const renderAppearanceTab = () => (
    <View style={styles.placeholderContainer}>
      <Ionicons name="color-palette-outline" size={40} color={TextTertiary} />
      <Text style={styles.placeholderTitle}>Appearance Settings</Text>
      <Text style={styles.placeholderText}>This section is under development</Text>
    </View>
  );

  const renderSecurityTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {!hasPassword ? (
        <Card style={[styles.sectionCard, styles.warningCard]}>
          <View style={styles.warningHeader}>
            <Ionicons name="lock-closed" size={24} color={Colors.light.warning} />
            <Text style={styles.warningTitle}>Set Up Password for CLI Access</Text>
          </View>
          <Text style={styles.warningText}>
            You signed up with Google OAuth. To use CLI tools, you need to set up a password.
          </Text>
          <Input
            label="New Password *"
            value={passwordData.password}
            onChangeText={(value) => handlePasswordChange('password', value)}
            secureTextEntry
            placeholder="Enter your password (min 8 characters)"
          />
          <Input
            label="Confirm Password *"
            value={passwordData.password_confirm}
            onChangeText={(value) => handlePasswordChange('password_confirm', value)}
            secureTextEntry
            placeholder="Confirm your password"
          />
          <Button
            title={settingPassword ? 'Setting Password...' : 'Set Password'}
            onPress={handleSetPassword}
            loading={settingPassword}
            disabled={settingPassword || !passwordData.password || !passwordData.password_confirm}
            style={styles.fullWidthButton}
          />
        </Card>
      ) : (
        <Card style={[styles.sectionCard, styles.successCard]}>
          <View style={styles.successHeader}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.light.success} />
            <Text style={styles.successTitle}>Password Set</Text>
          </View>
          <Text style={styles.successText}>
            You have a password set and can use email/password authentication for CLI tools.
          </Text>
        </Card>
      )}

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Security Preferences</Text>
        <Switch
          value={securitySettings.loginAlerts}
          onValueChange={(value) => handleSecurityChange('loginAlerts', value)}
          label="Login Alerts"
          description="Get notified when someone logs into your account"
        />
        <Switch
          value={securitySettings.twoFactorAuth}
          onValueChange={(value) => handleSecurityChange('twoFactorAuth', value)}
          label="Two-Factor Authentication"
          description="Add an extra layer of security to your account"
          disabled
        />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Session Management</Text>
        <Picker
          label="Session Timeout (minutes)"
          value={securitySettings.sessionTimeout}
          options={[
            { label: '15 minutes', value: '15' },
            { label: '30 minutes', value: '30' },
            { label: '1 hour', value: '60' },
            { label: '2 hours', value: '120' },
            { label: '4 hours', value: '240' },
          ]}
          onValueChange={(value) => handleSecurityChange('sessionTimeout', value)}
        />
      </Card>
    </ScrollView>
  );

  const tabs: { id: TabType; name: string; icon: string }[] = [
    { id: 'profile', name: 'Profile', icon: 'person' },
    { id: 'academic', name: 'Academic', icon: 'school' },
    { id: 'notifications', name: 'Notifications', icon: 'notifications' },
    { id: 'privacy', name: 'Privacy', icon: 'lock-closed' },
    { id: 'appearance', name: 'Appearance', icon: 'color-palette' },
    { id: 'security', name: 'Security', icon: 'shield-checkmark' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PrimaryBlue} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScrollView}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.id ? PrimaryBlue : TextSecondary}
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>

      {/* Tab Content */}
      <View style={styles.tabContentContainer}>
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'academic' && renderAcademicTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'privacy' && renderPrivacyTab()}
        {activeTab === 'appearance' && renderAppearanceTab()}
        {activeTab === 'security' && renderSecurityTab()}
      </View>

      {/* Save Button & Logout */}
      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <Button
          title={saving ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
        />
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />
      </View>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BackgroundPrimary,
  },
  scrollView: {
    flexGrow: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BackgroundPrimary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: TextSecondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TextPrimary,
    letterSpacing: -0.3,
  },
  tabsScrollView: {
    borderBottomWidth: 0,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    gap: 6,
    borderRadius: RadiusFull,
    borderBottomWidth: 0,
  },
  tabActive: {
    backgroundColor: '#E8EDFB',
  },
  tabText: {
    fontSize: 13,
    color: TextSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: PrimaryBlue,
  },
  tabContentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TextPrimary,
    marginBottom: 16,
    letterSpacing: -0.1,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TextPrimary,
    marginBottom: 12,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 14,
  },
  uploadButton: {
    minWidth: 120,
  },
  disabledInput: {
    backgroundColor: Colors.light.subtle,
    opacity: 0.7,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  statCardBlue: {
    backgroundColor: '#E8EDFB',
  },
  statCardGreen: {
    backgroundColor: '#D1FAE5',
  },
  statCardPurple: {
    backgroundColor: '#EDE9FE',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: TextPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: TextSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  radioGroup: {
    gap: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: RadiusMedium,
    gap: 12,
  },
  radioOptionActive: {
    borderColor: PrimaryBlue,
    backgroundColor: '#E8EDFB',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PrimaryBlue,
  },
  radioLabel: {
    fontSize: 15,
    color: TextPrimary,
    flex: 1,
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B40',
    borderWidth: 1.5,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TextPrimary,
  },
  warningText: {
    fontSize: 14,
    color: TextSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  successCard: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B98140',
    borderWidth: 1.5,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TextPrimary,
  },
  successText: {
    fontSize: 14,
    color: TextSecondary,
    lineHeight: 20,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TextPrimary,
    marginTop: 14,
    marginBottom: 6,
  },
  placeholderText: {
    fontSize: 14,
    color: TextSecondary,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.card,
    gap: 10,
  },
  saveButton: {
    marginBottom: 0,
  },
  logoutButton: {
    marginTop: 0,
  },
  fullWidthButton: {
    width: '100%',
  },
});
