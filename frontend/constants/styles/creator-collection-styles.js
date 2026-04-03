import { StyleSheet } from 'react-native';
import { createFilterTabsStyles } from './filter-tabs-styles';

export const createCreatorCollectionFilterTabsStyle = (options = {}) =>
  createFilterTabsStyles(options);

export const createCreatorCollectionStyles = ({ isTablet, tabBarHeight } = {}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      position: 'relative',
      backgroundColor: '#F6F1E8',
    },
    scrollContent: {
      flex: 1,
      paddingHorizontal: isTablet ? 32 : 16,
      paddingTop: isTablet ? 12 : 8,
      paddingBottom: isTablet ? 160 : 140,
      backgroundColor: '#F6F1E8',
    },
    listContainer: {
      flexGrow: 1,
      paddingHorizontal: isTablet ? 32 : 16,
      paddingTop: 60,
      paddingBottom: isTablet ? 100 : 80,
    },
    title: {
      fontSize: isTablet ? 36 : 28,
      marginTop: 0,
      fontWeight: '600',
      marginBottom: 8,
      color: '#1A2640',
    },
    loadingWrap: {
      paddingVertical: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 14,
      color: '#333',
    },
    errorWrap: {
      paddingVertical: 18,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    errorText: {
      fontSize: 13,
      color: '#b91c1c',
      textAlign: 'center',
    },
    retryBtn: {
      backgroundColor: '#5C57E8',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    retryBtnText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    emptyWrap: {
      paddingVertical: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyCollectionsText: {
      fontSize: 13,
      color: '#6C7891',
    },
    accordionContainer: {
      marginBottom: 12,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#CED5E4',
      backgroundColor: '#F6F1E8',
      shadowColor: '#1A2640',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
      elevation: 4,
    },
    accordionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#F6F1E8',
      paddingHorizontal: 16,
      paddingVertical: 13,
    },
    accordionHeaderLeft: {
      flex: 1,
      gap: 2,
    },
    accordionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    accordionStatusDot: {
      width: 10,
      height: 10,
      borderRadius: 99,
    },
    accordionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#1A2640',
    },
    accordionCount: {
      fontSize: 11,
      color: '#6B7892',
      marginLeft: 18,
      fontWeight: '600',
    },
    accordionChevronWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#CAD2E2',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff',
    },
    accordionContent: {
      backgroundColor: '#F6F1E8',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: '#D6DDEB',
    },
    accordionEmptyText: {
      fontSize: 13,
      color: '#6C7891',
      textAlign: 'center',
      paddingVertical: 8,
    },
    listStack: {
      gap: 12,
    },
    collectionCardWrapper: {
      width: '100%',
      minHeight: isTablet ? 146 : 132,
    },
    newCollectionButton: {
      bottom: (tabBarHeight || 0) + (isTablet ? 30 : 22),
      position: 'absolute',
      left: 5,
      right: 5,
      backgroundColor: '#1E2C3A',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#1E2C3A',
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
      zIndex: 50,
    },
    newCollectionButtonText: {
      color: '#FFF9F0',
      fontWeight: '800',
      fontSize: 12,
    },
  });
