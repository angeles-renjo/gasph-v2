import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/theme';
import FAQAccordionItem, { FAQItem } from './FAQAccordionItem';

// Main FAQ Screen Component
export default function FAQScreen() {
  const faqData: FAQItem[] = [
    {
      question: 'What is GasPH?',
      answer:
        'GasPH is a mobile application designed to help Filipino drivers find the best fuel prices at gas stations near them. The app combines official Department of Energy (DOE) fuel price data with community-reported prices, allowing you to make informed decisions about where to refuel your vehicle.',
    },
    {
      question: 'How does GasPH get its price data?',
      answer: (
        <View>
          <Text style={styles.answerText}>
            GasPH uses two main sources of price data:
          </Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.answerText}>
              <Text style={styles.bold}>Official DOE data:</Text> We incorporate
              official price references from the Department of Energy that
              provide benchmark price ranges for different areas and fuel types.
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.answerText}>
              <Text style={styles.bold}>Community reports:</Text> Users like you
              can report current prices they see at gas stations, helping
              everyone get real-time updates.
            </Text>
          </View>
        </View>
      ),
    },
    {
      question: 'What are price reporting cycles?',
      answer:
        'Price reporting cycles are time periods during which price reports are collected. This helps organize data and ensure that displayed prices remain current. The app primarily shows prices from the active reporting cycle, which typically spans a few weeks. Older cycles may be archived as new ones begin.',
    },
    {
      question: 'How can I report a fuel price?',
      answer: (
        <View>
          <Text style={styles.answerText}>To report a fuel price:</Text>
          <Text style={styles.answerText}>
            1. Navigate to any station's detail page by selecting it from the
            Best Prices, Explore, or Map screens.
          </Text>
          <Text style={styles.answerText}>
            2. Tap the "Report Price" button.
          </Text>
          <Text style={styles.answerText}>
            3. Select the fuel type and enter the current price you observed.
          </Text>
          <Text style={styles.answerText}>
            4. Submit your report. It will be immediately visible to other
            users.
          </Text>
          <Text style={styles.answerText}>
            Note: You must be logged in to report prices.
          </Text>
        </View>
      ),
    },
    {
      question: 'What is price confirmation?',
      answer:
        'Price confirmation is a community verification system. When you see a price report that matches what you observed at a station, you can confirm it to increase its reliability. The more confirmations a price report receives, the higher its confidence score, which helps other users trust the information.',
    },
    {
      question: "How is the 'Best Price' determined?",
      answer:
        'The Best Prices screen shows the lowest confirmed prices for your selected fuel type within your chosen distance range. We consider both the price and the distance to provide you with valuable options. Prices with more community confirmations rank higher in reliability.',
    },
    {
      question: 'What fuel types does GasPH support?',
      answer: (
        <View>
          <Text style={styles.answerText}>
            GasPH supports all common fuel types available in the Philippines:
          </Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.answerText}>Diesel</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.answerText}>Diesel Plus</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.answerText}>RON 91</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.answerText}>RON 95</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.answerText}>RON 97</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.answerText}>RON 100</Text>
          </View>
        </View>
      ),
    },
    {
      question: 'Why does GasPH need my location?',
      answer:
        "GasPH uses your location to find nearby gas stations and show you fuel prices in your vicinity. This helps you quickly find the best fuel prices closest to your current position. You can still use the app without granting location permission, but you'll see results centered around Metro Manila as a default location.",
    },
    {
      question: 'Can I filter prices by fuel type?',
      answer:
        'Yes! You can filter prices by your preferred fuel type using the filter options at the top of the Best Prices and Map screens. You can also set a default fuel type in your profile settings, which will be automatically applied when you open the app.',
    },
    {
      question: 'What does the confidence score mean?',
      answer:
        "The confidence score indicates how reliable a price report is likely to be. It's calculated based on the number of community confirmations and the recency of the report. Higher scores (displayed with green colors) indicate more reliable information, while lower scores (yellow or red) suggest the price may need verification.",
    },
    {
      question: 'What information is shown for each gas station?',
      answer:
        'For each gas station, GasPH displays the name, brand, address, fuel prices (community-reported and DOE reference prices when available), distance from your location, amenities (like convenience stores, restrooms, etc.), and operating hours when available.',
    },
    {
      question: 'Is there an offline mode?',
      answer:
        'Currently, GasPH requires an active internet connection to function properly. This ensures you always have access to the latest price data. We may consider adding limited offline functionality in future updates.',
    },
    {
      question: 'How can I contribute to GasPH beyond reporting prices?',
      answer: (
        <View>
          <Text style={styles.answerText}>
            There are several ways to contribute to the GasPH community:
          </Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.answerText}>
              Report accurate prices whenever you refuel
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.answerText}>
              Confirm existing price reports to increase their reliability
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.answerText}>
              Provide feedback on the app to help us improve
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.answerText}>
              Report any issues or incorrect station information
            </Text>
          </View>
        </View>
      ),
    },
    {
      question: 'How do I report a problem with the app?',
      answer:
        'If you encounter any issues with GasPH, please send an email to support@gasph.app with details about the problem, including what you were doing when it occurred, which screen you were on, and any error messages you received. Screenshots are also helpful.',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Frequently Asked Questions' }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <FontAwesome5
            name='question-circle'
            size={40}
            color={Colors.primary}
          />
          <Text style={styles.headerTitle}>How GasPH Works</Text>
          <Text style={styles.headerSubtitle}>
            Find answers to common questions about the app
          </Text>
        </View>

        <View style={styles.faqContainer}>
          {faqData.map((item, index) => (
            <FAQAccordionItem key={index} item={item} />
          ))}
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Still have questions?</Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Linking.openURL('mailto:support@gasph.app')}
          >
            <FontAwesome5
              name='envelope'
              size={16}
              color={Colors.white}
              style={styles.contactIcon}
            />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray2,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: Typography.fontSizeXLarge,
    fontWeight: Typography.fontWeightBold,
    color: Colors.darkGray,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSizeMedium,
    color: Colors.textGray,
    textAlign: 'center',
  },
  faqContainer: {
    marginBottom: Spacing.xl,
  },
  answerText: {
    fontSize: Typography.fontSizeMedium,
    color: Colors.textGray,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  bold: {
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.darkGray,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.xs,
  },
  bulletDot: {
    fontSize: Typography.fontSizeMedium,
    color: Colors.primary,
    marginRight: Spacing.xs,
    width: 15,
  },
  contactSection: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  contactTitle: {
    fontSize: Typography.fontSizeLarge,
    fontWeight: Typography.fontWeightMedium,
    color: Colors.darkGray,
    marginBottom: Spacing.lg,
  },
  contactButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  contactIcon: {
    marginRight: Spacing.sm,
  },
  contactButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSizeMedium,
    fontWeight: Typography.fontWeightSemiBold,
  },
});
