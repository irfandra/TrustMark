import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import CollectionCard from "@/components/card/CollectionCard";
import { collectionService } from "@/services/collectionService";
import LoadingPulse from "@/components/shared/loading-pulse";
import { createCreatorFilterTabsStyle } from "@/constants/creator-filter-tabs";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 768;

export default function CollectionScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const [activeTab, setActiveTab] = useState("All");
  const [openDraft, setOpenDraft] = useState(false);
  const [openActive, setOpenActive] = useState(false);
  const [openInactive, setOpenInactive] = useState(false);
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const filterTabs = createCreatorFilterTabsStyle({ isTablet, fill: true });

  const loadCollections = useCallback(async (showInitialLoader = true) => {
    try {
      if (showInitialLoader) {
        setIsLoading(true);
      }
      setLoadError("");
      const data = await collectionService.getCollectionsForCreatorHome();
      setCollections(data);
    } catch (error) {
      setCollections([]);
      setLoadError(error?.message || "Failed to load collections");
    } finally {
      if (showInitialLoader) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadCollections(false);
  }, [loadCollections]);

  // Accordion component
  function Accordion({ title, open, setOpen, data }) {
    const countLabel = `${data.length} ${data.length === 1 ? "Collection" : "Collections"}`;
    const statusDotColor =
      title === "Draft" ? "#D95F47" : title === "Active" ? "#2D7A4E" : "#8A7C6A";

    return (
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          style={styles.accordionHeader}
          activeOpacity={0.8}
          onPress={() => setOpen((prev) => !prev)}
        >
          <View style={styles.accordionHeaderLeft}>
            <View style={styles.accordionTitleRow}>
              <View style={[styles.accordionStatusDot, { backgroundColor: statusDotColor }]} />
              <Text style={styles.accordionTitle}>{title}</Text>
            </View>
            <Text style={styles.accordionCount}>{countLabel}</Text>
          </View>

          <View style={styles.accordionChevronWrap}>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={18}
            color="#000000"
          />
          </View>
        </TouchableOpacity>

        {open && (
          <View style={styles.accordionContent}>
            {data.length === 0 ? (
              <Text style={styles.accordionEmptyText}>No collections in this section.</Text>
            ) : (
              <View style={styles.listStack}>
                {data.map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    tag={collection.tag}
                    tagColor={collection.tagColor}
                    tagTextColor={collection.tagTextColor}
                    brand={collection.brand}
                    brandLogo={collection.brandLogo}
                    name={collection.title}
                    category={collection.subtitle}
                    items={collection.itemsCount}
                    sold={collection.soldCount}
                    inStock={Math.max(
                      Number(collection.itemsCount ?? 0) - Number(collection.soldCount ?? 0),
                      0
                    )}
                    floorPrice={collection.floorPrice}
                    floorUsd={collection.floorUsd}
                    image={collection.image}
                    style={styles.collectionCardWrapper}
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/(creator)/collection-detail",
                        params: {
                          collectionId: collection.id,
                          title: collection.title,
                          subtitle: collection.subtitle,
                          status: collection.status,
                          tag: collection.tag,
                          tagColor: collection.tagColor,
                          tagTextColor: collection.tagTextColor,
                          itemsCount: String(collection.itemsCount ?? 0),
                          items: collection.items,
                          brand: collection.brand,
                          image: encodeURIComponent(collection.image),
                        },
                      })
                    }
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#1E2C3A" />
        }
      >
        {/* Title */}
        <Text style={styles.title}>Collections List</Text>
     

        {/* Tabs */}
        <View style={filterTabs.tabsWrap}>
          <View style={filterTabs.tabs}>
            <TouchableOpacity
              style={[filterTabs.tabButton, activeTab === "All" && filterTabs.activeTab]}
              onPress={() => setActiveTab("All")}
            >
              <Text
                style={[filterTabs.tabText, activeTab === "All" && filterTabs.activeText]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                filterTabs.tabButton,
                activeTab === "Draft" && filterTabs.activeTab,
              ]}
              onPress={() => setActiveTab("Draft")}
            >
              <Text
                style={[
                  filterTabs.tabText,
                  activeTab === "Draft" && filterTabs.activeText,
                ]}
              >
                Draft
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                filterTabs.tabButton,
                activeTab === "Active" && filterTabs.activeTab,
              ]}
              onPress={() => setActiveTab("Active")}
            >
              <Text
                style={[
                  filterTabs.tabText,
                  activeTab === "Active" && filterTabs.activeText,
                ]}
              >
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                filterTabs.tabButton,
                activeTab === "Inactive" && filterTabs.activeTab,
              ]}
              onPress={() => setActiveTab("Inactive")}
            >
              <Text
                style={[
                  filterTabs.tabText,
                  activeTab === "Inactive" && filterTabs.activeText,
                ]}
              >
                Inactive
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {isLoading && (
          <View style={styles.loadingWrap}>
            <LoadingPulse label="Loading collections..." />
          </View>
        )}

        {!isLoading && !!loadError && (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadCollections}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !loadError && collections.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyCollectionsText}>No collections available</Text>
          </View>
        )}

        {!isLoading && !loadError && collections.length > 0 && (
          <>
            {/* Draft Section Accordion */}
            {(activeTab === "Draft" || activeTab === "All") && (
              <Accordion
                title="Draft"
                open={openDraft}
                setOpen={setOpenDraft}
                data={collections.filter((c) => c.status === "Draft")}
              />
            )}

            {/* Active Section Accordion */}
            {(activeTab === "Active" || activeTab === "All") && (
              <Accordion
                title="Active"
                open={openActive}
                setOpen={setOpenActive}
                data={collections.filter((c) => c.status === "Active")}
              />
            )}

            {/* Inactive Section Accordion */}
            {(activeTab === "Inactive" || activeTab === "All") && (
              <Accordion
                title="Inactive"
                open={openInactive}
                setOpen={setOpenInactive}
                data={collections.filter((c) => c.status === "Inactive")}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* New Collection Button - Fixed at bottom right */}
      <TouchableOpacity
        style={[
          styles.newCollectionButton,
          { bottom: tabBarHeight + (isTablet ? 24 : 16) },
        ]}
        onPress={() => router.push("/(tabs)/(creator)/new-collection")}
      >
        <Text style={styles.newCollectionButtonText}>+ New Collection</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: "#F6F1E8",
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: isTablet ? 32 : 16,
    paddingTop: isTablet ? 12 : 8,
    paddingBottom: isTablet ? 160 : 140,
    backgroundColor: "#F6F1E8",
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
    fontWeight: "600",
    marginBottom: 8,
    color: "#1A2640",
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#333",
  },
  errorWrap: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: "#b91c1c",
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: "#5C57E8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyWrap: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCollectionsText: {
    fontSize: 13,
    color: "#6C7891",
  },
  accordionContainer: {
    marginBottom: 12,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#CED5E4",
    backgroundColor: "#F6F1E8",
    shadowColor: "#1A2640",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F6F1E8",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  accordionHeaderLeft: {
    flex: 1,
    gap: 2,
  },
  accordionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accordionStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 99,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A2640",
  },
  accordionCount: {
    fontSize: 11,
    color: "#6B7892",
    marginLeft: 18,
    fontWeight: "600",
  },
  accordionChevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CAD2E2",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  accordionContent: {
    backgroundColor: "#F6F1E8",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#D6DDEB",
  },
  accordionEmptyText: {
    fontSize: 13,
    color: "#6C7891",
    textAlign: "center",
    paddingVertical: 8,
  },
  listStack: {
    gap: 12,
  },
  collectionCardWrapper: {
    width: "100%",
    minHeight: isTablet ? 146 : 132,
  },
  newCollectionButton: {
    position: "absolute",
    right: isTablet ? 40 : 20,
    backgroundColor: "#131317",
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    zIndex: 50,
    shadowColor: "#2A2F66",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  newCollectionButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: isTablet ? 20 : 16,
  },
});
