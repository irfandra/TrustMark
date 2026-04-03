import { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import CollectionCard from "@/components/card/CollectionCard";
import CollapsibleAccordion from "@/components/shared/collapsible-accordion";
import FilterTabs from "@/components/shared/filter-tabs";
import { collectionService } from "@/services/collectionService";
import LoadingPulse from "@/components/shared/loading-pulse";
import {
  createCreatorCollectionStyles,
} from "@/constants/styles/creator-collection-styles";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 768;


export default function CollectionScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const styles = createCreatorCollectionStyles({ isTablet, tabBarHeight });
  const [activeTab, setActiveTab] = useState("All");
  const [openDraft, setOpenDraft] = useState(false);
  const [openActive, setOpenActive] = useState(false);
  const [openInactive, setOpenInactive] = useState(false);
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const tabs = ["All", "Draft", "Active", "Inactive"];

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
  function Accordion({ title, open, setOpen, data }) {
    const countLabel = `${data.length} ${data.length === 1 ? "Collection" : "Collections"}`;
    const statusDotColor =
      title === "Draft" ? "#D95F47" : title === "Active" ? "#2D7A4E" : "#8A7C6A";

    return (
      <CollapsibleAccordion
        isOpen={open}
        onToggle={() => setOpen((prev) => !prev)}
        containerStyle={styles.accordionContainer}
        headerStyle={styles.accordionHeader}
        chevronWrapStyle={styles.accordionChevronWrap}
        chevronColor="#000000"
        headerContent={
          <View style={styles.accordionHeaderLeft}>
            <View style={styles.accordionTitleRow}>
              <View
                style={[styles.accordionStatusDot, { backgroundColor: statusDotColor }]}
              />
              <Text style={styles.accordionTitle}>{title}</Text>
            </View>
            <Text style={styles.accordionCount}>{countLabel}</Text>
          </View>
        }
        contentStyle={styles.accordionContent}
      >
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
                description={collection.description}
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
                    pathname: "/(collection)/collection-detail",
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
                      description: collection.description,
                    },
                  })
                }
              />
            ))}
          </View>
        )}
      </CollapsibleAccordion>
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
        <Text style={styles.title}>Collections List</Text>

        <FilterTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          fill
        />

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
            {(activeTab === "Draft" || activeTab === "All") && (
              <Accordion
                title="Draft"
                open={openDraft}
                setOpen={setOpenDraft}
                data={collections.filter((c) => c.status === "Draft")}
              />
            )}

            {(activeTab === "Active" || activeTab === "All") && (
              <Accordion
                title="Active"
                open={openActive}
                setOpen={setOpenActive}
                data={collections.filter((c) => c.status === "Active")}
              />
            )}

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

      <TouchableOpacity
        style={styles.newCollectionButton}
        onPress={() => router.push("/(collection)/new-collection")}
      >
        <Ionicons name="add-circle-outline" size={16} color="#FFF9F0" />
        <Text style={styles.newCollectionButtonText}>New Collection</Text>
      </TouchableOpacity>
    </View>
  );
}

