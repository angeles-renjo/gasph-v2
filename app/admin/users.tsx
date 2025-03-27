import React from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUsers } from "@/hooks/queries/admin/useUsers";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import { UserListItem } from "@/components/admin/UserListItem";

export default function UsersScreen() {
  const {
    data: users,
    isLoading,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useUsers();

  console.log("Debug info:", {
    isLoading,
    error,
    hasData: !!users,
    pagesCount: users?.pages?.length,
    errorDetails: error instanceof Error ? error.message : error,
  });

  if (error) {
    return <ErrorDisplay message="Failed to load users" onRetry={refetch} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FlatList
        data={users?.pages.flatMap((page) => page.users)}
        renderItem={({ item }) => <UserListItem user={item} />}
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
  content: {
    padding: 16,
  },
});
