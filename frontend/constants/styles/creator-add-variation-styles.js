import { StyleSheet } from 'react-native';

export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f8f8' },
  container: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e8e8e8' },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },

  content: { flex: 1, paddingHorizontal: 16 },

  section: { marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 14 },

  formGroup: { marginBottom: 14 },
  formLabel: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 8 },
  formInput: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111', borderWidth: 1, borderColor: '#e8e8e8' },
  formRow: { flexDirection: 'row', gap: 12 },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#e8e8e8' },

  selectedSpecsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  specTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  specTagText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  addSpecButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addSpecBtn: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 10, paddingVertical: 12, borderWidth: 1.5, borderColor: '#ddd', gap: 6 },
  addSpecBtnActive: { backgroundColor: '#111', borderColor: '#111' },
  addSpecBtnText: { fontSize: 14, fontWeight: '600', color: '#111' },
  addSpecBtnTextActive: { color: '#fff' },

  summaryCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e8e8e8', overflow: 'hidden' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, fontWeight: '700', color: '#111' },

  footer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e8e8e8', gap: 12 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#111', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#111' },
  saveBtn: { flex: 1, backgroundColor: '#111', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e8e8e8' },
  modalCloseText: { fontSize: 15, fontWeight: '600', color: '#111' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  specList: { paddingHorizontal: 16, paddingVertical: 12 },
  optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e8e8e8' },
  optionItemSelected: { backgroundColor: '#f0f0f0', borderColor: '#111' },
  optionText: { fontSize: 15, color: '#333' },
  optionTextSelected: { fontWeight: '700', color: '#111' },
});
