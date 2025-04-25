import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Colors, Typography, Spacing } from '@/styles/theme'; // Import theme constants

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
            <FontAwesome5
              name='chevron-right'
              size={16}
              color={Colors.placeholderGray}
            />
            {/* Use theme color */}
          </View>
        </Card>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm, // Use theme spacing
    padding: Spacing.xl, // Use theme spacing
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainInfo: {
    flex: 1,
    marginRight: Spacing.xl, // Use theme spacing
  },
  name: {
    fontSize: Typography.fontSizeLarge, // Use theme typography
    fontWeight: Typography.fontWeightSemiBold, // Use theme typography
    color: Colors.darkGray, // Use theme color
    marginBottom: Spacing.xxs, // Use theme spacing
  },
  brand: {
    fontSize: Typography.fontSizeMedium, // Use theme typography
    color: Colors.textGray, // Use theme color
    marginBottom: Spacing.xxs, // Use theme spacing
  },
  address: {
    fontSize: Typography.fontSizeMedium, // Use theme typography
    color: Colors.textGray, // Use theme color
  },
});
