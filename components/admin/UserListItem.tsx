import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Card } from '@/components/ui/Card';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/theme'; // Import theme constants

export interface UserListItemProps {
  user: {
    id: string;
    username: string;
    email?: string;
    avatar_url?: string;
    is_admin: boolean;
    reportCount?: number;
    created_at: string;
  };
}

export function UserListItem({ user }: UserListItemProps) {
  return (
    <Card style={styles.container}>
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <FontAwesome5 name='user' size={20} color={Colors.white} />
              {/* Use theme color - Removed trailing space */}
            </View>
          )}
        </View>

        <View style={styles.info}>
          <View style={styles.nameContainer}>
            <Text style={styles.username}>{user.username}</Text>
            {user.is_admin && (
              <View style={styles.adminBadge}>
                <FontAwesome5
                  name='shield-alt'
                  size={12}
                  color={Colors.white}
                />
                {/* Use theme color - Removed trailing space */}
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}
          </View>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.stats}>
            {/* Combine into a single template literal to avoid potential issues with raw strings */}
            <Text style={styles.statsText}>
              {`${user.reportCount ?? 0} reports • Joined ${new Date(
                user.created_at
              ).toLocaleDateString()}`}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm, // Use theme spacing
    padding: Spacing.xl, // Use theme spacing
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: Spacing.xl, // Use theme spacing
  },
  avatar: {
    width: 50, // Keep fixed size for avatar
    height: 50,
    borderRadius: BorderRadius.round, // Use theme border radius
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.round, // Use theme border radius
    backgroundColor: Colors.mediumGray, // Use theme color
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxs, // Use theme spacing
  },
  username: {
    fontSize: Typography.fontSizeLarge, // Use theme typography
    fontWeight: Typography.fontWeightSemiBold, // Use theme typography
    color: Colors.darkGray, // Use theme color
    marginRight: Spacing.sm, // Use theme spacing
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary, // Use theme color
    paddingHorizontal: Spacing.sm, // Use theme spacing
    paddingVertical: Spacing.xxs, // Use theme spacing
    borderRadius: BorderRadius.lg_xl, // Use theme border radius
  },
  adminText: {
    color: Colors.white, // Use theme color
    fontSize: Typography.fontSizeSmall, // Use theme typography
    fontWeight: Typography.fontWeightMedium, // Use theme typography
    marginLeft: Spacing.xxs, // Use theme spacing
  },
  email: {
    fontSize: Typography.fontSizeMedium, // Use theme typography
    color: Colors.textGray, // Use theme color
    marginBottom: Spacing.xxs, // Use theme spacing
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: Typography.fontSizeSmall, // Use theme typography
    color: Colors.placeholderGray, // Use theme color
  },
});
