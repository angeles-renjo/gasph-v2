import React from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { useStations } from "@/hooks/queries/admin/useStations";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import { Button } from "@/components/ui/Button";
import { StationListItem } from "@/components/admin/StationListItem";

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
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.header}>
        <Button
          title="Import Stations"
          onPress={() => router.push("/admin/import-stations")}
          variant="primary"
        />
      </View>

      <FlatList
        data={stations?.pages.flatMap((page) => page.stations)}
        renderItem={({ item }) => <StationListItem station={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#2a9d8f"
          />
        }
        onEndReached={() => {
          if (hasNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingNextPage ? <LoadingIndicator /> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  content: {
    padding: 16,
  },
});
