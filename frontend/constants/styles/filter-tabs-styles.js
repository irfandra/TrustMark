export const createFilterTabsStyles = ({ isTablet, fill = false } = {}) => ({
  tabsWrap: {
    marginTop: 12,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    gap: 6,
    ...(fill ? null : { paddingRight: 6, alignSelf: 'flex-start' }),
  },
  tabButton: {
    ...(fill ? { flex: 1 } : { minWidth: isTablet ? 130 : 102 }),
    paddingVertical: 10,
    paddingHorizontal: fill ? 8 : 16,
    borderWidth: 1,
    borderColor: '#D6C8B5',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF9F0',
  },
  activeTab: {
    backgroundColor: '#1E2C3A',
    borderColor: '#1E2C3A',
  },
  tabText: {
    fontSize: isTablet ? 13 : 11,
    color: '#5D6674',
    fontWeight: '600',
  },
  activeText: {
    color: '#FFF9F0',
    fontWeight: '700',
  },
});