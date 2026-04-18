import { Colors, tokens } from "@/constants/theme";
import { useGetWarehouses } from "@/query-hooks/useWarehoue";
import { useGetWarehouseRequests } from "@/query-hooks/useWarehouseRequest";
import { useAuthStore } from "@/store/useAuth";
import { Warehouse } from "@/types/warehouse";
import {
  WarehouseRequest,
  WarehouseRequestStatusEnum,
} from "@/types/warehouse-requests";
import { MaterialIcons } from "@expo/vector-icons";
import { LegendList } from "@legendapp/list";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SceneRendererProps, TabBar, TabView } from "react-native-tab-view";

const ROUTES = [
  { key: "published", title: "Yayında" },
  { key: "unpublished", title: "Yayında Değil" },
];

const LIST_QUERY_LIMIT = 100;

function getItemTimestamp(item: Warehouse | WarehouseRequest): number {
  const rawDate = item.updatedAt ?? item.createdAt ?? "";
  const timestamp = Date.parse(rawDate);

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

const getStatusConfig = (
  item: Warehouse | WarehouseRequest,
): { label: string; bgColor: string; textColor: string } => {
  // Active warehouses
  if ("status" in item && item.status === "ACTIVE") {
    return { label: "Yayında", bgColor: "#E8F5E9", textColor: "#43A047" };
  }

  // Warehouse requests with specific status
  if ("requestType" in item && "status" in item) {
    switch (item.status) {
      case WarehouseRequestStatusEnum.APPROVED:
        return { label: "Onaylandı", bgColor: "#E8F5E9", textColor: "#43A047" };
      case WarehouseRequestStatusEnum.REJECTED:
        return {
          label: "Reddedildi",
          bgColor: "#FFEBEE",
          textColor: "#E53935",
        };
      case WarehouseRequestStatusEnum.CANCELLED:
        return {
          label: "İptal Edildi",
          bgColor: "#F5F5F5",
          textColor: "#757575",
        };
      case WarehouseRequestStatusEnum.UPDATED:
        return {
          label: "Güncellendi",
          bgColor: "#E3F2FD",
          textColor: "#1E88E5",
        };
      case WarehouseRequestStatusEnum.PENDING:
      default:
        return { label: "Beklemede", bgColor: "#FFF3E0", textColor: "#FB8C00" };
    }
  }

  // Inactive warehouses or fallback
  return { label: "Beklemede", bgColor: "#FFF3E0", textColor: "#FB8C00" };
};

const AddButton = () => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.addButton}
      onPress={() => router.push("/warehouse-edit/new")}
    >
      <MaterialIcons name="add" size={24} color="#FFFFFF" />
    </TouchableOpacity>
  );
};

const Separator = () => <View style={styles.separator} />;

const WarehouseItem = ({ item }: { item: Warehouse | WarehouseRequest }) => {
  const router = useRouter();
  const imageUri = item.images?.[0]?.url;
  const isRequest = "requestType" in item;
  const statusConfig = getStatusConfig(item);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() =>
        router.push(
          isRequest
            ? `/profile/my-warehouse-requests-detail/${item.id}`
            : `/profile/my-warehouse-detail/${item.id}`,
        )
      }
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <MaterialIcons name="warehouse" size={28} color="#C7C7CC" />
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.bgColor },
            ]}
          >
            <Text
              style={[styles.statusText, { color: statusConfig.textColor }]}
            >
              {statusConfig.label}
            </Text>
          </View>
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.name || "İsimsiz İlan"}
        </Text>
        <Text style={styles.cardAddress} numberOfLines={1}>
          {item.address?.addressContent || "Adres belirtilmemiş"}
        </Text>
        <View style={styles.cardFooter}>
          {item.price != null && (
            <View style={styles.priceContainer}>
              <MaterialIcons name="payments" size={16} color={Colors.primary} />
              <Text style={styles.priceText}>
                ₺{item.price.toLocaleString("tr-TR")}/ay
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ActiveWarehouseList = () => {
  const user = useAuthStore();
  const {
    data,
    isLoading,
    refetch,
    isRefetching,
  } = useGetWarehouses({
    enabled: !!user?.user?.user.id,
    filters: {
      ownUserId: user?.user?.user.id,
      limit: LIST_QUERY_LIMIT,
    },
  });

  const warehouses = useMemo(
    () =>
      data?.results.filter((warehouse) => warehouse.status === "ACTIVE") ?? [],
    [data],
  );

  if (isLoading) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (warehouses.length === 0) {
    return (
      <View style={styles.emptyState}>
        <MaterialIcons name="warehouse" size={48} color="#C7C7CC" />
        <Text style={styles.emptyTitle}>Yayında İlan Yok</Text>
        <Text style={styles.emptyDescription}>Yayında ilanınız bulunmuyor.</Text>
      </View>
    );
  }

  return (
    <LegendList
      data={warehouses}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <WarehouseItem item={item} />}
      ItemSeparatorComponent={Separator}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      estimatedItemSize={100}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={Colors.primary}
        />
      }
    />
  );
};

