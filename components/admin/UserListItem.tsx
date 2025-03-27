import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Card } from "@/components/ui/Card";
import { FontAwesome5 } from "@expo/vector-icons";

export interface UserListItemProps {
  user: {
    id: string;
    username: string;
    email?: string;
    avatar_url?: string;
    is_admin: boolean;
    reportCount?: number;
    created_at: string;
  };
}

export function UserListItem({ user }: UserListItemProps) {
  return (
    <Card style={styles.container}>
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <FontAwesome5 name="user" size={20} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <View style={styles.nameContainer}>
            <Text style={styles.username}>{user.username}</Text>
            {user.is_admin && (
              <View style={styles.adminBadge}>
                <FontAwesome5 name="shield-alt" size={12} color="#fff" />
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}
          </View>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.stats}>
            <Text style={styles.statsText}>
              {user.reportCount} reports • Joined{" "}
              {new Date(user.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    padding: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a9d8f",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsText: {
    fontSize: 12,
    color: "#999",
  },
});
