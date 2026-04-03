import { StyleSheet } from 'react-native';

export const createCreatorNewCollectionStyles = ({ palette, isTablet }) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    scrollContent: {
      paddingHorizontal: isTablet ? 40 : 22,
      paddingTop: isTablet ? 56 : 42,
      paddingBottom: 56,
    },
  
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 14,
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: "#EFE6D9",
    },
    backText: {
      fontSize: 15,
      color: palette.text,
      marginLeft: 4,
      fontWeight: "600",
    },
  
    headerCard: {
      backgroundColor: palette.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: isTablet ? 24 : 18,
      paddingVertical: isTablet ? 24 : 18,
      marginBottom: 16,
    },
  
    logo: {
      fontSize: 28,
      fontWeight: "900",
      letterSpacing: 1,
      color: palette.text,
      marginBottom: 16,
    },
  
    pageTitle: {
      fontSize: isTablet ? 32 : 26,
      fontWeight: "800",
      color: palette.text,
      marginBottom: 8,
    },
    pageSubtitle: {
      fontSize: 14,
      color: palette.muted,
      lineHeight: 20,
    },
  
    formCard: {
      backgroundColor: palette.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: isTablet ? 24 : 18,
      paddingVertical: isTablet ? 24 : 18,
      marginBottom: 16,
    },
    fieldGroup: {
      marginBottom: 14,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: palette.text,
      marginBottom: 8,
    },
  
    input: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 14,
      color: palette.text,
      marginBottom: 0,
      backgroundColor: palette.field,
    },
    textArea: {
      height: 120,
      paddingTop: 14,
    },
    errorText: {
      marginTop: 6,
      marginBottom: 0,
      fontSize: 12,
      color: '#B91C1C',
    },
    autoInfoText: {
      marginTop: 4,
      fontSize: 12,
      color: palette.muted,
      lineHeight: 18,
    },
  
    continueButton: {
      backgroundColor: palette.accent,
      borderRadius: 14,
      paddingVertical: 18,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#1E2C3A",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 14,
      elevation: 3,
    },
    continueButtonText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "700",
    },
  });

  return styles;
};