const ReviewWarehouseList = () => {
  const user = useAuthStore();
  const {
    data: warehouseData,
    isLoading,
    refetch: refetchWarehouses,
    isRefetching,
  } = useGetWarehouses({
    enabled: !!user?.user?.user.id,
    filters: {
      ownUserId: user?.user?.user.id,
      limit: LIST_QUERY_LIMIT,
    },
  });
  const {
    data: requestData,
    isLoading: isLoadingRequests,
    refetch: refetchRequests,
    isRefetching: isRefetchingRequests,
  } = useGetWarehouseRequests({
    filters: {
      limit: LIST_QUERY_LIMIT,
    },
  });

  const items = useMemo(() => {
    const inactiveWarehouses =
      warehouseData?.results.filter((warehouse) => warehouse.status === "INACTIVE") ?? [];
    const unpublishedRequests =
      requestData?.results.filter(
        (request) => request.status !== WarehouseRequestStatusEnum.APPROVED,
      ) ?? [];

    return [...inactiveWarehouses, ...unpublishedRequests].sort(
      (left, right) => getItemTimestamp(right) - getItemTimestamp(left),
    );
  }, [requestData, warehouseData]);

  const handleRefresh = async () => {
    await Promise.all([refetchWarehouses(), refetchRequests()]);
  };

  if (isLoading || isLoadingRequests) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyState}>
        <MaterialIcons name="warehouse" size={48} color="#C7C7CC" />
        <Text style={styles.emptyTitle}>Yayında Olmayan İlan Yok</Text>
        <Text style={styles.emptyDescription}>
          Yayında olmayan ilanınız bulunmuyor.
        </Text>
      </View>
    );
  }

  return (
    <LegendList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <WarehouseItem item={item} />}
      ItemSeparatorComponent={Separator}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      estimatedItemSize={100}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching || isRefetchingRequests}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
        />
      }
    />
  );
};

const renderScene = ({
  route,
}: SceneRendererProps & { route: { key: string } }) => {
  switch (route.key) {
    case "published":
      return <ActiveWarehouseList />;
    case "unpublished":
      return <ReviewWarehouseList />;
    default:
      return null;
  }
};

export default function MyWarehousesScreen() {
  const layout = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ tab?: string; refresh?: string }>();
  const t = tokens;

  // Set initial index based on tab param
  const initialIndex = params.tab === "unpublished" ? 1 : 0;
  const [index, setIndex] = useState(initialIndex);

  // Refresh warehouse requests data when refresh param is "true"
  useEffect(() => {
    if (params.refresh === "true") {
      queryClient.invalidateQueries({ queryKey: ["WAREHOUSE"] });
      queryClient.invalidateQueries({ queryKey: ["WAREHOUSE_REQUEST"] });
    }
  }, [params.refresh, queryClient]);

  return (
    <View style={[styles.container, { backgroundColor: t.bgBase }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            backgroundColor: t.bgSurface,
            borderBottomColor: t.borderDefault,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons
              name="arrow-back-ios"
              size={22}
              color={t.textPrimary}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: t.textPrimary }]}>
            İlanlarım
          </Text>
          <AddButton />
        </View>
      </View>

      <View style={styles.tabViewContainer}>
        <TabView
          navigationState={{ index, routes: ROUTES }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={(props) => (
            <TabBar
              {...props}
              style={[
                styles.tabBar,
                {
                  backgroundColor: t.bgSurface,
                  borderBottomColor: t.borderDefault,
                },
              ]}
              indicatorStyle={styles.tabIndicator}
              activeColor={Colors.primary}
              inactiveColor={t.textTertiary}
            />
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  tabViewContainer: {
    flex: 1,
  },
  tabBar: {
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabIndicator: {
    backgroundColor: Colors.primary,
    height: 2,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    flexDirection: "row",
    paddingVertical: 16,
  },
  cardImage: {
    width: 100,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#F2F4F8",
  },
  cardImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  cardAddress: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E5EA",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginTop: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: "#8E8E93",
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
