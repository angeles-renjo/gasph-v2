import React, { useState } from 'react'; // Added useState, useCallback
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useStations } from '@/hooks/queries/admin/useStations';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
// import { Button } from '@/components/ui/Button'; // Removed Button import
import { Input } from '@/components/ui/Input'; // Added Input import
import { StationListItem } from '@/components/admin/StationListItem';
import { Colors } from '@/styles/theme';
import type { InfiniteData } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce'; // Assuming a debounce hook exists or can be created

interface GasStation {
  id: string;
  name: string;
  brand: string;
  address: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  amenities: Record<string, boolean>;
  operating_hours: Record<string, string>;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface StationsResponse {
  stations: GasStation[];
  totalCount: number;
}

export default function StationsScreen() {
  const router = useRouter(); // Keep router if needed for station item navigation
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // Debounce search input

  const {
    data,
    isLoading,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useStations(debouncedSearchTerm); // Pass debounced search term to hook

  const stations = React.useMemo(() => {
    if (!data) return [];
    // Flatten pages for FlatList
    return (data as InfiniteData<StationsResponse>).pages.reduce<GasStation[]>(
      (acc, page) => [...acc, ...page.stations],
      []
    );
  }, [data]);

  if (isLoading && !data) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <ErrorDisplay message='Failed to load stations' onRetry={refetch} />;
  }

  return (
    <View style={styles.container}>
      <FlatList<GasStation>
        data={stations}
        renderItem={({ item }) => <StationListItem station={item} />}
        keyExtractor={(item) => item.id}
        // Removed estimatedItemSize
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={Colors.light.tint}
          />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={styles.header}>
            <Input
              placeholder='Search by name, brand, city, address...'
              value={searchTerm}
              onChangeText={setSearchTerm}
              containerStyle={styles.searchInput}
              // Add clear button or icon if desired
            />
            {/* Removed Import Stations button */}
          </View>
        }
        ListFooterComponent={isFetchingNextPage ? <LoadingIndicator /> : null}
        // Add EmptyState component when stations array is empty
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 16,
    gap: 8,
  },
  header: {
    marginBottom: 16,
  },
  searchInput: {
    // Add styling for the search input container if needed
  },
});
