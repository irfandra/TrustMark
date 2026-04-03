import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";

export default function CollapsibleAccordion({
  isOpen,
  onToggle,
  headerContent,
  children,
  containerStyle,
  headerStyle,
  contentStyle,
  chevronWrapStyle,
  chevronColor = "#000000",
  chevronSize = 18,
  activeOpacity = 0.8,
}) {
  return (
    <View style={containerStyle}>
      <TouchableOpacity style={headerStyle} activeOpacity={activeOpacity} onPress={onToggle}>
        {headerContent}
        <View style={chevronWrapStyle}>
          <Ionicons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={chevronSize}
            color={chevronColor}
          />
        </View>
      </TouchableOpacity>

      {isOpen && <View style={contentStyle}>{children}</View>}
    </View>
  );
}