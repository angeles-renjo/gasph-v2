import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useImportStations } from '@/hooks/useImportStations';
import { ImportStatus } from '@/constants/gasStations';

function GooglePlacesImportScreen() {
  const {
    apiKey,
    setApiKey,
    isImporting,
    importStatuses,
    overallProgress,
    importGasStations,
  } = useImportStations();

  const getStatusIcon = (status: ImportStatus['status']) => {
    switch (status) {
      case 'pending':
        return <FontAwesome5 name='clock' size={16} color='#999' />;
      case 'in-progress':
        return <ActivityIndicator size='small' color='#2a9d8f' />;
      case 'completed':
        return <FontAwesome5 name='check-circle' size={16} color='#4caf50' />;
      case 'error':
        return (
          <FontAwesome5 name='exclamation-circle' size={16} color='#f44336' />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
            label='Google Places API Key'
            placeholder='Enter your API key'
            value={apiKey}
            onChangeText={setApiKey}
            containerStyle={styles.inputContainer}
            secureTextEntry
          />
          <Button
            title={isImporting ? 'Importing...' : 'Start Import'}
            onPress={importGasStations}
            loading={isImporting}
            disabled={isImporting || !apiKey.trim()}
            style={styles.importButton}
          />
        </Card>

        {isImporting && (
          <Card style={styles.progressCard}>
            <Text style={styles.sectionTitle}>Overall Progress</Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${
                      overallProgress.total > 0
                        ? (overallProgress.processed / overallProgress.total) *
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Import Status by City</Text>
          {importStatuses.map((cityStatus) => (
            <Card key={cityStatus.city} style={styles.cityCard}>
              <View style={styles.cityHeader}>
                <Text style={styles.cityName}>{cityStatus.city}</Text>
                {getStatusIcon(cityStatus.status)}
              </View>
              <View style={styles.cityContent}>
                {cityStatus.status === 'completed' && (
                  <Text style={styles.cityStats}>
                    Found: {cityStatus.stationsFound}, Imported:{' '}
                    {cityStatus.stationsImported}
                  </Text>
                )}
                {cityStatus.status === 'in-progress' && (
                  <Text style={styles.cityStats}>
                    Found: {cityStatus.stationsFound || 'Searching...'}
                  </Text>
                )}
                {cityStatus.status === 'error' && (
                  <Text style={styles.cityError}>{cityStatus.error}</Text>
                )}
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  configCard: {
    padding: 16,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  importButton: {
    marginTop: 8,
  },
  progressCard: {
    padding: 16,
    marginBottom: 20,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2a9d8f',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  cityCard: {
    padding: 12,
    marginBottom: 8,
  },
  cityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cityContent: {
    marginTop: 4,
  },
  cityStats: {
    fontSize: 14,
    color: '#666',
  },
  cityError: {
    fontSize: 14,
    color: '#f44336',
  },
});

export default GooglePlacesImportScreen;
