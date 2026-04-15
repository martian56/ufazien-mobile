import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

const AVATAR_PALETTES = [
  ['#4338CA', '#6366F1'], // indigo
  ['#0D9668', '#34D399'], // emerald
  ['#B45309', '#F59E0B'], // amber
  ['#DC2626', '#F87171'], // red
  ['#7C3AED', '#A78BFA'], // violet
  ['#0369A1', '#38BDF8'], // sky
  ['#BE185D', '#F472B6'], // pink
  ['#1A56DB', '#60A5FA'], // blue
];

const getInitials = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const hashName = (name?: string): number => {
  if (!name) return 0;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

export const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 'md', style }) => {
  const sizeMap = { sm: 32, md: 44, lg: 72 };
  const fontMap = { sm: 11, md: 15, lg: 22 };
  const avatarSize = sizeMap[size];
  const fontSize = fontMap[size];
  const palette = AVATAR_PALETTES[hashName(name) % AVATAR_PALETTES.length];

  return (
    <View
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              backgroundColor: palette[0],
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
