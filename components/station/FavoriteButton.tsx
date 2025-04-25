import React, { useCallback } from 'react';
import {
  Pressable,
  ActivityIndicator,
  Animated,
  StyleSheet,
  View,
  Alert, // Import Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  useFavoriteStations,
  FavoriteLimitError,
} from '@/hooks/queries/stations/useFavoriteStations'; // Import FavoriteLimitError

interface FavoriteButtonProps {
  stationId: string;
  userId: string | undefined;
  favoriteStationIds: string[] | undefined;
  size?: number;
  onToggle?: (isFavorite: boolean) => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  stationId,
  userId,
  favoriteStationIds,
  size = 28,
  onToggle,
}) => {
  const { addFavorite, removeFavorite, isMutating, mutationError } =
    useFavoriteStations(userId);

  const isFavorite = !!favoriteStationIds?.includes(stationId);

  // Animation: scale star on toggle
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const animate = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim]);

  const handleToggle = async () => {
    if (isMutating) return;
    try {
      if (isFavorite) {
        await removeFavorite(stationId);
        animate();
        onToggle?.(false);
      } else {
        await addFavorite(stationId);
        animate();
        onToggle?.(true);
      }
    } catch (err) {
      if (err instanceof FavoriteLimitError) {
        // Show upgrade prompt if limit is reached
        Alert.alert(
          'Favorite Limit Reached',
          'Free users can only have 1 favorite station. Upgrade to Pro for unlimited favorites!',
          [{ text: 'OK' }]
        );
      } else {
        // Log other errors (already handled by mutationError state for UI)
        console.error('Favorite toggle error:', err);
      }
    }
  };

  return (
    <Pressable
      onPress={handleToggle}
      disabled={isMutating}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
      accessibilityLabel={
        isFavorite ? 'Remove from favorites' : 'Add to favorites'
      }
      hitSlop={8}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {isMutating ? (
          <ActivityIndicator size='small' color='#FFD700' />
        ) : (
          <MaterialIcons
            name={isFavorite ? 'star' : 'star-border'}
            size={size}
            color={isFavorite ? '#FFD700' : '#B0B0B0'}
            style={styles.icon}
          />
        )}
      </Animated.View>
      {!!mutationError && <View style={styles.errorDot} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 32,
    minHeight: 32,
  },
  icon: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  errorDot: {
    position: 'absolute',
    right: 2,
    top: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5252',
  },
});

export default FavoriteButton;
