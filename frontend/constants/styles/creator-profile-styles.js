import { StyleSheet } from 'react-native';

export const creatorProfileStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F1E8',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 34,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1E2C3A',
    marginTop: 0,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  banner: {
    height: 180,
    borderRadius: 26,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 14,
  },
  bannerImage: {
    borderRadius: 26,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30,44,58,0.42)',
  },
  bannerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF9F0',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLogo: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  brandName: {
    fontSize: 30,
    color: '#FFF9F0',
    fontWeight: '800',
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    gap: 8,
  },
  errorWrap: {
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3CEC7',
    backgroundColor: '#F9F2F0',
    padding: 10,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
  },
  retryButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1E2C3A',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF9F0',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#1E2C3A',
    letterSpacing: -0.2,
  },
  sectionBody: {
    color: '#6F5E4C',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 22,
    marginBottom: 8,
  },
  gridItem: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 14,
    color: '#3D4D61',
    fontWeight: '600',
    marginBottom: 2,
  },
  gridValue: {
    color: '#6F5E4C',
    fontSize: 14,
    lineHeight: 19,
  },
});
