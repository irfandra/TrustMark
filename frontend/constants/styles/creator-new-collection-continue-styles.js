import { StyleSheet } from 'react-native';

export const createCreatorNewCollectionContinueStyles = ({ palette, isTablet }) => {
  const s = StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: palette.background,
    },
    contentRoot: {
      flex: 1,
      backgroundColor: palette.background,
    },
    scrollContent: {
      paddingHorizontal: isTablet ? 40 : 22,
      paddingTop: isTablet ? 56 : 42,
      paddingBottom: 56,
    },
  
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: '#EFE6D9',
    },
    backText: {
      fontSize: 15,
      color: palette.text,
      marginLeft: 4,
      fontWeight: '600',
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
      fontWeight: '900',
      letterSpacing: 1,
      color: palette.text,
      marginBottom: 16,
    },
  
    pageTitle: {
      fontSize: isTablet ? 32 : 26,
      fontWeight: '800',
      color: palette.text,
      marginBottom: 8,
    },
    pageSubtitle: {
      fontSize: 14,
      color: palette.muted,
      lineHeight: 20,
    },
  
    summaryCard: {
      backgroundColor: palette.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: isTablet ? 24 : 18,
      paddingVertical: isTablet ? 20 : 16,
      marginBottom: 14,
    },
  
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    summaryInfoWrap: {
      flex: 1,
      marginRight: 12,
    },
    summaryName: {
      fontSize: 16,
      fontWeight: '800',
      color: palette.text,
    },
    summaryCategory: {
      fontSize: 13,
      color: palette.text,
      marginTop: 2,
    },
    summaryItems: {
      fontSize: 13,
      color: palette.muted,
      marginTop: 2,
    },
    newVariationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.accent,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 6,
    },
    newVariationText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
  
    columnLabels: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    columnLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: palette.text,
    },
    actionHeaderSpacer: {
      width: 88,
    },
  
    emptyWrap: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginBottom: 8,
      backgroundColor: palette.field,
    },
    emptyText: {
      fontSize: 13,
      color: palette.muted,
    },
  
    variationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.border,
      paddingVertical: 18,
      paddingHorizontal: 12,
    },
    variationName: {
      flex: 1,
      fontSize: 13,
      color: palette.text,
      fontWeight: '500',
      paddingRight: 8,
    },
    variationPrice: {
      flex: 1,
      fontSize: 13,
      color: palette.text,
      paddingRight: 8,
    },
    variationQty: {
      flex: 1,
      fontSize: 13,
      color: palette.text,
      paddingRight: 8,
    },
    editButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: palette.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.field,
    },
    separator: {
      height: 10,
    },
    deleteButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: palette.danger,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 6,
    },
  
    bottomBar: {
      paddingHorizontal: isTablet ? 40 : 22,
      paddingVertical: 16,
      backgroundColor: palette.background,
      borderTopWidth: 1,
      borderTopColor: palette.border,
    },
    bottomActionRow: {
      flexDirection: 'row',
      gap: 12,
    },
    draftButton: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: palette.accent,
      backgroundColor: palette.surface,
    },
    publishButton: {
      flex: 1,
      backgroundColor: palette.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#1E2C3A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 14,
      elevation: 3,
    },
    actionButtonDisabled: {
      opacity: 0.5,
    },
    draftButtonText: {
      color: palette.accent,
      fontSize: 16,
      fontWeight: '700',
    },
    publishButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
  
    modalSafe: { flex: 1, backgroundColor: palette.background },
    modalContainer: { flex: 1 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.border, backgroundColor: palette.surface },
    modalCloseText: { fontSize: 15, fontWeight: '600', color: palette.text },
    modalTitle: { fontSize: 18, fontWeight: '700', color: palette.text },
    modalContent: { flex: 1, paddingHorizontal: 16, paddingVertical: 16, backgroundColor: palette.surface },
    formGroup: { marginBottom: 18 },
    formLabel: { fontSize: 14, fontWeight: '700', color: palette.text, marginBottom: 8 },
    formInput: { backgroundColor: palette.field, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: palette.text, borderWidth: 1, borderColor: palette.border },
    errorText: { marginTop: 6, fontSize: 12, color: palette.danger },
    formRow: { flexDirection: 'row', gap: 12 },
    modalFooter: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border, gap: 12 },
    modalCancelBtn: { flex: 1, borderWidth: 1.5, borderColor: palette.accent, borderRadius: 10, paddingVertical: 14, alignItems: 'center', backgroundColor: '#FFFFFF' },
    modalCancelBtnText: { fontSize: 15, fontWeight: '700', color: palette.accent },
    modalSaveBtn: { flex: 1, backgroundColor: palette.accent, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    modalSaveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  });

  return s;
};
