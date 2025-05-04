import { StyleSheet } from 'react-native';
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2a9d8f',
    padding: 20,
    paddingTop: 30,
    paddingBottom: 30,
  },
  headerContent: {
    marginTop: 10,
  },
  stationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  stationBrand: {
    fontSize: 16,
    color: '#e6f7f5',
    marginBottom: 8,
  },
  stationAddress: {
    fontSize: 14,
    color: '#e6f7f5',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 8, // Add gap between buttons
  },
  actionButton: {
    flex: 1,
    // marginHorizontal: 4, // Remove horizontal margin if using gap
  },
  section: {
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#fff', // Add background to sections for better visual separation
    borderRadius: 8, // Optional: round corners
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  fuelTypeSection: {
    marginBottom: 16,
  },
  fuelTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    paddingLeft: 4, // Align with cards
  },
  emptyCard: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyCardButton: {
    marginTop: 8,
  },
  infoCard: {
    padding: 12, // Reduce padding slightly
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12, // Reduce margin slightly
    alignItems: 'flex-start', // Align items at the top
  },
  infoIcon: {
    width: 24, // Slightly smaller icon width
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2, // Align icon better with text
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2, // Reduce margin
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20, // Improve readability
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  amenityBadge: {
    backgroundColor: '#e6f7f5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 6,
    marginBottom: 6,
  },
  amenityText: {
    fontSize: 12,
    color: '#2a9d8f',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker overlay
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24, // More padding
    paddingBottom: 30, // More padding at bottom
    maxHeight: '85%', // Allow slightly more height
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20, // More margin
  },
  modalTitle: {
    fontSize: 22, // Larger title
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8, // Larger touch target
  },
  modalStationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16, // Reduced margin
    textAlign: 'center',
  },
  cycleInfoContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0', // Lighter background
  },
  cycleInfoLabel: {
    fontSize: 14,
    color: '#555', // Darker label
    marginBottom: 4,
    textAlign: 'center',
  },
  cycleInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 8, // Add margin top
  },
  fuelTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    justifyContent: 'center', // Center fuel types
  },
  fuelTypeOption: {
    paddingHorizontal: 14, // More padding
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#e9e9e9', // Lighter inactive background
    margin: 4, // Use margin for spacing
  },
  selectedFuelType: {
    backgroundColor: '#2a9d8f',
  },
  fuelTypeOptionText: {
    fontSize: 14,
    color: '#555',
  },
  selectedFuelTypeText: {
    color: '#fff',
    fontWeight: 'bold', // Bold selected
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24, // More margin top
    paddingTop: 16, // Add padding top
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 6, // Adjust spacing
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: -8, // Adjust to align nicely below the card
    marginBottom: 8,
  },
  viewAllButtonText: {
    fontSize: 13,
    color: '#2a9d8f',
    marginRight: 5,
    fontWeight: '500',
  },
});
