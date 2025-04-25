import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/styles/theme';

// FAQ Item interface
export interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

interface FAQAccordionItemProps {
  item: FAQItem;
}

// Collapsible FAQ Item Component
const FAQAccordionItem = ({ item }: FAQAccordionItemProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.faqItem}>
      <TouchableOpacity
        style={styles.questionContainer}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.questionText}>{item.question}</Text>
        <FontAwesome5
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={Colors.textGray}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.answerContainer}>
          {typeof item.answer === 'string' ? (
            <Text style={styles.answerText}>{item.answer}</Text>
          ) : (
            item.answer
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  faqItem: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  questionText: {
    fontSize: Typography.fontSizeMedium,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.darkGray,
    flex: 1,
    marginRight: Spacing.md,
  },
  answerContainer: {
    padding: Spacing.lg,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.dividerGray,
  },
  answerText: {
    fontSize: Typography.fontSizeMedium,
    color: Colors.textGray,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
});

export default FAQAccordionItem;
