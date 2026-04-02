import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import WizardStepper from "@/components/shared/wizard-stepper";
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 768;
const parseParam = (value) => (Array.isArray(value) ? value[0] : value);
const parseSetupData = (rawSetup) => {
  if (!rawSetup) return null;
  try {
    const parsed = JSON.parse(rawSetup);
    if (!parsed?.collectionName) return null;
    return parsed;
  } catch (_error) {
    return null;
  }
};

const palette = {
  background: "#F6F1E8",
  surface: "#FFFFFF",
  text: "#1E2C3A",
  muted: "#6B7280",
  border: "#E5DED0",
  accent: "#1E2C3A",
  accentSoft: "#D8CCB6",
  field: "#FCFAF5",
};

export default function NewCollection() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const existingSetup = parseSetupData(parseParam(params.setupData));
  const draftVariations = parseParam(params.variationsDraft);
  const [collectionName, setCollectionName]     = useState(existingSetup?.collectionName || "");
  const [category, setCategory]                 = useState(existingSetup?.category || "");
  const [about, setAbout]                       = useState(existingSetup?.about || "");
  const [imageUrl, setImageUrl]                 = useState(existingSetup?.imageUrl || "");
  const [errors, setErrors]                     = useState({});

  const handleContinue = () => {
    const nextErrors = {};

    const safeName = collectionName.trim();
    const safeCategory = category.trim();
    const safeAbout = about.trim();

    if (safeName.length < 2) {
      nextErrors.collectionName = "Collection name must be at least 2 characters";
    }
    if (!safeCategory) {
      nextErrors.category = "Collection category is required";
    }
    if (safeAbout.length < 10) {
      nextErrors.about = "About the collection must be at least 10 characters";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      Alert.alert("Validation Error", "Please complete all required fields before continuing.");
      return;
    }

    router.replace({
      pathname: '/(tabs)/(creator)/new-collection-continue',
      params: {
        setupData: JSON.stringify({
          collectionName: safeName,
          category: safeCategory,
          about: safeAbout,
          imageUrl: imageUrl.trim(),
        }),
        ...(draftVariations ? { variationsDraft: draftVariations } : {}),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => router.replace('/(tabs)/(creator)/(tabs)/collection')}
        >
          <Ionicons name="chevron-back" size={18} color={palette.text} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerCard}>
          {/* Logo */}
          <Text style={styles.logo}>TRUSTMARK</Text>

          {/* Step indicator */}
          <WizardStepper
            palette={palette}
            steps={[
              { key: 'setup-collection', number: 1, label: 'Collections', active: true },
              { key: 'setup-variation', number: 2, label: 'Variations', active: false, onPress: handleContinue },
            ]}
          />

          {/* Page title */}
          <Text style={styles.pageTitle}>Setup Collections</Text>
          <Text style={styles.pageSubtitle}>Fill in your collection basics before adding variations.</Text>
        </View>

        <View style={styles.formCard}>
          {/* Collection Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Collection Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Heritage Capsule"
              placeholderTextColor={palette.muted}
              value={collectionName}
              onChangeText={(value) => {
                setCollectionName(value);
                setErrors((prev) => ({ ...prev, collectionName: undefined }));
              }}
            />
            {!!errors.collectionName && <Text style={styles.errorText}>{errors.collectionName}</Text>}
          </View>

          {/* Collection Category */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Category</Text>
            <TextInput
              style={styles.input}
              placeholder="ex. Luxury Bags"
              placeholderTextColor={palette.muted}
              value={category}
              onChangeText={(value) => {
                setCategory(value);
                setErrors((prev) => ({ ...prev, category: undefined }));
              }}
            />
            {!!errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </View>

          {/* About the Collection */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>About the Collection</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Write a short description of this collection"
              placeholderTextColor={palette.muted}
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
          </View>

          {/* Collection Banner Image URL */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Banner Image URL (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/banner.jpg"
              placeholderTextColor={palette.muted}
              value={imageUrl}
              onChangeText={setImageUrl}
            />
          </View>

          <Text style={styles.autoInfoText}>
            Total items are calculated automatically from variation quantities in the next step.
          </Text>
        </View>

        {/* Continue button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    paddingHorizontal: isTablet ? 40 : 22,
    paddingTop: isTablet ? 56 : 42,
    paddingBottom: 56,
  },

  // Back
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EFE6D9",
  },
  backText: {
    fontSize: 15,
    color: palette.text,
    marginLeft: 4,
    fontWeight: "600",
  },

  headerCard: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: isTablet ? 24 : 18,
    paddingVertical: isTablet ? 24 : 18,
    marginBottom: 16,
  },

  // Logo
  logo: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1,
    color: palette.text,
    marginBottom: 16,
  },

  // Title
  pageTitle: {
    fontSize: isTablet ? 32 : 26,
    fontWeight: "800",
    color: palette.text,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: palette.muted,
    lineHeight: 20,
  },

  formCard: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: isTablet ? 24 : 18,
    paddingVertical: isTablet ? 24 : 18,
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 8,
  },

  // Inputs
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: palette.text,
    marginBottom: 0,
    backgroundColor: palette.field,
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  errorText: {
    marginTop: 6,
    marginBottom: 0,
    fontSize: 12,
    color: '#B91C1C',
  },
  autoInfoText: {
    marginTop: 4,
    fontSize: 12,
    color: palette.muted,
    lineHeight: 18,
  },

  // Continue button
  continueButton: {
    backgroundColor: palette.accent,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1E2C3A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 3,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
