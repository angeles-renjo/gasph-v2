import { Colors } from '@/styles/theme';
import { StyleSheet } from 'react-native';

// Note: Styles using dynamic colors (based on colorScheme) will need
// to be applied inline in the component or handled via a theme context/hook.
// These are the static styles. Dynamic ones are marked with TODO.

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  reportCard: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    // backgroundColor: '#fff', // TODO: Use theme background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    // color: '#666', // TODO: Use theme text color
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    // borderBottomColor: '#eee', // TODO: Use theme border color
    paddingBottom: 8,
  },
  reportType: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.primary,
  },
  reportDate: {
    fontSize: 12,
    color: Colors.secondary,
  },
  userInfo: {
    fontSize: 13,
    color: Colors.secondary,
    marginBottom: 10,
  },
  detailLabel: {
    fontWeight: '600',
    fontSize: 14,
    // color: '#444', // TODO: Use theme text color
    marginTop: 8,
  },
  detailValue: {
    fontSize: 14,
    // color: '#222', // TODO: Use theme text color
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align buttons to the right
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  actionButton: {
    marginLeft: 10, // Add space between buttons
    minWidth: 80, // Ensure buttons have a minimum width
  },
});
