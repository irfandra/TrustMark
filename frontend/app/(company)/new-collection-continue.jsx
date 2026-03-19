import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 768;

const INITIAL_VARIATIONS = [
  { id: "1", name: "Birkin Brownies", price: 120000, qty: 1000 },
  { id: "2", name: "Birkin Bluish", price: 110000, qty: 500 },
];

export default function NewCollectionContinue() {
  // Remove navigation header
  NewCollectionContinue.navigationOptions = { headerShown: false };
  const [variations, setVariations] = useState(INITIAL_VARIATIONS);
  const router = useRouter();

  function handleEdit(id) {
    alert(`Edit variation ${id}`);
  }
  function handleDelete(id) {
    setVariations((prev) => prev.filter((v) => v.id !== id));
  }

  function handleNewVariation() {
    router.push({
      pathname: "/(company)/add-variation",
      params: {
        onAdd: (variation) => {
          setVariations((prev) => [...prev, variation]);
        },
      },
    });
  }

  // ...existing code...

  function handleComplete() {
    alert("Collection complete!");
  }

  // Header above the list
  const ListHeader = () => (
    <>
      {/* Back */}
      <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={18} color="#111" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Logo */}
      <Text style={styles.logo}>ZEAL</Text>

      {/* Step indicator */}
      <View style={styles.stepRow}>
        {/* Step 1 — inactive */}
        <View style={styles.stepInactive}>
          <Text style={styles.stepInactiveNumber}>1</Text>
        </View>
        <View style={styles.stepInactiveTextWrap}>
          <Text style={styles.stepInactiveLabel}>Setup</Text>
          <Text style={styles.stepInactiveLabel}>Collections</Text>
        </View>

        {/* Step 2 — active */}
        <View style={styles.stepActive}>
          <Text style={styles.stepActiveNumber}>2</Text>
        </View>
        <View style={styles.stepActiveTextWrap}>
          <Text style={styles.stepActiveLabel}>Setup</Text>
          <Text style={styles.stepActiveLabel}>Variations</Text>
        </View>
      </View>

      {/* Page title */}
      <Text style={styles.pageTitle}>Setup Variations</Text>

      {/* Collection summary + New Variation button */}
      <View style={styles.summaryRow}>
        <View>
          <Text style={styles.summaryName}>Birkin Collections</Text>
          <Text style={styles.summaryCategory}>Luxury Bags</Text>
          <Text style={styles.summaryItems}>4,000 / 1,500 Items</Text>
        </View>
        <TouchableOpacity
          style={styles.newVariationButton}
          onPress={handleNewVariation}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.newVariationText}>New Variation</Text>
        </TouchableOpacity>
      </View>

      {/* Column labels */}
      {/* Column labels — add space for both buttons */}
      <View style={styles.columnLabels}>
        <Text style={[styles.columnLabel, { flex: 1, marginLeft: 8 }]}>
          Items
        </Text>
        <Text style={[styles.columnLabel, { flex: 1 }]}>Price</Text>
        <Text style={[styles.columnLabel, { flex: 1 }]}>Qty</Text>
        <View style={{ width: 88 }} /> {/* wider to fit 2 buttons */}
      </View>
    </>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={variations}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <View style={styles.variationRow}>
            <Text style={styles.variationName}>{item.name}</Text>
            <Text style={styles.variationPrice}>
              POL {item.price.toLocaleString()}
            </Text>
            <Text style={styles.variationQty}>
              {item.qty.toLocaleString()} Items
            </Text>

            {/* Edit */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEdit(item.id)}
            >
              <Ionicons name="create-outline" size={18} color="#111" />
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Complete button — sticky at bottom */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleComplete}
        >
          <Text style={styles.completeButtonText}>Complete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingHorizontal: isTablet ? 40 : 22,
    paddingTop: 56,
    paddingBottom: 40,
  },

  // Back
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backText: {
    fontSize: 15,
    color: "#111",
    marginLeft: 2,
  },

  // Logo
  logo: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 20,
  },

  // Steps
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
    gap: 10,
  },
  stepActive: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  stepActiveNumber: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  stepActiveTextWrap: {},
  stepActiveLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
    lineHeight: 17,
  },
  stepInactive: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  stepInactiveNumber: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  stepInactiveTextWrap: {
    marginRight: 20,
  },
  stepInactiveLabel: {
    fontSize: 13,
    color: "#aaa",
    lineHeight: 17,
  },

  // Page title
  pageTitle: {
    fontSize: isTablet ? 32 : 26,
    fontWeight: "800",
    color: "#111",
    marginBottom: 20,
  },

  // Summary row
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  summaryName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
  },
  summaryCategory: {
    fontSize: 13,
    color: "#333",
    marginTop: 2,
  },
  summaryItems: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },
  newVariationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  newVariationText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Column labels
  columnLabels: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  columnLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
  },

  // Variation rows
  variationRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  variationName: {
    flex: 1,
    fontSize: 13,
    fontStyle: "italic",
    color: "#111",
    fontWeight: "500",
  },
  variationPrice: {
    flex: 1,
    fontSize: 13,
    color: "#111",
  },
  variationQty: {
    flex: 1,
    fontSize: 13,
    color: "#111",
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  separator: {
    height: 10,
  },

  // Bottom sticky bar
  bottomBar: {
    paddingHorizontal: isTablet ? 40 : 22,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  completeButton: {
    backgroundColor: "#000",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  completeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  deleteButton: {
  width: 36,
  height: 36,
  borderRadius: 8,
  backgroundColor: "#cc0000",
  alignItems: "center",
  justifyContent: "center",
  marginLeft: 6,
},

});
