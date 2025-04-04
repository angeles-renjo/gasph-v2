import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal, // Import Modal
  FlatList, // Import FlatList
  Platform, // Import Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatRelativeTime } from '@/utils/formatters';
import { useUserProfile } from '@/hooks/queries/users/useUserProfile';
// Define UserContribution type locally as it's not exported from the hook
import { useUserContributions } from '@/hooks/queries/users/useUserContributions';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { queryKeys } from '@/hooks/queries/utils/queryKeys';
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore'; // Import preferences store
import { Colors, Spacing, Typography, BorderRadius } from '@/styles/theme'; // Import theme for styling (Added BorderRadius)
// Import FuelType definition (assuming it's correctly exported)
import { FuelType, ALL_FUEL_TYPES } from '@/hooks/queries/prices/useBestPrices'; // Import ALL_FUEL_TYPES too
// Removed Picker import

// Define the structure of a contribution locally, matching the updated hook
interface UserContribution {
  id: string;
  fuel_type: string;
  price: number;
  reported_at: string;
  station_id: string; // Added
  station_name: string; // Added
  station_brand: string; // Added
  station_city: string; // Added
  confirmations_count: number; // Added
  confidence_score: number; // Added
  cycle_id: string; // Added
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  // Get preferences state and setter
  const { defaultFuelType, setDefaultFuelType } = usePreferencesStore();
  // Re-add state for custom fuel picker modal
  const [isFuelModalVisible, setIsFuelModalVisible] = useState(false);

