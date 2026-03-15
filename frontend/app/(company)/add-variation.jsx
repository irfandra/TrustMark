import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 768;

const TOTAL_ITEMS = 4000;

export default function AddVariation() {
  const router = useRouter();

  const [variationName, setVariationName] = useState("");
  const [description, setDescription] = useState("");
  const [numberOfItems, setNumberOfItems] = useState("");
  const [price, setPrice] = useState("");
  const [specifications, setSpecifications] = useState([
    { id: "1", aspect: "Straps Color", detail: "Gold" },
  ]);

  function handleAddSpecification() {
    setSpecifications((prev) => [
      ...prev,
      { id: Date.now().toString(), aspect: "", detail: "" },
    ]);
  }

  function handleSpecChange(id, field, value) {
    setSpecifications((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  }
  function handleDeleteSpecification(id) {
    setSpecifications((prev) => prev.filter((s) => s.id !== id));
  }

  function handleCreateVariation() {
    if (!variationName || !numberOfItems || !price) {
      alert("Please fill all required fields");
      return;
    }
    // TODO: pass data back via context/state
    router.back();
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color="#111" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Page title */}
        <Text style={styles.pageTitle}>Create New Variation</Text>

        {/* Section: Variation Detail */}
        <Text style={styles.sectionLabel}>Variation Detail*</Text>

        {/* Variation Name */}
        <TextInput
          style={styles.input}
          placeholder="Variation Name"
          placeholderTextColor="#888"
          fontStyle="italic"
          value={variationName}
          onChangeText={setVariationName}
        />

        {/* Description */}
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          placeholderTextColor="#888"
          fontStyle="italic"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Product Banner Image */}
        <TouchableOpacity style={styles.imagePicker}>
          <Text style={styles.imagePickerLabel}>Product Banner Image</Text>
          <Ionicons
            name="image-outline"
            size={36}
            color="#bbb"
            style={{ marginTop: 8 }}
          />
        </TouchableOpacity>

        {/* Number of Items */}
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, styles.inputRowFlex]}
            placeholder="Number Of Items"
            placeholderTextColor="#888"
            fontStyle="italic"
            keyboardType="numeric"
            value={numberOfItems}
            onChangeText={setNumberOfItems}
          />
          <Text style={styles.inputRowSuffix}>
            of {TOTAL_ITEMS.toLocaleString()} Items
          </Text>
        </View>

        {/* Price */}
        <TextInput
          style={styles.input}
          placeholder="Price"
          placeholderTextColor="#888"
          fontStyle="italic"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        {/* Specification section */}
        <View style={styles.specHeaderRow}>
          <Text style={styles.sectionLabel}>Specification*</Text>
          <TouchableOpacity
            style={styles.newSpecButton}
            onPress={handleAddSpecification}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.newSpecButtonText}>New Specification</Text>
          </TouchableOpacity>
        </View>

        {/* Spec column labels */}
        <View style={styles.specColumnLabels}>
          <Text style={[styles.specColumnLabel, { flex: 1 }]}>
            Aspect{"\n"}(Material,Color, Accessories)
          </Text>
          <Text style={styles.specColumnLabel}>Details</Text>
        </View>

        {/* Spec rows */}
        <View style={styles.specContainer}>
          {specifications.map((spec) => (
            <View key={spec.id} style={styles.specRow}>
              <TextInput
                style={[styles.specInput, { flex: 1, marginRight: 8 }]}
                placeholder="e.g. Straps Color"
                placeholderTextColor="#aaa"
                value={spec.aspect}
                onChangeText={(v) => handleSpecChange(spec.id, "aspect", v)}
              />
              <TextInput
                style={[styles.specInput, { flex: 1, marginRight: 8 }]}
                placeholder="e.g. Gold"
                placeholderTextColor="#aaa"
                value={spec.detail}
                onChangeText={(v) => handleSpecChange(spec.id, "detail", v)}
              />
              <TouchableOpacity
                style={styles.deleteSpecButton}
                onPress={() => handleDeleteSpecification(spec.id)}
              >
                <Ionicons name="trash-outline" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky bottom button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateVariation}
        >
          <Text style={styles.createButtonText}>Create Variation</Text>
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
    marginBottom: 20,
  },
  backText: {
    fontSize: 15,
    color: "#111",
    marginLeft: 2,
  },

  // Title
  pageTitle: {
    fontSize: isTablet ? 34 : 28,
    fontWeight: "900",
    color: "#111",
    marginBottom: 28,
  },

  // Section label
  sectionLabel: {
    fontSize: 16,
    fontWeight: "800",
    fontStyle: "italic",
    color: "#111",
    marginBottom: 10,
  },

  // Field label
  fieldLabel: {
    fontSize: 15,
    fontWeight: "700",
    fontStyle: "italic",
    color: "#111",
    marginBottom: 10,
  },

  // Inputs
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 14,
    color: "#333",
    marginBottom: 14,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },

  // Image picker
  imagePicker: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  imagePickerLabel: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#888",
  },

  // Input with suffix
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: "#fff",
  },
  inputRowFlex: {
    flex: 1,
    borderWidth: 0,
    marginBottom: 0,
    paddingHorizontal: 0,
  },
  inputRowSuffix: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
    marginLeft: 8,
  },

  // Specification
  specHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 12,
  },
  newSpecButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
  },
  newSpecButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  specColumnLabels: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  specColumnLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#444",
    lineHeight: 18,
  },
  specContainer: {
    backgroundColor: "#f0f0f0",
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  specRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  specInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 13,
    backgroundColor: "#fff",
    color: "#111",
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: isTablet ? 40 : 22,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  createButton: {
    backgroundColor: "#000",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  deleteSpecButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#cc0000",
    alignItems: "center",
    justifyContent: "center",
  },
});
