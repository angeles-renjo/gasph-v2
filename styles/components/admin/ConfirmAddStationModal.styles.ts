import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  keyboardAvoidingView: { flex: 1 },
  scrollViewContent: { flexGrow: 1, justifyContent: 'center' },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Keep backdrop semi-transparent
  },
  modalView: {
    margin: 20,
    // backgroundColor: Colors.white, // TODO: Use theme background
    borderRadius: 15,
    padding: 20,
    paddingTop: 25,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '90%',
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    // color: Colors.darkGray, // TODO: Use theme text
  },
  suggestionBox: {
    marginBottom: 15,
    padding: 10,
    // backgroundColor: Colors.lightGray, // TODO: Use theme secondary background
    borderRadius: 8,
    borderWidth: 1,
    // borderColor: Colors.lightGray, // TODO: Use theme border
  },
  suggestionTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    // color: Colors.darkGray, // TODO: Use theme text
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    // color: Colors.darkGray, // TODO: Use theme text
  },
  input: {
    marginBottom: 10,
    // Assuming Input component uses theme internally or add specific styles
  },
  jsonInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  column: {
    flex: 1,
    marginHorizontal: 5,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    justifyContent: 'flex-start',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 8,
    width: '45%',
  },
  checkbox: {
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    // color: Colors.darkGray, // TODO: Use theme text
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});
