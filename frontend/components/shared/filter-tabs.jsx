import { Text, TouchableOpacity, View } from "react-native";
import { createFilterTabsStyles } from "@/constants/styles/filter-tabs-styles";

function getTabValue(tab) {
  if (typeof tab === "string") {
    return tab;
  }

  return tab?.value ?? tab?.label ?? "";
}

function getTabLabel(tab) {
  if (typeof tab === "string") {
    return tab;
  }

  return tab?.label ?? tab?.value ?? "";
}

export default function FilterTabs({
  tabs,
  activeTab,
  onTabChange,
  isTablet = false,
  fill = false,
  numberOfLines = 1,
}) {
  const styles = createFilterTabsStyles({ isTablet, fill });

  return (
    <View style={styles.tabsWrap}>
      <View style={styles.tabs}>
        {tabs.map((tab) => {
          const value = getTabValue(tab);
          const label = getTabLabel(tab);
          const isActive = activeTab === value;

          return (
            <TouchableOpacity
              key={value}
              style={[styles.tabButton, isActive && styles.activeTab]}
              onPress={() => onTabChange(value)}
            >
              <Text numberOfLines={numberOfLines} style={[styles.tabText, isActive && styles.activeText]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}