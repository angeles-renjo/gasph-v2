import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { useUserProfile } from '@/hooks/queries/users/useUserProfile';
import { useUserContributions } from '@/hooks/queries/users/useUserContributions';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore';
import { Colors, Spacing, Typography, BorderRadius } from '@/styles/theme';
import { FuelType, ALL_FUEL_TYPES } from '@/hooks/queries/prices/useBestPrices';
import { Picker } from '@react-native-picker/picker';

interface UserContribution {
  id: string;
  fuel_type: string;
  price: number;
  reported_at: string;
  station_id: string;
  station_name: string;
  station_brand: string;
  station_city: string;
  confirmations_count: number;
  confidence_score: number;
  cycle_id: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, isAdmin } = useAuth();
  const { defaultFuelType, setDefaultFuelType } = usePreferencesStore();
  const [isFuelModalVisible, setIsFuelModalVisible] = useState(false);

  const {
    data: profileData,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useUserProfile();

  const { data: contributionsData, isLoading: areContributionsLoading } =
    useUserContributions();

  const handleSignOut = async () => {
    try {
      signOut();
    } catch (error: any) {
      Alert.alert(
        'Sign Out Failed',
        error?.message || 'An unexpected error occurred'
      );
    }
  };

  // Removed handleUploadAvatar function
  // Removed uploadImage function

  if (isProfileLoading) {
    return <LoadingIndicator fullScreen message='Loading your profile...' />;
  }

  if (isProfileError) {
    return (
      <ErrorDisplay
        fullScreen
        message={profileError?.message || 'Failed to load profile.'}
        onRetry={refetchProfile}
      />
    );
  }

  if (!profileData && user) {
    console.warn(
      'Profile data is null/undefined after loading and without error while user is still present.'
    );
    return (
      <ErrorDisplay
        fullScreen
        message='Profile data unavailable. Please try again later.'
        onRetry={refetchProfile}
      />
    );
  }

  if (!user) {
    return null; // Should be handled by auth flow
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* --- Left-Aligned Profile Header --- */}
        <View style={styles.profileHeader}>
          <View>
            {profileData?.avatar_url ? (
              <Image
                source={{ uri: profileData.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatar}>
                <FontAwesome5 name='user' size={30} color={Colors.white} />
              </View>
            )}
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.username} numberOfLines={1}>
              {profileData?.username || 'User'}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email}
            </Text>

            {isAdmin && (
              <View style={styles.adminBadge}>
                <FontAwesome5
                  name='shield-alt'
                  size={12}
                  color={Colors.white}
                />
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {areContributionsLoading
                    ? '...'
                    : contributionsData?.length ?? 0}
                </Text>
                <Text style={styles.statLabel}>Reports</Text>
              </View>
              {/* Add more stats here if needed */}
            </View>
          </View>
        </View>

        {/* --- Settings List Section --- */}
        <View style={styles.settingsListContainer}>
          {/* Email Row (Read-only) */}
          <View style={[styles.listItem, styles.listItemDisabled]}>
            <FontAwesome5
              name='envelope'
              size={18}
              color={Colors.textGray}
              style={styles.listItemIcon}
            />
            <Text style={styles.listItemLabel}>Email</Text>
            <Text style={styles.listItemValue} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>

          {/* Fuel Preference Row */}
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => setIsFuelModalVisible(true)}
          >
            <FontAwesome5
              name='gas-pump'
              size={18}
              color={Colors.textGray}
              style={styles.listItemIcon}
            />
            <Text style={styles.listItemLabel}>Default Fuel Type</Text>
            <Text style={styles.listItemValue}>
              {defaultFuelType || 'None'}
            </Text>
            <FontAwesome5
              name='chevron-right'
              size={16}
              color={Colors.mediumGray}
            />
          </TouchableOpacity>

          {/* My Contributions Row */}
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => router.push('/contributions')}
          >
            <FontAwesome5
              name='list-alt'
              size={18}
              color={Colors.textGray}
              style={styles.listItemIcon}
            />
            <Text style={styles.listItemLabel}>My Contributions</Text>
            <FontAwesome5
              name='chevron-right'
              size={16}
              color={Colors.mediumGray}
            />
          </TouchableOpacity>

          {/* Sign Out Row */}
          <TouchableOpacity
            style={[styles.listItem, styles.signOutItem]}
            onPress={handleSignOut}
          >
            <FontAwesome5
              name='sign-out-alt'
              size={18}
              color={Colors.error}
              style={styles.listItemIcon}
            />
            <Text style={[styles.listItemLabel, styles.signOutLabel]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- Fuel Preference Picker Modal --- */}
      <Modal
        visible={isFuelModalVisible}
        transparent
        animationType='slide'
        onRequestClose={() => setIsFuelModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setIsFuelModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalPickerContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Fuel Type</Text>
              <Button
                title='Done'
                onPress={() => setIsFuelModalVisible(false)}
                size='small'
                variant='outline'
              />
            </View>
            <Picker
              selectedValue={defaultFuelType}
              onValueChange={(itemValue: FuelType | null) => {
                setDefaultFuelType(itemValue);
              }}
              style={styles.modalPicker}
              itemStyle={styles.modalPickerItem}
            >
              <Picker.Item label='None (Use best available)' value={null} />
              {ALL_FUEL_TYPES.map((fuelType) => (
                <Picker.Item key={fuelType} label={fuelType} value={fuelType} />
              ))}
            </Picker>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray2,
  },
  scrollContent: {
    paddingVertical: Spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.mediumGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  username: {
    fontSize: Typography.fontSizeXLarge,
    fontWeight: Typography.fontWeightBold,
    color: Colors.darkGray,
    marginBottom: Spacing.xxs,
  },
  email: {
    fontSize: Typography.fontSizeSmall,
    color: Colors.textGray,
    marginBottom: Spacing.sm,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.lg_xl,
    marginBottom: Spacing.sm,
  },
  adminText: {
    fontSize: Typography.fontSizeSmall,
    fontWeight: Typography.fontWeightBold,
    color: Colors.white,
    marginLeft: Spacing.xxs,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: Colors.lightGray2,
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.fontSizeMedium,
    fontWeight: Typography.fontWeightBold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Typography.fontSizeXSmall,
    color: Colors.textGray,
  },
  settingsListContainer: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: Spacing.xl,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerGray,
  },
  listItemDisabled: {},
  listItemIcon: {
    width: 24,
    textAlign: 'center',
    marginRight: Spacing.lg,
  },
  listItemLabel: {
    flex: 1,
    fontSize: Typography.fontSizeLarge,
    color: Colors.darkGray,
  },
  listItemValue: {
    fontSize: Typography.fontSizeLarge,
    color: Colors.textGray,
    marginRight: Spacing.sm,
  },
  signOutItem: {
    borderBottomWidth: 0,
  },
  signOutLabel: {
    color: Colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.modalBackdrop,
    justifyContent: 'flex-end',
  },
  modalPickerContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: Spacing.lg,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerGray,
  },
  modalTitle: {
    fontSize: Typography.fontSizeLarge,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.darkGray,
  },
  modalPicker: {},
  modalPickerItem: {},
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    fontSize: Typography.fontSizeMedium,
    color: Colors.textGray,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    fontSize: Typography.fontSizeMedium,
    marginBottom: Spacing.sm,
  },
});
