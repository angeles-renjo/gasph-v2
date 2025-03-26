import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";

interface StationListItemProps {
  station: {
    id: string;
    name: string;
    brand: string;
    address: string;
    city: string;
  };
}

export function StationListItem({ station }: StationListItemProps) {
  return (
    <Link href={`/station/${station.id}`} asChild>
      <TouchableOpacity>
        <Card style={styles.container}>
          <View style={styles.content}>
            <View style={styles.mainInfo}>
              <Text style={styles.name}>{station.name}</Text>
              <Text style={styles.brand}>{station.brand}</Text>
              <Text style={styles.address}>
                {station.address}, {station.city}
              </Text>
            </View>
            <FontAwesome5 name="chevron-right" size={16} color="#999" />
          </View>
        </Card>
      </TouchableOpacity>
    </Link>
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
    justifyContent: "space-between",
  },
  mainInfo: {
    flex: 1,
    marginRight: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  brand: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: "#666",
  },
});
