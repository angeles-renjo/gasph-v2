import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useImportStations } from "@/hooks/queries/stations/useImportStations";
import Colors from "@/constants/Colors";
import type { ImportStatus } from "@/constants/gasStations";

interface StatusIconProps {
  status: ImportStatus["status"];
}

function StatusIcon({ status }: StatusIconProps) {
  let icon: string;
  let color: string;

  switch (status) {
    case "completed":
      icon = "check-circle";
      color = Colors.success;
      break;
    case "error":
      icon = "times-circle";
      color = Colors.error;
      break;
    case "in-progress":
      icon = "spinner";
      color = Colors.warning;
      break;
    default:
      icon = "circle";
      color = Colors.tabIconDefault;
  }

  return (
    <FontAwesome5
      name={icon}
      size={16}
      color={color}
      style={status === "in-progress" && styles.spinning}
    />
  );
}

export function GooglePlacesImportScreen() {
  const {
    apiKey,
    setApiKey,
    isPending,
    importStatuses,
    overallProgress,
    importGasStations,
  } = useImportStations();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.inputCard}>
          <Text style={styles.label}>Google Places API Key</Text>
          <Input
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Enter your API key"
            secureTextEntry
            editable={!isPending} // Changed from isImporting
          />
          <Button
            title={isPending ? "Importing..." : "Start Import"} // Changed from isImporting
            onPress={importGasStations}
            disabled={!apiKey.trim() || isPending} // Changed from isImporting
            loading={isPending} // Changed from isImporting
            style={styles.importButton}
          />
        </Card>

        <Card style={styles.progressCard}>
          <Text style={styles.sectionTitle}>Overall Progress</Text>
          <View style={styles.progressRow}>
            <Text>Total Stations Found: {overallProgress.total}</Text>
            <Text>Processed: {overallProgress.processed}</Text>
            <Text>Imported: {overallProgress.imported}</Text>
          </View>
        </Card>

        <Card style={styles.statusCard}>
          <Text style={styles.sectionTitle}>Import Status by City</Text>
          {importStatuses.map((cityStatus) => (
            <View key={cityStatus.city} style={styles.statusRow}>
              <StatusIcon status={cityStatus.status} />
              <Text style={styles.cityName}>{cityStatus.city}</Text>
              <Text style={styles.statusText}>
                {cityStatus.status === "completed" && cityStatus.stationsFound
                  ? `${cityStatus.stationsImported}/${cityStatus.stationsFound} imported`
                  : cityStatus.status === "error"
                  ? cityStatus.error
                  : cityStatus.status}
              </Text>
            </View>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 16,
  },
  inputCard: {
    marginBottom: 16,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  importButton: {
    marginTop: 16,
  },
  progressCard: {
    marginBottom: 16,
    padding: 16,
  },
  statusCard: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  progressRow: {
    gap: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  cityName: {
    flex: 1,
    fontWeight: "500",
  },
  statusText: {
    color: Colors.tabIconDefault,
  },
  spinning: {
    transform: [{ rotate: "45deg" }],
  },
});
