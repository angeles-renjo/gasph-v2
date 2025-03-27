import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useImportStations } from "@/hooks/queries/stations/useImportStations";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";

export default function ImportStationsScreen() {
  const {
    apiKey,
    setApiKey,
    isPending,
    importStatuses,
    overallProgress,
    importGasStations,
  } = useImportStations();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Import Gas Stations",
          headerStyle: {
            backgroundColor: "#2a9d8f",
          },
          headerTintColor: "#fff",
        }}
      />

      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Import Gas Stations</Text>
            <Text style={styles.subtitle}>
              Import gas station data from Google Places API
            </Text>
          </View>

          <Card style={styles.configCard}>
            <Text style={styles.sectionTitle}>Configuration</Text>
            <Input
              label="Google Places API Key"
              placeholder="Enter your API key"
              value={apiKey}
              onChangeText={setApiKey}
              containerStyle={styles.inputContainer}
              secureTextEntry
            />
            <Button
              title={isPending ? "Importing..." : "Start Import"}
              onPress={importGasStations}
              loading={isPending}
              disabled={isPending || !apiKey.trim()}
              style={styles.importButton}
            />
          </Card>

          {isPending && (
            <Card style={styles.progressCard}>
              <Text style={styles.sectionTitle}>Overall Progress</Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${
                        overallProgress.total > 0
                          ? (overallProgress.processed /
                              overallProgress.total) *
                            100
                          : 0
                      }%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {overallProgress.processed} / {overallProgress.total} stations
                processed
              </Text>
              <Text style={styles.progressText}>
                {overallProgress.imported} new stations imported
              </Text>
            </Card>
          )}

          <Card style={styles.statusCard}>
            <Text style={styles.sectionTitle}>Import Status by City</Text>
            {importStatuses.map((status) => (
              <View key={status.city} style={styles.statusItem}>
                <View style={styles.statusHeader}>
                  <Text style={styles.cityName}>{status.city}</Text>
                  {status.status === "pending" && (
                    <FontAwesome5 name="clock" size={16} color="#999" />
                  )}
                  {status.status === "in-progress" && (
                    <LoadingIndicator size="small" />
                  )}
                  {status.status === "completed" && (
                    <FontAwesome5
                      name="check-circle"
                      size={16}
                      color="#4caf50"
                    />
                  )}
                  {status.status === "error" && (
                    <FontAwesome5
                      name="exclamation-circle"
                      size={16}
                      color="#f44336"
                    />
                  )}
                </View>
                {status.stationsFound !== undefined && (
                  <Text style={styles.statusText}>
                    Found: {status.stationsFound}, Imported:{" "}
                    {status.stationsImported}
                  </Text>
                )}
                {status.error && (
                  <Text style={styles.errorText}>{status.error}</Text>
                )}
              </View>
            ))}
          </Card>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  configCard: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  inputContainer: {
    marginBottom: 16,
  },
  importButton: {
    minWidth: 150,
  },
  progressCard: {
    marginBottom: 16,
    padding: 16,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#2a9d8f",
  },
  progressText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  statusCard: {
    padding: 16,
  },
  statusItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cityName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  statusText: {
    fontSize: 14,
    color: "#666",
  },
  errorText: {
    fontSize: 14,
    color: "#f44336",
    marginTop: 4,
  },
});
