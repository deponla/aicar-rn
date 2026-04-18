import { Colors } from "@/constants/theme";
import { getChatConversations } from "@/api/get";
import CityById from "@/components/CityById";
import DistrictById from "@/components/DistrictById";
import FavoriteButton from "@/components/FavoriteButton";
import { useStartChatConversation } from "@/query-hooks/useChat";
import { useWarehousePublicById } from "@/query-hooks/useWarehoue";
import { useAuthStore } from "@/store/useAuth";
import {
  AccessTypes,
  AppropriateProductAttributes,
  Currency,
  DetectorAndAlarmTypes,
  RentOrSale,
  SecurityCameraTypes,
  SecurityFeatures,
  STORAGE_TYPES,
  VEHICLE_ACCESSIBILITY_OPTIONS,
  VehicleAccesibility,
  WarehouseCategories,
} from "@/store/useWarehouse";
import { AuthStatusEnum } from "@/types/auth";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, WebViewMessageEvent } from "react-native-webview";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.TL]: "₺",
  [Currency.DOLLAR]: "$",
  [Currency.EURO]: "€",
};

const RENT_OR_SALE_LABELS: Record<RentOrSale, string> = {
  [RentOrSale.RENT]: "Kiralık",
  [RentOrSale.SALE]: "Satılık",
};

const ACCESS_TYPE_LABELS: Record<AccessTypes, string> = {
  [AccessTypes._24_7]: "7/24",
  [AccessTypes.BUSINESS_HOURS]: "Mesai Saatleri",
  [AccessTypes.BY_APPOINTMENT]: "Randevu ile",
};

const APPROPRIATE_PRODUCT_LABELS: Record<AppropriateProductAttributes, string> =
{
  [AppropriateProductAttributes.NORMAL_PRODUCT]: "Normal Ürün",
  [AppropriateProductAttributes.COLD_CHAIN_PRODUCT]: "Soğuk Zincir",
  [AppropriateProductAttributes.HANGING_PRODUCT]: "Asılabilir Ürün",
  [AppropriateProductAttributes.DANGEROUS_PRODUCT]: "Tehlikeli Madde",
};

const SECURITY_FEATURE_LABELS: Record<SecurityFeatures, string> = {
  [SecurityFeatures.CAMERA]: "Kamera",
  [SecurityFeatures.DETECTOR_AND_ALARM]: "Dedektör & Alarm",
  [SecurityFeatures.INSURANCE]: "Sigorta",
  [SecurityFeatures.ACCESS_TYPE]: "Erişim Kontrolü",
};

const SECURITY_CAMERA_LABELS: Record<SecurityCameraTypes, string> = {
  [SecurityCameraTypes.LOADING_UNLOADING_AREA]: "Yükleme/Boşaltma Alanı",
  [SecurityCameraTypes.PRODUCT_ACCEPTANCE_AREA]: "Ürün Kabul Alanı",
  [SecurityCameraTypes.STORAGE_AREA]: "Depolama Alanı",
  [SecurityCameraTypes.OPEN_AREA]: "Açık Alan",
  [SecurityCameraTypes.PERIMETER]: "Çevre",
  [SecurityCameraTypes.ENTRANCE_AND_SURROUNDINGS]: "Giriş ve Çevresi",
  [SecurityCameraTypes.PACKAGING_SECTION_AND_TABLE]: "Paketleme Bölümü",
};

const DETECTOR_ALARM_LABELS: Record<DetectorAndAlarmTypes, string> = {
  [DetectorAndAlarmTypes.Heat]: "Isı",
  [DetectorAndAlarmTypes.Flame]: "Alev",
  [DetectorAndAlarmTypes.Flood]: "Su Baskını",
  [DetectorAndAlarmTypes.GasLeak]: "Gaz Kaçağı",
  [DetectorAndAlarmTypes.Burglary]: "Hırsızlık",
  [DetectorAndAlarmTypes.UnauthorizedAccess]: "Yetkisiz Giriş",
  [DetectorAndAlarmTypes.Motion]: "Hareket",
  [DetectorAndAlarmTypes.Smoke]: "Duman",
};

