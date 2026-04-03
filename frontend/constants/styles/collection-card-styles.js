import { StyleSheet } from 'react-native';

export const createCollectionCardStyles = ({ Fonts }) =>
  StyleSheet.create({
    wrapper: {
      borderRadius: 24,
      shadowColor: '#1A2640',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.14,
      shadowRadius: 18,
      elevation: 5,
    },
    card: {
      flexDirection: 'row',
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: '#F6F1E8',
      borderWidth: 1,
      borderColor: '#D4D9E6',
    },
    mediaWrap: {
      width: 112,
      minHeight: 126,
      padding: 10,
      backgroundColor: '#F6F1E8',
    },
    mediaImage: {
      flex: 1,
      borderRadius: 16,
    },
    tagBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
    },
    tagText: {
      fontWeight: '800',
      fontSize: 10,
      letterSpacing: 0.3,
    },
    body: {
      flex: 1,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 12,
      gap: 7,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    brandLogo: {
      width: 18,
      height: 18,
      borderRadius: 4,
    },
    brandFallback: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#eeeeee',
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandFallbackText: {
      color: '#F4F6FB',
      fontSize: 9,
      fontWeight: '800',
    },
    brandName: {
      fontSize: 11,
      fontWeight: '700',
      color: '#4A5672',
      flex: 1,
    },
    collectionName: {
      fontSize: 18,
      fontFamily: Fonts.serif,
      fontWeight: '700',
      color: '#1A2438',
      flex: 1,
    },
    categoryText: {
      fontSize: 12,
      color: '#818DA4',
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    infoText: {
      fontSize: 11,
      color: '#57617A',
      fontWeight: '700',
    },
    infoDot: {
      fontSize: 12,
      color: '#7C85A0',
      fontWeight: '800',
    },
    floorRow: {
      marginTop: 2,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    floorLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: '#5F6A84',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    floorAmountText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#000000',
    },
  });
