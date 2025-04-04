import React from 'react';
import { StyleSheet, FlatList, RefreshControl } from 'react-native'; // Re-added FlatList
import { SafeAreaView } from 'react-native-safe-area-context';
// Removed FlashList import
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { UserListItem } from '@/components/admin/UserListItem';
import { EmptyState } from '@/components/common/EmptyState';
import { useUsers } from '@/hooks/queries/admin/useUsers';

export default function UsersScreen() {
  const { data: users, isLoading, isError, refetch } = useUsers();

  if (isLoading) {
    return <LoadingIndicator message='Loading users...' />;
  }

  if (isError) {
    return <ErrorDisplay message='Failed to load users' onRetry={refetch} />;
  }

  if (!users?.length) {
    return (
      <EmptyState
        message='No users found'
        onAction={{
          label: 'Refresh',
          onPress: refetch,
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={users}
        renderItem={({ item }) => <UserListItem user={item} />}
        keyExtractor={(item) => item.id}
        // Removed estimatedItemSize
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor='#2a9d8f'
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    flexGrow: 1,
  },
});
