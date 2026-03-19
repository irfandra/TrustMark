import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import TabRoleToggle from "../../components/ui/tab-role-toggle";
import { useRouter } from "expo-router";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 768;

export default function CompanyHome() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All");
  const [openDraft, setOpenDraft] = useState(false);
  const [openListed, setOpenListed] = useState(false);
  const [openExpired, setOpenExpired] = useState(false);

  // Example collection data
  const collections = [
    {
      id: "1",
      status: "Draft",
      brand: "Hermès",
      tag: "Rare",
      title: "Birkin Collections",
      subtitle: "Luxury Bags",
      items: "👜 4,000 Items",
      owners: "👤 3,200 Owners",
      price: "POL 104,192 ~ $10,000",
      tagColor: "#111",
      tagTextColor: "#fff",
      image: "https://via.placeholder.com/300x160/ff6600/ffffff?text=Hermès",
    },
    {
      id: "2",
      status: "Draft",
      brand: "Rolex",
      tag: "Limited",
      title: "Submariner Series",
      subtitle: "Luxury Watches",
      items: "⌚ 1,500 Items",
      owners: "👤 850 Owners",
      price: "POL 45,000 ~ $4,500",
      tagColor: "#ffb300",
      tagTextColor: "#111",
      image: "https://via.placeholder.com/300x160/ffb300/111111?text=Rolex",
    },
    {
      id: "3",
      status: "Listed",
      brand: "Nintendo",
      tag: "Limited",
      title: "Pokemon Card",
      subtitle: "High-End Collectible Cards",
      items: "🎴 200 Items",
      owners: "👤 136 Owners",
      price: "POL 52,100 ~ $5,000",
      tagColor: "#ffb300",
      tagTextColor: "#111",
      image: "https://via.placeholder.com/300x160/ffb300/111111?text=Nintendo",
    },
    {
      id: "4",
      status: "Listed",
      brand: "Supreme",
      tag: "Rare",
      title: "Vintage Apparel",
      subtitle: "Streetwear Collection",
      items: "👕 5,000 Items",
      owners: "👤 4,200 Owners",
      price: "POL 78,500 ~ $7,500",
      tagColor: "#111",
      tagTextColor: "#fff",
      image: "https://via.placeholder.com/300x160/ff0000/ffffff?text=Supreme",
    },
    {
      id: "5",
      status: "Expired",
      brand: "Louis Vuitton",
      tag: "Rare",
      title: "Speedy Bag Series",
      subtitle: "Designer Handbags",
      items: "👜 2,800 Items",
      owners: "👤 1,900 Owners",
      price: "POL 95,000 ~ $9,500",
      tagColor: "#111",
      tagTextColor: "#fff",
      image:
        "https://via.placeholder.com/300x160/8b4513/ffffff?text=LouisVuitton",
    },
    {
      id: "6",
      status: "Expired",
      brand: "Gucci",
      tag: "Premium",
      title: "Marmont Collection",
      subtitle: "Fashion Accessories",
      items: "👜 3,200 Items",
      owners: "👤 2,100 Owners",
      price: "POL 68,000 ~ $6,800",
      tagColor: "#d4af37",
      tagTextColor: "#111",
      image: "https://via.placeholder.com/300x160/00aa00/ffd700?text=Gucci",
    },
  ];

  // Reusable CollectionCard component
  function CollectionCard({ collection, onPress }) {
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
        <Image
          source={{ uri: collection.image }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={styles.cardLabel}>
          <Text style={styles.brand}>{collection.brand}</Text>
          <Text
            style={[
              styles.tag,
              {
                backgroundColor: collection.tagColor,
                color: collection.tagTextColor,
              },
            ]}
          >
            {collection.tag}
          </Text>
        </View>
        <Text style={styles.cardTitle}>{collection.title}</Text>
        <Text style={styles.subtitle}>{collection.subtitle}</Text>
        <View style={styles.cardStats}>
          <Text style={styles.statText}>{collection.items}</Text>
          <Text style={styles.statText}>{collection.owners}</Text>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Floor Price</Text>
          <Text style={styles.price}>{collection.price}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Render function for FlatList
  const renderCollectionCard = ({ item }) => (
    <CollectionCard
      collection={item}
      onPress={() =>
        router.push({
          pathname: '/(company)/collection-detail',
          params: {
            title: item.title,
            subtitle: item.subtitle,
            status: item.status,
            tag: item.tag,
            tagColor: item.tagColor,
            tagTextColor: item.tagTextColor,
            items: item.items,
            brand: item.brand,
            image: encodeURIComponent(item.image),
          },
        })
      }
    />
  );

  // Accordion component
  function Accordion({ title, icon, open, setOpen, data }) {
    return (
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          style={styles.accordionHeader}
          activeOpacity={0.8}
          onPress={() => setOpen((prev) => !prev)}
        >
          <Text style={styles.accordionTitle}>{title}</Text>
          {icon}
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={24}
            color="#fff"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
        {open && (
          <Animated.View style={styles.accordionContent}>
            <FlatList
              data={data}
              renderItem={renderCollectionCard}
              keyExtractor={(item) => item.id}
              horizontal={false}
              numColumns={isTablet ? 2 : 1}
              columnWrapperStyle={isTablet ? styles.tabletRow : undefined}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </Animated.View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>ZEAL</Text>
          <TabRoleToggle />
        </View>

        {/* Title */}
        <Text style={styles.title}>Collections List</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "All" && styles.activeTab]}
            onPress={() => setActiveTab("All")}
          >
            <Text
              style={[styles.tabText, activeTab === "All" && styles.activeText]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "Draft" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("Draft")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "Draft" && styles.activeText,
              ]}
            >
              Draft
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "Listed" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("Listed")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "Listed" && styles.activeText,
              ]}
            >
              Listed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "Expired" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("Expired")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "Expired" && styles.activeText,
              ]}
            >
              Expired
            </Text>
          </TouchableOpacity>
        </View>

        {/* Draft Section Accordion */}
        {(activeTab === "Draft" || activeTab === "All") && (
          <Accordion
            title="Draft"
            open={openDraft}
            setOpen={setOpenDraft}
            data={collections.filter((c) => c.status === "Draft")}
          />
        )}

        {/* Listed Section Accordion */}
        {(activeTab === "Listed" || activeTab === "All") && (
          <Accordion
            title="Listed"
            open={openListed}
            setOpen={setOpenListed}
            data={collections.filter((c) => c.status === "Listed")}
          />
        )}

        {/* Expired Section Accordion */}
        {(activeTab === "Expired" || activeTab === "All") && (
          <Accordion
            title="Expired"
            open={openExpired}
            setOpen={setOpenExpired}
            data={collections.filter((c) => c.status === "Expired")}
          />
        )}
      </ScrollView>

      {/* New Collection Button - Fixed at bottom right */}
      <TouchableOpacity
        style={styles.newCollectionButton}
        onPress={() => router.push("/(company)/new-collection")}
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
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: isTablet ? 32 : 16,
    paddingTop: 60,
    paddingBottom: isTablet ? 160 : 140,
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: isTablet ? 32 : 16,
    paddingTop: 60,
    paddingBottom: isTablet ? 100 : 80,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    fontSize: isTablet ? 36 : 28,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: {
    fontSize: isTablet ? 36 : 28,
    marginTop: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  tabs: {
    flexDirection: "row",
    marginTop: 24,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    alignItems: "center",
    marginHorizontal: 6,
  },
  activeTab: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  tabText: {
    fontSize: isTablet ? 18 : 16,
    color: "#333",
  },
  activeText: {
    color: "#fff",
  },
  card: {
    flex: isTablet ? 0.495 : 1,
    backgroundColor: "#fff",
    marginBottom: 24,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardImage: {
    width: "100%",
    height: isTablet ? 160 : 120,
    borderRadius: 12,
  },
  cardLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    alignItems: "center",
  },
  brand: {
    fontSize: 14,
    color: "#ff6600",
    fontWeight: "600",
  },
  tag: {
    fontSize: 12,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontWeight: "500",
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: isTablet ? 20 : 16,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },
  cardStats: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statText: {
    fontSize: 12,
  },
  priceBox: {
    marginTop: 12,
  },
  priceLabel: {
    fontSize: 12,
    color: "#666",
  },
  price: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#6b4df5",
    marginTop: 4,
  },
  accordionContainer: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "space-between",
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },
  accordionContent: {
    padding: 16,
    backgroundColor: "#fff",
  },
  tabletRow: {
    justifyContent: "space-between",
    marginBottom: 24,
  },
  newCollectionButton: {
    position: "absolute",
    bottom: isTablet ? 40 : 20,
    right: isTablet ? 40 : 20,
    backgroundColor: "#6b4df5",
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  newCollectionButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: isTablet ? 20 : 16,
  },
});