function getStorageLabel(type: WarehouseCategories): string {
  return STORAGE_TYPES.find((s) => s.value === type)?.label ?? type;
}

function getVehicleLabel(type: VehicleAccesibility): string {
  return (
    VEHICLE_ACCESSIBILITY_OPTIONS.find((v) => v.value === type)?.label ?? type
  );
}

export default function WarehouseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [descriptionHeight, setDescriptionHeight] = useState(0);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [messageLoading, setMessageLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const viewerFlatListRef = useRef<FlatList>(null);

  const { status, user } = useAuthStore();
  const isLoggedIn = status === AuthStatusEnum.LOGGED_IN;
  const currentUserId = user?.user?.id;

  const startConversation = useStartChatConversation();

  const { data, isLoading, error } = useWarehousePublicById({
    id,
    enabled: !!id,
  });

  const warehouse = data?.result;

  const handleMessagePress = useCallback(async () => {
    if (!isLoggedIn) {
      router.push("/(tabs)/profile");
      return;
    }

    if (!warehouse) return;

    try {
      setMessageLoading(true);

      // Fetch conversations filtered by this warehouse directly from API
      // to avoid stale cache issues
      const freshConversations = await getChatConversations({
        relatedWarehouseId: id,
        page: 0,
        limit: 1,
      });

      const existingConversation = freshConversations?.results?.find(
        (c) => c.relatedWarehouseId === id,
      );

      if (existingConversation) {
        router.push(`/chat/${existingConversation.id}`);
        return;
      }

      // No existing conversation — create a new one
      const result = await startConversation.mutateAsync({
        participantId: warehouse.ownUserId,
        relatedWarehouseId: id,
      });

      router.push(`/chat/${result.result.id}`);
    } catch {
      Alert.alert("Hata", "Mesaj gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setMessageLoading(false);
    }
  }, [isLoggedIn, warehouse, id, router, startConversation]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !warehouse) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#999" />
        <Text style={styles.errorText}>Depo bulunamadı</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = warehouse.images ?? [];
  const symbol = CURRENCY_SYMBOLS[warehouse.currency] ?? "₺";

  const location = warehouse.address?.location;
  const hasLocation =
    location?.coordinates &&
    location.coordinates.length === 2 &&
    location.coordinates[0] !== 0 &&
    location.coordinates[1] !== 0;
  const latitude = hasLocation ? location!.coordinates[1] : 0;
  const longitude = hasLocation ? location!.coordinates[0] : 0;
  const isOwnWarehouse =
    !!currentUserId && warehouse.ownUserId === currentUserId;
  const priceText = warehouse.price
    ? `${symbol}${warehouse.price.toLocaleString("tr-TR")}`
    : "Fiyat belirtilmemiş";
  const city = warehouse.address?.city;
  const district = warehouse.address?.district;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {warehouse.name ?? "Depo Detayı"}
        </Text>
        <FavoriteButton warehouseId={id} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Gallery */}
        {images.length > 0 ? (
          <View>
            <FlatList
              ref={flatListRef}
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => `${item.url}-${index}`}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                );
                setActiveImageIndex(index);
              }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    setViewerIndex(activeImageIndex);
                    setImageViewerVisible(true);
                  }}
                >
                  <Image
                    source={{ uri: item.url }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
            />
            {images.length > 1 && (
              <View style={styles.pagination}>
                {images.map((img, index) => (
                  <View
                    key={`dot-${img.url}`}
                    style={[
                      styles.paginationDot,
                      index === activeImageIndex && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {activeImageIndex + 1}/{images.length}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="image-outline" size={48} color="#ccc" />
            <Text style={styles.noImageText}>Görsel yok</Text>
          </View>
        )}

        {/* Price & Type Badge */}

        {/* Fullscreen Image Viewer */}
        <Modal
          visible={imageViewerVisible}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setImageViewerVisible(false)}
        >
          <View style={styles.imageViewerContainer}>
            <FlatList
              ref={viewerFlatListRef}
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={viewerIndex}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              onMomentumScrollEnd={(
                e: NativeSyntheticEvent<NativeScrollEvent>,
              ) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                );
                setViewerIndex(index);
              }}
              keyExtractor={(item, index) => `viewer-${item.url}-${index}`}
              renderItem={({ item }) => (
                <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
                  <ScrollView
                    contentContainerStyle={styles.zoomContainer}
                    maximumZoomScale={4}
                    minimumZoomScale={1}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    bouncesZoom={true}
                    centerContent={true}
                  >
                    <Image
                      source={{ uri: item.url }}
                      style={styles.viewerImage}
                      resizeMode="contain"
                    />
                  </ScrollView>
                </View>
              )}
            />

            {/* Close button */}
            <TouchableOpacity
              style={[styles.imageViewerClose, { top: insets.top + 12 }]}
              onPress={() => setImageViewerVisible(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>

            {/* Image counter */}
            {images.length > 1 && (
              <View
                style={[
                  styles.imageViewerCounter,
                  { bottom: insets.bottom + 20 },
                ]}
              >
                <Text style={styles.imageViewerCounterText}>
                  {viewerIndex + 1} / {images.length}
                </Text>
              </View>
            )}
          </View>
        </Modal>

        <View style={styles.priceSection}>
          <Text style={styles.price}>{priceText}</Text>
          <View style={styles.rentBadge}>
            <Text style={styles.rentBadgeText}>
              {RENT_OR_SALE_LABELS[warehouse.rentOrSale]}
            </Text>
          </View>
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.warehouseName}>
            {warehouse.name ?? "İsimsiz Depo"}
          </Text>
        </View>

        {/* Location */}
        {city && district && (
          <View style={styles.section}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={18} color={Colors.primary} />
              <View style={styles.locationTexts}>
                <View style={styles.cityDistrictRow}>
                  <CityById id={city} />
                  <Text style={styles.locationSeparator}>/</Text>
                  <DistrictById id={district} />
                </View>
                {warehouse.address?.addressContent && (
                  <Text style={styles.addressContent}>
                    {warehouse.address.addressContent}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Map */}
        {hasLocation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Konum</Text>
            <TouchableOpacity
              style={styles.mapContainer}
              activeOpacity={0.9}
              onPress={() => setMapExpanded(true)}
            >
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude,
                  longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                zoomControlEnabled={false}
                showsCompass={false}
                showsScale={false}
                onPress={() => setMapExpanded(true)}
              >
                <Marker
                  coordinate={{ latitude, longitude }}
                  title={warehouse.name ?? "Depo"}
                />
              </MapView>
              <View style={styles.mapExpandButton}>
                <Ionicons name="expand-outline" size={18} color="#fff" />
                <Text style={styles.mapExpandButtonText}>Büyült</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Fullscreen Map Modal */}
        {hasLocation && (
          <Modal
            visible={mapExpanded}
            animationType="slide"
            statusBarTranslucent
          >
            <View style={styles.fullscreenMapContainer}>
              <MapView
                style={styles.fullscreenMap}
                initialRegion={{
                  latitude,
                  longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={true}
                zoomEnabled={true}
                rotateEnabled={true}
                pitchEnabled={true}
                zoomControlEnabled={true}
                showsCompass={true}
                showsScale={true}
                showsUserLocation={true}
              >
                <Marker
                  coordinate={{ latitude, longitude }}
                  title={warehouse.name ?? "Depo"}
                />
              </MapView>
              <TouchableOpacity
                style={[styles.mapCloseButton, { top: insets.top + 12 }]}
                onPress={() => setMapExpanded(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="contract-outline" size={18} color="#fff" />
                <Text style={styles.mapExpandButtonText}>Küçült</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        )}

        {/* Description */}
        {warehouse.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Açıklama</Text>
            <View style={{ height: descriptionHeight || 100 }}>
              <WebView
                originWhitelist={["*"]}
                source={{
                  html: `
                    <html>
                      <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
                        <style>
                          * { margin: 0; padding: 0; box-sizing: border-box; }
                          body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                            font-size: 14px;
                            line-height: 22px;
                            color: #444;
                            padding: 0;
                            background: transparent;
                          }
                          img { max-width: 100%; height: auto; border-radius: 8px; }
                          a { color: #002e6d; }
                          p { margin-bottom: 8px; }
                          ul, ol { padding-left: 20px; margin-bottom: 8px; }
                        </style>
                      </head>
                      <body>
                        ${warehouse.description}
                        <script>
                          window.onload = function() {
                            window.ReactNativeWebView.postMessage(
                              JSON.stringify({ height: document.body.scrollHeight })
                            );
                          };
                        </script>
                      </body>
                    </html>
                  `,
                }}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                style={{ backgroundColor: "transparent" }}
                onMessage={(event: WebViewMessageEvent) => {
                  try {
                    const { height } = JSON.parse(event.nativeEvent.data);
                    if (height) setDescriptionHeight(height);
                  } catch { }
                }}
              />
            </View>
          </View>
        )}

        {/* Area Info */}
        {!!(warehouse.indoorAreaSize || warehouse.outdoorAreaSize) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alan Bilgisi</Text>
            <View style={styles.infoGrid}>
              {!!warehouse.indoorAreaSize && (
                <View style={styles.infoCard}>
                  <Ionicons name="home-outline" size={22} color={Colors.primary} />
                  <Text style={styles.infoCardValue}>
                    {warehouse.indoorAreaSize} m²
                  </Text>
                  <Text style={styles.infoCardLabel}>Kapalı Alan</Text>
                </View>
              )}
              {!!warehouse.outdoorAreaSize && (
                <View style={styles.infoCard}>
                  <Ionicons name="sunny-outline" size={22} color={Colors.primary} />
                  <Text style={styles.infoCardValue}>
                    {warehouse.outdoorAreaSize} m²
                  </Text>
                  <Text style={styles.infoCardLabel}>Açık Alan</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Storage Type */}
        {warehouse.storageType && warehouse.storageType.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Depo Tipi</Text>
            <View style={styles.tagsRow}>
              {warehouse.storageType.map((type) => (
                <View key={type} style={styles.tag}>
                  <Text style={styles.tagText}>{getStorageLabel(type)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Appropriate Products */}
        {warehouse.appropriateProductAttributes &&
          warehouse.appropriateProductAttributes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Uygun Ürün Tipleri</Text>
              <View style={styles.tagsRow}>
                {warehouse.appropriateProductAttributes.map((attr) => (
                  <View key={attr} style={styles.tag}>
                    <Text style={styles.tagText}>
                      {APPROPRIATE_PRODUCT_LABELS[attr] ?? attr}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        {/* Security Features */}
        {warehouse.securityFeatures &&
          warehouse.securityFeatures.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Güvenlik Özellikleri</Text>
              <View style={styles.tagsRow}>
                {warehouse.securityFeatures.map((feature) => (
                  <View key={feature} style={styles.featureTag}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={14}
                      color={Colors.primary}
                    />
                    <Text style={styles.featureTagText}>
                      {SECURITY_FEATURE_LABELS[feature] ?? feature}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        {/* Security Cameras */}
        {warehouse.securityCameraTypes &&
          warehouse.securityCameraTypes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kamera Alanları</Text>
              <View style={styles.tagsRow}>
                {warehouse.securityCameraTypes.map((cam) => (
                  <View key={cam} style={styles.tag}>
                    <Text style={styles.tagText}>
                      {SECURITY_CAMERA_LABELS[cam] ?? cam}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        {/* Detector & Alarm */}
        {warehouse.detectorAndAlarmTypes &&
          warehouse.detectorAndAlarmTypes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dedektör & Alarm</Text>
              <View style={styles.tagsRow}>
                {warehouse.detectorAndAlarmTypes.map((det) => (
                  <View key={det} style={styles.tag}>
                    <Text style={styles.tagText}>
                      {DETECTOR_ALARM_LABELS[det] ?? det}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        {/* Access Types */}
        {warehouse.accessTypes && warehouse.accessTypes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Erişim</Text>
            <View style={styles.tagsRow}>
              {warehouse.accessTypes.map((access) => (
                <View key={access} style={styles.featureTag}>
                  <Ionicons name="time-outline" size={14} color={Colors.primary} />
                  <Text style={styles.featureTagText}>
                    {ACCESS_TYPE_LABELS[access] ?? access}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Vehicle Accessibility */}
        {warehouse.vehicleAccessibility &&
          warehouse.vehicleAccessibility.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Araç Erişimi</Text>
              <View style={styles.tagsRow}>
                {warehouse.vehicleAccessibility.map((vehicle) => (
                  <View key={vehicle} style={styles.featureTag}>
                    <Ionicons name="car-outline" size={14} color={Colors.primary} />
                    <Text style={styles.featureTagText}>
                      {getVehicleLabel(vehicle)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.bottomPriceContainer}>
          <Text style={styles.bottomPrice}>{priceText}</Text>
          <Text style={styles.bottomRentLabel}>
            {RENT_OR_SALE_LABELS[warehouse.rentOrSale]}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.contactButton,
            isOwnWarehouse && styles.contactButtonDisabled,
          ]}
          activeOpacity={0.8}
          onPress={handleMessagePress}
          disabled={messageLoading || isOwnWarehouse}
        >
          {messageLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name={isOwnWarehouse ? "home-outline" : "chatbubble-outline"}
              size={18}
              color="#fff"
            />
          )}
          <Text style={styles.contactButtonText}>
            {isOwnWarehouse ? "Kendi Deponuz" : "Mesaj At"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#999",
  },
  backBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  backBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  scrollView: {
    flex: 1,
  },
  // Image Gallery
  galleryImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.65,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  paginationDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#D1D1D6",
  },
  paginationDotActive: {
    backgroundColor: Colors.primary,
    width: 20,
    borderRadius: 4,
  },
  imageCounter: {
    position: "absolute",
    bottom: 12,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  noImageContainer: {
    height: 200,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  noImageText: {
    fontSize: 14,
    color: "#999",
  },
  // Image Viewer
  imageViewerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  zoomContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewerImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
  imageViewerClose: {
    position: "absolute",
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerCounter: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  imageViewerCounterText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  // Price
  priceSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  price: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A73E8",
  },
  rentBadge: {
    backgroundColor: "#E8F0FE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rentBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A73E8",
  },
  // Sections
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 10,
  },
  warehouseName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  // Location
  locationRow: {
    flexDirection: "row",
    gap: 8,
  },
  locationTexts: {
    flex: 1,
    gap: 4,
  },
  cityDistrictRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationSeparator: {
    color: "#999",
  },
  addressContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  // Description
  descriptionText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 22,
  },
  // Info Grid
  infoGrid: {
    flexDirection: "row",
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  infoCardValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  infoCardLabel: {
    fontSize: 12,
    color: "#666",
  },
  // Tags
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 13,
    color: "#444",
    fontWeight: "500",
  },
  featureTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E8F0FE",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  featureTagText: {
    fontSize: 13,
    color: "#1A73E8",
    fontWeight: "500",
  },
  // Map
  mapContainer: {
    borderRadius: 14,
    overflow: "hidden",
    height: 200,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapExpandButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  mapExpandButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  fullscreenMapContainer: {
    flex: 1,
  },
  fullscreenMap: {
    flex: 1,
  },
  mapCloseButton: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5EA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomPriceContainer: {
    gap: 2,
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A73E8",
  },
  bottomRentLabel: {
    fontSize: 12,
    color: "#666",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  contactButtonDisabled: {
    backgroundColor: "#A0A0A0",
  },
});
