import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 40 },

  headerBg: { height: 260, justifyContent: 'flex-end' },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backBtn: {
    position: 'absolute', top: 16, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  backText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  heroBottom: { padding: 18, paddingBottom: 20 },
  heroTitle: {
    fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8,
  },
  heroBrandRow: { flexDirection: 'row', alignItems: 'center' },
  heroBrandCollection: { color: '#ddd', fontSize: 14, fontWeight: '500' },
  heroDivider: { color: '#aaa', fontSize: 14 },
  brandCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#e87722',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 5,
  },
  brandCircleText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  heroBrandName: { color: '#fff', fontSize: 14, fontWeight: '600' },

  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#555',
  },
  errorWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#b91c1c',
    textAlign: 'center',
  },
  errorSubText: {
    fontSize: 11,
    color: '#777',
    marginTop: 4,
    textAlign: 'center',
  },

  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 10 },
  bodyText: { fontSize: 15, color: '#333', lineHeight: 23 },

  pillRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  specPill: {
    backgroundColor: '#111', borderRadius: 30,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  emptyText: {
    color: '#777',
    fontSize: 12,
    fontStyle: 'italic',
  },
  specPillText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  specPillLabel: { fontWeight: '700' },

  polIcon: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#7b5ea7',
    justifyContent: 'center', alignItems: 'center',
  },
  polIconText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  table: {
    backgroundColor: '#f2f2f2',
    borderRadius: 14,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  purchaseRowsScroll: {
    maxHeight: 320,
  },
  tableHeader: { marginBottom: 4 },
  tableHeaderText: { fontWeight: '700', fontStyle: 'italic', fontSize: 14, color: '#222' },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f2f2f2',
    paddingVertical: 12, paddingHorizontal: 4,
  },
  tableRowBorder: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 4,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  tableCell: { flex: 1, fontSize: 13, color: '#333' },
  tableIdCell: { flexShrink: 1, paddingRight: 4 },
  tablePriceCell: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tablePriceLabel: { fontSize: 13, fontWeight: '700', color: '#111' },
  tablePriceAmount: { fontSize: 13, color: '#333' },
  emptyTableText: {
    paddingVertical: 10,
    textAlign: 'center',
    color: '#777',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