  // State only for UI actions, not data fetching
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch user profile data using TanStack Query
  const {
    data: profileData,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useUserProfile();

  // Fetch user contributions data using TanStack Query
  const {
    data: contributionsData,
    isLoading: areContributionsLoading,
    isError: areContributionsError,
    error: contributionsError,
    refetch: refetchContributions,
  } = useUserContributions(); // Using default limit from the hook

  // --- Event Handlers ---

  const handleSignOut = async () => {
    try {
      signOut();
      // Optional: Navigate to sign-in screen after sign out
      // router.replace('/auth/sign-in');
    } catch (error: any) {
      Alert.alert(
        'Sign Out Failed',
        error?.message || 'An unexpected error occurred'
      );
    }
  };

  const handleUploadAvatar = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload an avatar.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        if (user?.id) {
          await uploadImage(imageUri, user.id);
        } else {
          Alert.alert('Error', 'User ID not found. Cannot upload image.');
        }
      }
    } catch (error) {
      console.error('Error handling avatar upload:', error);
      Alert.alert(
        'Upload Failed',
        'There was a problem selecting or uploading your avatar. Please try again.'
      );
    }
  };

  const uploadImage = async (uri: string, userId: string) => {
    try {
      setUploadingImage(true);
      const response = await fetch(uri);
      const blob: Blob = await response.blob();

      const fileExt = uri.split('.').pop();
      const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Invalidate profile query to refetch updated data
      await queryClient.invalidateQueries({
        queryKey: queryKeys.users.profile(userId),
      });

      Alert.alert('Success', 'Your avatar has been updated.');
    } catch (error: any) {
      console.error('Error during image upload/update:', error);
      Alert.alert(
        'Upload Failed',
        error.message || 'There was a problem uploading your avatar'
      );
    } finally {
      setUploadingImage(false);
    }
  };

  // --- Render Helpers ---

  const renderContributions = () => {
    if (areContributionsLoading) {
      return (
        <ActivityIndicator color='#2a9d8f' style={{ marginVertical: 20 }} />
      );
    }

    if (areContributionsError) {
      console.error('Contributions Error:', contributionsError);
      return (
        <Card style={styles.emptyCard}>
          <Text style={styles.errorText}>Could not load contributions.</Text>
          <Button
            title='Retry'
            onPress={() => refetchContributions()}
            size='small'
            style={{ marginTop: 10 }}
          />
        </Card>
      );
    }

    if (contributionsData && contributionsData.length > 0) {
      // Process data to get the most recent contribution per fuel type
      // Since the query orders by reported_at desc, the first one encountered for each fuel type is the latest
      const latestContributionsByFuelType: { [key: string]: UserContribution } =
        {};
      contributionsData.forEach((contribution) => {
        if (!latestContributionsByFuelType[contribution.fuel_type]) {
          latestContributionsByFuelType[contribution.fuel_type] = contribution;
        }
      });
      const uniqueLatestContributions = Object.values(
        latestContributionsByFuelType
      );

      return (
        <>
          {uniqueLatestContributions.map((contribution) => (
            <Card key={contribution.id} style={styles.contributionCard}>
              <View style={styles.contributionHeader}>
                <Text style={styles.stationName} numberOfLines={1}>
                  {contribution.station_name ?? 'Unknown Station'}{' '}
                  {/* Updated access */}
                </Text>
                <Text style={styles.contributionDate} numberOfLines={1}>
                  {formatRelativeTime(contribution.reported_at)}
                </Text>
              </View>
              <View style={styles.contributionDetails}>
                <View style={styles.priceContainer}>
                  <Text style={styles.fuelType}>{contribution.fuel_type}</Text>
                  <Text style={styles.price}>
                    ₱{contribution.price.toFixed(2)}
                  </Text>
                </View>
                {/* Re-add confirmation count display */}
                <Text style={styles.confirmations}>
                  {contribution.confirmations_count}{' '}
                  {contribution.confirmations_count === 1
                    ? 'confirmation'
                    : 'confirmations'}
                </Text>
              </View>
            </Card>
          ))}
          {/* Add View All button if there are contributions */}
          <Button
            title='View All Contributions'
            // onPress={() => router.push('/user/contributions')} // Temporarily disable invalid route
            onPress={() =>
              Alert.alert('Coming Soon', 'This feature is not yet available.')
            } // Placeholder action
            style={{ marginTop: 15 }}
            variant='outline'
            size='small'
          />
        </>
      );
    }

    return (
      <Card style={styles.emptyCard}>
        <Text style={styles.emptyText}>
          You haven't submitted any price reports yet. Start contributing by
          reporting fuel prices at gas stations.
        </Text>
      </Card>
    );
  };

  // --- Main Render Logic ---

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

  // Check if user exists but profile data is missing after loading attempt
  if (!profileData && user) {
    console.warn(
      'Profile data is null/undefined after loading and without error while user is still present. Component might be rendering during state transition or profile creation pending.'
    );
    // Optionally show a specific message or retry mechanism
    return (
      <ErrorDisplay
        fullScreen
        message='Profile data unavailable. Please try again later.'
        onRetry={refetchProfile}
      />
    );
  }

  // If user is not logged in (user is null), don't render profile content
  // Auth flow should ideally handle redirection, but this prevents rendering errors
  if (!user) {
    // Optionally render a message or redirect
    // return <Text>Please sign in to view your profile.</Text>;
    return null; // Or redirect logic
  }

  // At this point, user exists and profileData should ideally exist if loading finished without error
  // If profileData is still null here despite user existing, it might indicate an issue
  // But we proceed assuming profileData is available or gracefully handle its absence below

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header Section */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleUploadAvatar}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <View style={[styles.avatar, styles.avatarLoading]}>
                <ActivityIndicator color='#fff' />
              </View>
            ) : profileData?.avatar_url ? ( // Check if profileData exists
              <Image
                source={{ uri: profileData.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatar}>
                <FontAwesome5 name='user' size={40} color='#fff' />
              </View>
            )}
            <View style={styles.editIconContainer}>
              <FontAwesome5 name='camera' size={14} color='#fff' />
            </View>
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <Text style={styles.username}>
              {profileData?.username || 'User'}{' '}
              {/* Check if profileData exists */}
            </Text>
            <Text style={styles.email}>{user?.email}</Text>

            {isAdmin && (
              <View style={styles.adminBadge}>
                <FontAwesome5 name='shield-alt' size={12} color='#fff' />
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

        {/* Contributions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Recent Contributions</Text>
          {renderContributions()}
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Card style={styles.preferenceCard}>
            <Text style={styles.preferenceLabel}>Default Fuel Type</Text>
            {/* Re-add Custom Picker Trigger Button */}
            <TouchableOpacity
              style={styles.pickerTriggerButton}
              onPress={() => setIsFuelModalVisible(true)}
            >
              <Text style={styles.pickerTriggerText}>
                {defaultFuelType || 'None (Use best available)'}
              </Text>
              <FontAwesome5
                name='chevron-down'
                size={16}
                color={Colors.textGray}
              />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Action Buttons Section */}
        <View style={styles.buttonSection}>
          {/* Example: Add Edit Profile button */}
          {/* <Button title="Edit Profile" onPress={() => router.push('/profile/edit')} style={{ marginBottom: 10 }} /> */}
          <Button
            title='Sign Out'
            variant='outline'
            onPress={handleSignOut}
            fullWidth
          />
        </View>
      </ScrollView>

      {/* Re-add Custom Fuel Type Picker Modal */}
      <Modal
        visible={isFuelModalVisible}
        transparent
        animationType='fade' // Fade looks nicer for custom modals
        onRequestClose={() => setIsFuelModalVisible(false)}
      >
        <TouchableOpacity // Allow closing by tapping overlay
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setIsFuelModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalContentTouchable}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Card style={styles.modalContentCard}>
              {/* Prevent overlay press closing when tapping card */}
              <Text style={styles.modalTitle}>Select Default Fuel Type</Text>
              <FlatList // Use FlatList for scrollable options
                data={[null, ...ALL_FUEL_TYPES]} // Add null option for "None"
                keyExtractor={(item: FuelType | null) => item ?? 'none'} // Add type for item
                renderItem={(
                  { item: fuelOption }: { item: FuelType | null } // Add type for renderItem param
                ) => (
                  <TouchableOpacity
                    style={[
                      styles.modalOption,
                      defaultFuelType === fuelOption &&
                        styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setDefaultFuelType(fuelOption);
                      setIsFuelModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        defaultFuelType === fuelOption &&
                          styles.modalOptionTextSelected,
                      ]}
                    >
                      {fuelOption || 'None (Use best available)'}
                    </Text>
                    {defaultFuelType === fuelOption && (
                      <FontAwesome5
                        name='check-circle'
                        size={16}
                        color={Colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => (
                  <View style={styles.modalSeparator} />
                )}
              />
              <Button
                title='Cancel'
                onPress={() => setIsFuelModalVisible(false)}
                variant='outline'
                style={{ marginTop: Spacing.xl }}
              />
            </Card>
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
    backgroundColor: '#f5f5f5', // Light grey background
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30, // Ensure space at the bottom
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ccc', // Default background
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Ensure image stays within bounds
  },
  avatarLoading: {
    backgroundColor: '#2a9d8f', // Indicate loading state
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#f4a261', // Accent color
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff', // White border for contrast
  },
  userInfo: {
    flex: 1, // Take remaining space
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333', // Darker text for readability
  },
  email: {
    fontSize: 14,
    color: '#666', // Grey for secondary info
    marginBottom: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a9d8f', // Theme color
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12, // Pill shape
    alignSelf: 'flex-start', // Don't stretch
    marginBottom: 8,
  },
  adminText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center', // Center stat items
    marginRight: 16, // Space between stats
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2a9d8f', // Theme color for emphasis
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkGray, // Use theme color
    marginBottom: Spacing.inputPaddingHorizontal, // Use theme spacing
  },
  preferenceCard: {
    padding: Spacing.xl,
  },
  preferenceLabel: {
    fontSize: Typography.fontSizeMedium,
    fontWeight: Typography.fontWeightMedium,
    color: Colors.darkGray,
    marginBottom: Spacing.sm,
  },
  pickerTriggerButton: {
    // Re-add trigger button styles
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.mediumGray,
    borderRadius: BorderRadius.md,
    padding: Spacing.inputPaddingHorizontal,
    height: Spacing.inputHeight + 2, // Match input height + border
    backgroundColor: Colors.white, // Match input background
  },
  pickerTriggerText: {
    // Re-add trigger text styles
    fontSize: Typography.fontSizeLarge,
    color: Colors.darkGray,
  },
  // Re-add Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.modalBackdrop,
    justifyContent: 'center', // Center modal vertically
    alignItems: 'center',
    padding: Spacing.lg_xl, // Add padding around modal
  },
  modalContentTouchable: {
    // Style for the TouchableOpacity wrapping the Card
    width: '100%',
    maxHeight: '70%',
    borderRadius: BorderRadius.lg, // Match Card's border radius
  },
  modalContentCard: {
    // Style for the Card inside the TouchableOpacity
    width: '100%',
    height: '100%', // Make card fill the touchable area
    padding: Spacing.lg_xl,
    borderRadius: BorderRadius.lg, // Use theme radius
  },
  modalTitle: {
    fontSize: Typography.fontSizeXLarge,
    fontWeight: Typography.fontWeightBold,
    color: Colors.darkGray,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: Spacing.inputPaddingHorizontal,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOptionSelected: {
    // Add subtle background or indicator for selected
    // backgroundColor: Colors.primaryLightTint, // Example
  },
  modalOptionText: {
    fontSize: Typography.fontSizeLarge,
    color: Colors.darkGray,
  },
  modalOptionTextSelected: {
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.primary, // Highlight selected text
  },
  modalSeparator: {
    height: 1,
    backgroundColor: Colors.dividerGray,
  },
  // End Modal Styles
  contributionCard: {
    marginBottom: 12,
    padding: 12, // Slightly reduced padding
  },
  contributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600', // Semi-bold
    color: '#333',
    flex: 1, // Allow station name to take space
    marginRight: 8, // Add spacing
  },
  contributionDate: {
    fontSize: 12,
    color: '#999', // Lighter grey for date
    textAlign: 'right', // Align text to the right if needed
  },
  contributionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4, // Add a little space
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fuelType: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2a9d8f', // Theme color
  },
  emptyCard: {
    padding: 16,
    alignItems: 'center', // Center content in empty card
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    color: 'red', // Standard error color
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 8, // Add space before retry button
  },
  buttonSection: {
    marginTop: 10, // Space above buttons
  },
  // Add confirmations style back
  confirmations: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8, // Add some space if needed, adjust as per design
  },
});
