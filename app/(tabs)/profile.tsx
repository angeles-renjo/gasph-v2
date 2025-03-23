import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatRelativeTime } from '@/utils/formatters';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchContributions();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContributions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_price_reports')
        .select(
          `
          id, 
          fuel_type, 
          price, 
          reported_at, 
          upvotes, 
          downvotes,
          gas_stations!inner(id, name, brand, city)
        `
        )
        .eq('user_id', user?.id)
        .order('reported_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setContributions(data || []);
    } catch (error) {
      console.error('Error fetching contributions:', error);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleUploadAvatar = async () => {
    try {
      // Request permissions
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload an avatar.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        await uploadImage(imageUri);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert(
        'Upload Failed',
        'There was a problem uploading your avatar. Please try again.'
      );
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploadingImage(true);

      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const fileExt = uri.split('.').pop();
      const fileName = `avatar-${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Refresh profile
      fetchProfile();
      Alert.alert('Success', 'Your avatar has been updated.');
    } catch (error: any) {
      Alert.alert(
        'Upload Failed',
        error.message || 'There was a problem uploading your avatar'
      );
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#2a9d8f' />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleUploadAvatar}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <View style={styles.avatar}>
                <ActivityIndicator color='#fff' />
              </View>
            ) : profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
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
            <Text style={styles.username}>{profile?.username || 'User'}</Text>
            <Text style={styles.email}>{user?.email}</Text>

            {isAdmin && (
              <View style={styles.adminBadge}>
                <FontAwesome5 name='shield-alt' size={12} color='#fff' />
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{contributions.length}</Text>
                <Text style={styles.statLabel}>Reports</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {profile?.reputation_score || 0}
                </Text>
                <Text style={styles.statLabel}>Rep. Score</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Recent Contributions</Text>

          {contributions.length > 0 ? (
            contributions.map((contribution) => (
              <Card key={contribution.id} style={styles.contributionCard}>
                <View style={styles.contributionHeader}>
                  <Text style={styles.stationName}>
                    {contribution.gas_stations.name}
                  </Text>
                  <Text style={styles.contributionDate}>
                    {formatRelativeTime(contribution.reported_at)}
                  </Text>
                </View>

                <View style={styles.contributionDetails}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.fuelType}>
                      {contribution.fuel_type}
                    </Text>
                    <Text style={styles.price}>
                      ₱{contribution.price.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.votesContainer}>
                    <Text style={styles.upvotes}>
                      <FontAwesome5 name='thumbs-up' size={12} />{' '}
                      {contribution.upvotes}
                    </Text>
                    <Text style={styles.downvotes}>
                      <FontAwesome5 name='thumbs-down' size={12} />{' '}
                      {contribution.downvotes}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                You haven't submitted any price reports yet. Start contributing
                by reporting fuel prices at gas stations.
              </Text>
            </Card>
          )}
        </View>

        <View style={styles.buttonSection}>
          <Button
            title='Sign Out'
            variant='outline'
            onPress={handleSignOut}
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
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
    backgroundColor: '#2a9d8f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#f4a261',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a9d8f',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
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
    marginRight: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2a9d8f',
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
    color: '#333',
    marginBottom: 12,
  },
  contributionCard: {
    marginBottom: 12,
    padding: 12,
  },
  contributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  contributionDate: {
    fontSize: 12,
    color: '#999',
  },
  contributionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: '#2a9d8f',
  },
  votesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upvotes: {
    fontSize: 14,
    color: '#4caf50',
    marginRight: 8,
  },
  downvotes: {
    fontSize: 14,
    color: '#f44336',
  },
  emptyCard: {
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  buttonSection: {
    marginBottom: 30,
  },
});
