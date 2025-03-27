import React from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useStations } from "@/hooks/queries/admin/useStations";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import { Button } from "@/components/ui/Button";
import { StationListItem } from "@/components/admin/StationListItem";
import Colors from "@/constants/Colors";
import type { InfiniteData } from "@tanstack/react-query";

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
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

interface StationsResponse {
  stations: GasStation[];
  totalCount: number;
}

export default function StationsScreen() {
  const router = useRouter();
  const {
    data,
    isLoading,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useStations();

  const stations = React.useMemo(() => {
    if (!data) return [];
    return (data as InfiniteData<StationsResponse>).pages.reduce<GasStation[]>(
      (acc, page) => [...acc, ...page.stations],
      []
    );
  }, [data]);

  if (isLoading && !data) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <ErrorDisplay message="Failed to load stations" onRetry={refetch} />;
  }

  return (
    <View style={styles.container}>
      <FlatList<GasStation>
        data={stations}
        renderItem={({ item }) => <StationListItem station={item} />}
        keyExtractor={(item) => item.id}
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
            <Button
              title="Import Stations"
              onPress={() => router.push("/admin/import-stations")}
              variant="primary"
            />
          </View>
        }
        ListFooterComponent={isFetchingNextPage ? <LoadingIndicator /> : null}
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
});
