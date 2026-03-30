import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 768;

const RARITY_OPTIONS = [
  { label: "Standard",  color: "#4CAF50", textColor: "#fff" },
  { label: "Common",    color: "#90CAF9", textColor: "#fff" },
  { label: "Rare",      color: "#000000", textColor: "#fff" },
  { label: "Ultra Rare",color: "#9C27B0", textColor: "#fff" },
  { label: "Limited",   color: "#FFC107", textColor: "#fff" },
];

export default function NewCollection() {
  const router = useRouter();
  const [collectionName, setCollectionName]     = useState("");
  const [category, setCategory]                 = useState("");
  const [about, setAbout]                       = useState("");
  const [imageUrl, setImageUrl]                 = useState("");
  const [totalItems, setTotalItems]             = useState("");
  const [selectedRarity, setSelectedRarity]     = useState("Rare");
  const [errors, setErrors]                     = useState({});

  const handleContinue = () => {
    const nextErrors = {};

    const safeName = collectionName.trim();
    const safeCategory = category.trim();
    const safeAbout = about.trim();
    const totalItemsNumber = Number(String(totalItems).replace(/[^0-9]/g, ""));

    if (safeName.length < 2) {
      nextErrors.collectionName = "Collection name must be at least 2 characters";
    }
    if (!safeCategory) {
      nextErrors.category = "Collection category is required";
    }
    if (safeAbout.length < 10) {
      nextErrors.about = "About the collection must be at least 10 characters";
    }
    if (!Number.isInteger(totalItemsNumber) || totalItemsNumber <= 0) {
      nextErrors.totalItems = "Total produced items must be a positive number";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      Alert.alert("Validation Error", "Please complete all required fields before continuing.");
      return;
    }

    router.push({
      pathname: '/(tabs)/(creator)/new-collection-continue',
      params: {
        setupData: JSON.stringify({
          collectionName: safeName,
          category: safeCategory,
          about: safeAbout,
          imageUrl: imageUrl.trim(),
          totalItems: totalItemsNumber,
          rarity: selectedRarity,
        }),
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color="#111" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Logo */}
        <Text style={styles.logo}>ZEAL</Text>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={styles.stepActive}>
            <Text style={styles.stepActiveNumber}>1</Text>
          </View>
          <View style={styles.stepActiveTextWrap}>
            <Text style={styles.stepActiveLabel}>Setup</Text>
            <Text style={styles.stepActiveLabel}>Collections</Text>
          </View>

          <View style={styles.stepInactive}>
            <Text style={styles.stepInactiveNumber}>2</Text>
          </View>
          <View style={styles.stepInactiveTextWrap}>
            <Text style={styles.stepInactiveLabel}>Setup</Text>
            <Text style={styles.stepInactiveLabel}>Variations</Text>
          </View>
        </View>

        {/* Page title */}
        <Text style={styles.pageTitle}>Setup Collections</Text>

        {/* Collection Name */}
        <TextInput
          style={styles.input}
          placeholder="Collection Name"
          placeholderTextColor="#888"
          value={collectionName}
          onChangeText={(value) => {
            setCollectionName(value);
            setErrors((prev) => ({ ...prev, collectionName: undefined }));
          }}
        />
        {!!errors.collectionName && <Text style={styles.errorText}>{errors.collectionName}</Text>}

        {/* Collection Category */}
        <TextInput
          style={styles.input}
          placeholder="Collection Category (ex. Luxury Bags)"
          placeholderTextColor="#888"
          value={category}
          onChangeText={(value) => {
            setCategory(value);
            setErrors((prev) => ({ ...prev, category: undefined }));
          }}
        />
        {!!errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

        {/* About the Collection */}
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="About the Collection"
          placeholderTextColor="#888"
          value={about}
          onChangeText={(value) => {
            setAbout(value);
            setErrors((prev) => ({ ...prev, about: undefined }));
          }}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        {!!errors.about && <Text style={styles.errorText}>{errors.about}</Text>}

        {/* Collection Banner Image URL */}
        <TextInput
          style={styles.input}
          placeholder="Collection Banner Image URL (optional)"
          placeholderTextColor="#888"
          value={imageUrl}
          onChangeText={setImageUrl}
        />

        {/* Total Produced Items */}
        <TextInput
          style={styles.input}
          placeholder="Total Produced Items"
          placeholderTextColor="#888"
          keyboardType="numeric"
          value={totalItems}
          onChangeText={(value) => {
            const normalized = value.replace(/[^0-9]/g, "");
            setTotalItems(normalized);
            setErrors((prev) => ({ ...prev, totalItems: undefined }));
          }}
        />
        {!!errors.totalItems && <Text style={styles.errorText}>{errors.totalItems}</Text>}

        {/* Rarity Label */}
        <Text style={styles.rarityTitle}>Rarity Label*</Text>
        <Text style={styles.raritySubtitle}>
          Select label that fits with your product rarity level based on your brands product plan
          (More items produced meaning more lower the rarity level)
        </Text>

        <View style={styles.rarityRow}>
          {RARITY_OPTIONS.map((option) => {
            const isSelected = selectedRarity === option.label;
            return (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.rarityChip,
                  { backgroundColor: option.color },
                  isSelected && styles.rarityChipSelected,
                ]}
                onPress={() => setSelectedRarity(option.label)}
              >
                <View style={[styles.rarityDot, { backgroundColor: option.textColor }]} />
                <Text style={[styles.rarityChipText, { color: option.textColor }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  stepActiveTextWrap: {
    marginRight: 20,
  },
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
  stepInactiveTextWrap: {},
  stepInactiveLabel: {
    fontSize: 13,
    color: "#aaa",
    lineHeight: 17,
  },

  // Title
  pageTitle: {
    fontSize: isTablet ? 32 : 26,
    fontWeight: "800",
    color: "#111",
    marginBottom: 24,
  },

  // Inputs
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 14,
    fontStyle: "italic",
    color: "#333",
    marginBottom: 14,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  errorText: {
    marginTop: -8,
    marginBottom: 10,
    fontSize: 12,
    color: '#B91C1C',
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
    backgroundColor: "#fff",
  },
  imagePickerLabel: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#888",
  },

  // Rarity
  rarityTitle: {
    fontSize: 16,
    fontWeight: "800",
    fontStyle: "italic",
    color: "#111",
    marginBottom: 6,
  },
  raritySubtitle: {
    fontSize: 12,
    color: "#444",
    lineHeight: 18,
    marginBottom: 14,
  },
  rarityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 32,
  },
  rarityChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  rarityChipSelected: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  rarityChipText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Continue button
  continueButton: {
    backgroundColor: "#000",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  button: {
    marginTop: 32,
    backgroundColor: '#111',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
});
