import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { View as RNView } from 'react-native'; // Import View for useRef type
import theme from '@/styles/theme';
import type { FuelType } from '@/hooks/queries/prices/useBestPrices'; // Assuming FuelType is exported
import { formatFuelType } from '@/utils/formatters';

// Use the specific distance options type
type DistanceOption = 5 | 15 | 30;

interface FilterControlBubbleProps {
  selectedFuelType: FuelType | undefined;
  onFuelTypeSelect: (fuelType: FuelType | undefined) => void;
  fuelTypes: readonly FuelType[]; // Use readonly array if applicable

  selectedDistance: DistanceOption;
  onDistanceSelect: (distance: DistanceOption) => void;
  distanceOptions: readonly DistanceOption[]; // Use readonly array if applicable
}

type ActiveFilter = 'fuel' | 'distance' | null;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const FilterControlBubble: React.FC<FilterControlBubbleProps> = ({
  selectedFuelType,
  onFuelTypeSelect,
  fuelTypes,
  selectedDistance,
  onDistanceSelect,
  distanceOptions,
}) => {
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(null);
  const fuelTriggerRef = useRef<RNView>(null); // Use RNView or a suitable base type
  const distanceTriggerRef = useRef<RNView>(null); // Use RNView or a suitable base type
  const [triggerLayouts, setTriggerLayouts] = useState<{
    fuel: { x: number; y: number; width: number; height: number } | null;
    distance: { x: number; y: number; width: number; height: number } | null;
  }>({ fuel: null, distance: null });

  const handleTriggerPress = (
    filterType: 'fuel' | 'distance',
    ref: React.RefObject<RNView> // Match ref type
  ) => {
    // Add types to measure callback parameters
    ref.current?.measure(
      (
        _fx: number,
        _fy: number,
        width: number,
        height: number,
        px: number,
        py: number
      ) => {
        setTriggerLayouts((prev) => ({
          ...prev,
          [filterType]: { x: px, y: py, width, height },
        }));
        setActiveFilter((prev) => (prev === filterType ? null : filterType));
      }
    );
  };

  const handleSelect = (
    filterType: 'fuel' | 'distance',
    value: FuelType | DistanceOption | undefined
  ) => {
    if (filterType === 'fuel') {
      onFuelTypeSelect(value as FuelType | undefined);
    } else {
      onDistanceSelect(value as DistanceOption);
    }
    setActiveFilter(null);
  };

  const renderOptionsModal = () => {
    if (!activeFilter || !triggerLayouts[activeFilter]) return null;

    // Cast options to a type FlatList can handle
    const options: (string | number)[] =
      activeFilter === 'fuel'
        ? ['All Types', ...fuelTypes]
        : [...distanceOptions]; // Ensure distanceOptions is also an array if it's readonly
    const selectedValue =
      activeFilter === 'fuel' ? selectedFuelType : selectedDistance;
    const layout = triggerLayouts[activeFilter]!;

    // Position modal content BELOW the trigger
    const modalTop = layout.y + layout.height + 5; // Position below trigger + small gap
    const modalLeft = layout.x;
    const modalWidth = layout.width; // Or adjust as needed

    return (
      <Modal
        transparent={true}
        visible={!!activeFilter}
        onRequestClose={() => setActiveFilter(null)}
        animationType='fade' // Or 'slide' or 'none'
      >
        <TouchableWithoutFeedback onPress={() => setActiveFilter(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              {/* Prevent clicks inside the options list from closing the modal */}
              <View
                style={[
                  styles.optionsContainer,
                  {
                    position: 'absolute',
                    top: modalTop,
                    left: modalLeft,
                    width: modalWidth,
                    // transform: [{ translateY: -150 }], // REMOVE transform - no longer needed
                  },
                ]}
                onLayout={(event) => {
                  // Adjust vertical position after layout if needed, though tricky with Modal
                  const { height } = event.nativeEvent.layout;
                  // This might require more complex state management if we need to reposition after initial render
                }}
              >
                <FlatList
                  data={options}
                  keyExtractor={(item) => String(item)}
                  renderItem={({ item }: { item: string | number }) => {
                    // Add type for item
                    let displayItem: string;
                    if (activeFilter === 'fuel') {
                      if (item === 'All Types') {
                        displayItem = 'All Types';
                      } else {
                        displayItem = formatFuelType(item as FuelType);
                      }
                    } else {
                      displayItem = `${item} km`;
                    }

                    // Type-safe comparisons and value preparation
                    let isSelected = false;
                    let valueToPass: FuelType | DistanceOption | undefined;

                    if (activeFilter === 'fuel') {
                      // item should be string here (FuelType or 'All Types')
                      if (typeof item === 'string') {
                        const isAllTypes = item === 'All Types';
                        isSelected = isAllTypes
                          ? selectedValue === undefined // selectedValue is FuelType | undefined here
                          : selectedValue === item;
                        valueToPass = isAllTypes
                          ? undefined
                          : (item as FuelType); // Cast to FuelType
                      }
                    } else {
                      // item should be number here (DistanceOption: 5 | 15 | 30)
                      // selectedValue is DistanceOption (5 | 15 | 30) here
                      if (typeof item === 'number') {
                        // Ensure item is one of the allowed DistanceOption values before assigning
                        if (item === 5 || item === 15 || item === 30) {
                          isSelected = selectedValue === item;
                          valueToPass = item; // No need to cast if item is already checked
                        } else {
                          // Handle unexpected number case if necessary, maybe log an error
                          console.error('Unexpected distance option:', item);
                        }
                      }
                    }

                    return (
                      <TouchableOpacity
                        style={[
                          styles.optionItem,
                          isSelected && styles.selectedOptionItem,
                        ]}
                        onPress={() => {
                          // Ensure activeFilter is not null before calling
                          if (activeFilter) {
                            handleSelect(activeFilter, valueToPass);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.selectedOptionText,
                          ]}
                        >
                          {displayItem}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                  style={styles.optionsList}
                  contentContainerStyle={{ paddingBottom: 5 }} // Ensure last item isn't cut off
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  return (
    <>
      <View style={styles.bubbleContainer}>
        {/* Fuel Type Trigger */}
        <TouchableOpacity
          ref={fuelTriggerRef}
          style={styles.triggerButton}
          onPress={() => handleTriggerPress('fuel', fuelTriggerRef)}
          onLayout={() => {
            // Measure initially
            fuelTriggerRef.current?.measure(
              // Add types to measure callback parameters
              (
                _fx: number,
                _fy: number,
                width: number,
                height: number,
                px: number,
                py: number
              ) => {
                if (!triggerLayouts.fuel) {
                  // Only set initial layout
                  setTriggerLayouts((prev) => ({
                    ...prev,
                    fuel: { x: px, y: py, width, height },
                  }));
                }
              }
            );
          }}
        >
          <FontAwesome5
            name='gas-pump'
            size={14}
            color={theme.Colors.primary}
          />
          <Text style={styles.triggerText} numberOfLines={1}>
            {selectedFuelType ? formatFuelType(selectedFuelType) : 'All Types'}
          </Text>
          <FontAwesome5
            name='chevron-down'
            size={12}
            color={theme.Colors.textGray}
          />
        </TouchableOpacity>

        {/* Distance Trigger */}
        <TouchableOpacity
          ref={distanceTriggerRef}
          style={styles.triggerButton}
          onPress={() => handleTriggerPress('distance', distanceTriggerRef)}
          onLayout={() => {
            // Measure initially
            distanceTriggerRef.current?.measure(
              // Add types to measure callback parameters
              (
                _fx: number,
                _fy: number,
                width: number,
                height: number,
                px: number,
                py: number
              ) => {
                if (!triggerLayouts.distance) {
                  // Only set initial layout
                  setTriggerLayouts((prev) => ({
                    ...prev,
                    distance: { x: px, y: py, width, height },
                  }));
                }
              }
            );
          }}
        >
          <FontAwesome5 name='route' size={14} color={theme.Colors.primary} />
          <Text style={styles.triggerText} numberOfLines={1}>
            {selectedDistance} km
          </Text>
          <FontAwesome5
            name='chevron-down'
            size={12}
            color={theme.Colors.textGray}
          />
        </TouchableOpacity>
      </View>
      {renderOptionsModal()}
    </>
  );
};

const styles = StyleSheet.create({
  bubbleContainer: {
    // Removed absolute positioning: position, top, left, right, zIndex
    flexDirection: 'row',
    justifyContent: 'space-around', // Or 'space-between'
    alignItems: 'center',
    backgroundColor: theme.Colors.white, // Keep background
    borderRadius: theme.BorderRadius.round, // Keep pill shape
    paddingVertical: theme.Spacing.sm,
    paddingHorizontal: theme.Spacing.md,
    marginHorizontal: theme.Spacing.xl, // Add horizontal margin to constrain width
    marginTop: theme.Spacing.md, // Add margin top
    marginBottom: theme.Spacing.lg, // Add margin bottom for spacing
    // Removed floating effect: shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation
    borderWidth: 1, // Add a border instead of shadow
    borderColor: theme.Colors.dividerGray, // Use a light border color
  },
  triggerButton: {
    flex: 1, // Take up equal space
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.Spacing.xs,
    paddingHorizontal: theme.Spacing.sm,
    marginHorizontal: theme.Spacing.xs, // Add some space between buttons
    borderRadius: theme.BorderRadius.lg, // Slightly rounded inside the pill
    // backgroundColor: theme.Colors.lightGray, // Optional subtle background
  },
  triggerText: {
    fontSize: theme.Typography.fontSizeSmall,
    fontWeight: theme.Typography.fontWeightMedium,
    color: theme.Colors.darkGray,
    marginHorizontal: theme.Spacing.sm,
    flexShrink: 1, // Allow text to shrink if needed
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Subtle dimming
    // justifyContent: 'flex-end', // Align options container
  },
  optionsContainer: {
    // Removed positioning from here, applied dynamically
    maxHeight: 150, // Limit height
    backgroundColor: theme.Colors.white,
    borderRadius: theme.BorderRadius.md,
    // padding: theme.Spacing.xs,
    shadowColor: theme.Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden', // Ensures rounded corners clip content
  },
  optionsList: {
    // Styles for the FlatList itself if needed
  },
  optionItem: {
    paddingVertical: theme.Spacing.md,
    paddingHorizontal: theme.Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.dividerGray,
  },
  selectedOptionItem: {
    backgroundColor: theme.Colors.primaryLightTint,
  },
  optionText: {
    fontSize: theme.Typography.fontSizeMedium,
    color: theme.Colors.darkGray,
  },
  selectedOptionText: {
    color: theme.Colors.primary,
    fontWeight: theme.Typography.fontWeightBold,
  },
});
