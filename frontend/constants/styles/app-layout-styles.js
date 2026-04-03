import { StyleSheet } from 'react-native';

export const createAppLayoutStyles = ({ isTablet, Fonts }) => {
  const styles = StyleSheet.create({
    safeArea: {
      backgroundColor: '#F6F1E8',
      paddingBottom: 0,
    },
    container: {
      backgroundColor: '#F6F1E8',
      borderBottomWidth: 1,
      borderBottomColor: '#E4D9C9',
    },
    content: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
      gap: 10,
    },
    brandMark: {
      width: isTablet ? 18 : 14,
      height: isTablet ? 18 : 14,
      borderRadius: 999,
      backgroundColor: '#D95F47',
      borderWidth: 2,
      borderColor: '#1E2C3A',
    },
    logo: {
      fontSize: isTablet ? 34 : 30,
      fontFamily: Fonts.serif,
      fontWeight: '700',
      letterSpacing: 0.4,
      color: '#1E2C3A',
    },
  });

  return styles;
};
