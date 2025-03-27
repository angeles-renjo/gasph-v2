import React from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useStations } from "@/hooks/queries/admin/useStations";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import { Button } from "@/components/ui/Button";
import { StationListItem } from "@/components/admin/StationListItem";
import Colors from "@/constants/Colors";

export default function StationsScreen() {
  const router = useRouter();
  const {
    data: stations,
    isLoading,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useStations();

  if (error) {
    return <ErrorDisplay message="Failed to load stations" onRetry={refetch} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={stations?.pages.flatMap((page) => page.stations)}
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
          if (hasNextPage) {
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
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 16,
  },
  content: {
    paddingHorizontal: 16,
  },
});
