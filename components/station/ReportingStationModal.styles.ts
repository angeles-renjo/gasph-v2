import { StyleSheet } from 'react-native';
import { Platform } from 'react-native';
export const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white', // Or use theme color
    borderRadius: 15,
    padding: 25,
    alignItems: 'stretch', // Stretch items horizontally
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%', // Adjust width as needed
  },
  modalTitle: {
    marginBottom: 5,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  stationName: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
    color: 'grey', // Or use theme color
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    marginTop: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc', // Or use theme color
    borderRadius: 5,
    marginBottom: 15,
    // Height might be needed for Android picker display
    ...(Platform.OS === 'android' && { height: 50, justifyContent: 'center' }),
  },
  picker: {
    // iOS requires explicit height sometimes, Android uses container
    ...(Platform.OS === 'ios' && { height: 150 }),
  },
  pickerPlaceholder: {
    color: '#999', // Style for the placeholder item
  },
  commentInput: {
    minHeight: 80,
    textAlignVertical: 'top', // Align text to top for multiline
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Space out buttons
    marginTop: 15,
  },
  button: {
    flex: 1, // Make buttons share space
    marginHorizontal: 5, // Add some space between buttons
  },
});
