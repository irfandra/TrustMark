import { StyleSheet } from 'react-native';

export const createCreatorEditCollectionStyles = ({ isTablet }) => {
  const styles = StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: '#F6F1E8',
    },
    content: {
      paddingHorizontal: isTablet ? 40 : 20,
      paddingTop: 18,
      paddingBottom: 48,
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    backText: {
      fontSize: 15,
      color: '#111',
      marginLeft: 2,
    },
    title: {
      fontSize: isTablet ? 36 : 30,
      fontWeight: '800',
      color: '#1E2C3A',
      marginBottom: 18,
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: '#6F5E4C',
      marginBottom: 8,
      marginTop: 4,
    },
    input: {
      borderWidth: 1,
      borderColor: '#D6C8B5',
      backgroundColor: '#FFF9F0',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: '#1E2C3A',
      marginBottom: 12,
    },
    rowWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
    },
    pillButton: {
      borderWidth: 1,
      borderColor: '#D6C8B5',
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: '#FFF9F0',
    },
    pillButtonActive: {
      backgroundColor: '#1E2C3A',
      borderColor: '#1E2C3A',
    },
    pillText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#1E2C3A',
    },
    pillTextActive: {
      color: '#FFF9F0',
    },
    helperText: {
      fontSize: 12,
      color: '#8A7C6A',
      marginBottom: 12,
    },
    saveButton: {
      marginTop: 8,
      backgroundColor: '#1E2C3A',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.7,
    },
    saveButtonText: {
      color: '#FFF9F0',
      fontSize: 14,
      fontWeight: '800',
    },
  });

  return styles;
};
