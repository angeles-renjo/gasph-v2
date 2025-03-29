import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/utils/supabase/supabase";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatRelativeTime } from "@/utils/formatters";
// import { CycleInfoBadge } from "@/components/admin/CycleInfoBadge"; // Uncomment if using cycles
import { useUserProfile } from "@/hooks/queries/users/useUserProfile";
import { useUserContributions } from "@/hooks/queries/users/useUserContributions";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import { queryKeys } from "@/hooks/queries/utils/queryKeys";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, isAdmin } = useAuth();
  const queryClient = useQueryClient();

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
    refetch: refetchContributions, // Can use this for pull-to-refresh etc.
  } = useUserContributions();

  // --- Event Handlers ---

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert(
        "Sign Out Failed",
        error?.message || "An unexpected error occurred"
      );
    }
  };

  const handleUploadAvatar = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to upload an avatar."
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
          Alert.alert("Error", "User ID not found. Cannot upload image.");
        }
      }
    } catch (error) {
      console.error("Error handling avatar upload:", error);
      Alert.alert(
        "Upload Failed",
        "There was a problem selecting or uploading your avatar. Please try again."
      );
    }
  };

  // Uploads image and invalidates profile query on success
  const uploadImage = async (uri: string, userId: string) => {
    try {
      setUploadingImage(true);
      const response = await fetch(uri);
      const blob: Blob = await response.blob();

      const fileExt = uri.split(".").pop();
      const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      // Invalidate query to refresh profile data automatically
      await queryClient.invalidateQueries({
        queryKey: queryKeys.users.profile(userId),
      });

      Alert.alert("Success", "Your avatar has been updated.");
    } catch (error: any) {
      console.error("Error during image upload/update:", error);
      Alert.alert(
        "Upload Failed",
        error.message || "There was a problem uploading your avatar"
      );
    } finally {
      setUploadingImage(false);
    }
  };

  // --- Render Helpers ---

  // Helper function to render the contributions section content
  const renderContributions = () => {
    // 1. Handle Loading
    if (areContributionsLoading) {
      return (
        <ActivityIndicator color="#2a9d8f" style={{ marginVertical: 20 }} />
      );
    }
    // 2. Handle Error (only if not loading)
    if (areContributionsError) {
      console.error("Contributions Error:", contributionsError);
      return (
        <Card style={styles.emptyCard}>
          <Text style={styles.errorText}>Could not load contributions.</Text>
          <Button
            title="Retry"
            onPress={() => refetchContributions()}
            size="small"
            style={{ marginTop: 10 }}
          />
        </Card>
      );
    }
    // 3. Handle Data (only if not loading and no error)
    if (contributionsData && contributionsData.length > 0) {
      return contributionsData.map((contribution) => (
        <Card key={contribution.id} style={styles.contributionCard}>
          <View style={styles.contributionHeader}>
            <Text style={styles.stationName}>
              {contribution.gas_stations?.[0]?.name ?? "Unknown Station"}
            </Text>
            <Text style={styles.contributionDate} numberOfLines={1}>
              {formatRelativeTime(contribution.reported_at)}
            </Text>
          </View>
          <View style={styles.contributionDetails}>
            <View style={styles.priceContainer}>
              <Text style={styles.fuelType}>{contribution.fuel_type}</Text>
              <Text style={styles.price}>₱{contribution.price.toFixed(2)}</Text>
            </View>
            {/* Add cycle badge if needed */}
            {/* {contribution.cycle && (
                <CycleInfoBadge
                  cycleNumber={contribution.cycle.cycle_number}
                  status={contribution.cycle.status}
                  compact={true}
                />
              )} */}
          </View>
        </Card>
      ));
    }
    // 4. Handle Empty State (if not loading, no error, and no data)
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
    return <LoadingIndicator fullScreen message="Loading your profile..." />;
  }

  if (isProfileError) {
    return (
      <ErrorDisplay
        fullScreen
        message={profileError?.message || "Failed to load profile."}
        onRetry={refetchProfile}
      />
    );
  }

  // If not loading and no error, profileData should exist due to enabled flag in useUserProfile
  if (!profileData) {
    console.warn(
      "Profile data is unexpectedly null/undefined after loading state."
    );
    return (
      <ErrorDisplay
        fullScreen
        message="Profile data unavailable."
        onRetry={refetchProfile}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
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
                <ActivityIndicator color="#fff" />
              </View>
            ) : profileData.avatar_url ? (
              <Image
                source={{ uri: profileData.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatar}>
                <FontAwesome5 name="user" size={40} color="#fff" />
              </View>
            )}
            <View style={styles.editIconContainer}>
              <FontAwesome5 name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <Text style={styles.username}>
              {profileData.username || "User"}
            </Text>
            <Text style={styles.email}>{user?.email}</Text>

            {isAdmin && (
              <View style={styles.adminBadge}>
                <FontAwesome5 name="shield-alt" size={12} color="#fff" />
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {areContributionsLoading
                    ? "..."
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

        {/* Action Buttons Section */}
        <View style={styles.buttonSection}>
          <Button
            title="Sign Out"
            variant="outline"
            onPress={handleSignOut}
            fullWidth
          />
          {/* Add other action buttons if needed */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30, // Ensure space at the bottom
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ccc", // Default background
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden", // Ensure image stays within bounds
  },
  avatarLoading: {
    backgroundColor: "#2a9d8f", // Indicate loading state
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#f4a261",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a9d8f",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  adminText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: "row",
    marginTop: 8,
  },
  statItem: {
    alignItems: "center", // Center stat items
    marginRight: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2a9d8f",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  contributionCard: {
    marginBottom: 12,
    padding: 12,
  },
  contributionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1, // Allow station name to take space
    marginRight: 8, // Add spacing
  },
  contributionDate: {
    fontSize: 12,
    color: "#999",
    textAlign: "right", // Align text to the right if needed
  },
  contributionDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  fuelType: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2a9d8f",
  },
  emptyCard: {
    padding: 16,
    alignItems: "center", // Center content in empty card
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontSize: 14,
    marginBottom: 8, // Add space before retry button
  },
  buttonSection: {
    marginTop: 10,
  },
});
