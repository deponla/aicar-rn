import MapSearch from "@/components/MapSearch";
import RichTextEditor, { RichTextEditorRef } from "@/components/RichTextEditor";
import ScreenContainer from "@/components/ScreenContainer";
import { Colors } from "@/constants/theme";
import {
  useGetDistricts,
  useGetNeighborhoods,
  useGetProvinces,
} from "@/query-hooks/useCity";
import { useSendEmailVerification } from "@/query-hooks/useUser";
import { useGetWarehouseById } from "@/query-hooks/useWarehoue";
import {
  usePostWarehouseRequest,
  usePostWarehouseRequestConfirmUpload,
  usePostWarehouseRequestsUploadUrl,
} from "@/query-hooks/useWarehouseRequest";
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
  WarehouseAreaTypes,
  WarehouseCategories,
} from "@/store/useWarehouse";
import { formatPrice } from "@/utils/formatPrice";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const NEUTRAL_ICON_COLOR = "#8E8E93";
const NEUTRAL_ICON_BG = "#F2F2F7";

const parsePrice = (value: string): number => {
  if (!value) return 0;
  return Number(value.replaceAll(/\./g, ""));
};

// İstanbul varsayılan konum
const DEFAULT_REGION: Region = {
  latitude: 41.0082,
  longitude: 28.9784,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

interface SelectedLocation {
  latitude: number;
  longitude: number;
  name?: string;
}

interface WarehouseFormValues {
  title: string;
  description: string;
  price: string;
  rentOrSale: RentOrSale;
  currency: Currency;
  storageTypes: WarehouseCategories[];
  areaTypes: WarehouseAreaTypes[];
  indoorAreaSize: string;
  outdoorAreaSize: string;
  appropriateProducts: AppropriateProductAttributes[];
  securityFeatures: SecurityFeatures[];
  securityCameraTypes: SecurityCameraTypes[];
  detectorAlarmTypes: DetectorAndAlarmTypes[];
  accessTypes: AccessTypes[];
  vehicleAccessibility: VehicleAccesibility[];
  images: ImagePicker.ImagePickerAsset[];
  selectedLocation: SelectedLocation | null;
  addressContent: string;
  city: string;
  district: string;
  neighborhood: string;
  postalCode: string;
}

// ---- Checkbox Component ----
function CheckBoxItem({
  title,
  checked,
  onPress,
  desc,
}: Readonly<{
  title: string;
  checked: boolean;
  onPress: () => void;
  desc?: string;
}>) {
  return (
    <TouchableOpacity
      style={[styles.checkboxItem, checked && styles.checkboxItemChecked]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.checkboxRow}>
        <View
          style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}
        >
          {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        <Text
          style={[styles.checkboxTitle, checked && styles.checkboxTitleChecked]}
        >
          {title}
        </Text>
      </View>
      {desc ? <Text style={styles.checkboxDesc}>{desc}</Text> : null}
    </TouchableOpacity>
  );
}

// ---- Security Camera Options ----
const SECURITY_CAMERA_OPTIONS = [
  {
    label: "Yükleme/Boşaltma Alanı",
    value: SecurityCameraTypes.LOADING_UNLOADING_AREA,
  },
  {
    label: "Ürün Kabul Alanı",
    value: SecurityCameraTypes.PRODUCT_ACCEPTANCE_AREA,
  },
  { label: "Depolama Alanı", value: SecurityCameraTypes.STORAGE_AREA },
  { label: "Açık Alan", value: SecurityCameraTypes.OPEN_AREA },
  { label: "Çevre", value: SecurityCameraTypes.PERIMETER },
  {
    label: "Giriş ve Çevresi",
    value: SecurityCameraTypes.ENTRANCE_AND_SURROUNDINGS,
  },
  {
    label: "Paketleme Bölümü",
    value: SecurityCameraTypes.PACKAGING_SECTION_AND_TABLE,
  },
];

const DETECTOR_ALARM_OPTIONS = [
  { label: "Isı Dedektörü", value: DetectorAndAlarmTypes.Heat },
  { label: "Alev Dedektörü", value: DetectorAndAlarmTypes.Flame },
  { label: "Su Baskını", value: DetectorAndAlarmTypes.Flood },
  { label: "Gaz Kaçağı", value: DetectorAndAlarmTypes.GasLeak },
  { label: "Hırsızlık", value: DetectorAndAlarmTypes.Burglary },
  { label: "Yetkisiz Erişim", value: DetectorAndAlarmTypes.UnauthorizedAccess },
  { label: "Hareket Dedektörü", value: DetectorAndAlarmTypes.Motion },
  { label: "Duman Dedektörü", value: DetectorAndAlarmTypes.Smoke },
];

const ACCESS_TYPE_OPTIONS = [
  { label: "7/24 Erişim", value: AccessTypes._24_7 },
  { label: "Mesai Saatleri", value: AccessTypes.BUSINESS_HOURS },
  { label: "Randevu ile", value: AccessTypes.BY_APPOINTMENT },
];

const CURRENCY_OPTIONS = [
  { label: "₺", value: Currency.TL },
  { label: "$", value: Currency.DOLLAR },
  { label: "€", value: Currency.EURO },
];

// ---- Backdrop Component ----
const renderBackdrop = (props: any) => (
  <BottomSheetBackdrop
    {...props}
    disappearsOnIndex={-1}
    appearsOnIndex={0}
    opacity={0.5}
    pressBehavior="close"
  />
);

// ---- Sub-option BottomSheet Component ----
function SubOptionSheet({
  sheetRef,
  title,
  options,
  selectedValues,
  onToggle,
  onClose,
}: Readonly<{
  sheetRef: React.RefObject<BottomSheet | null>;
  title: string;
  options: { label: string; value: string }[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  onClose: () => void;
}>) {
  const backdropWithClose = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
        onPress={onClose}
      />
    ),
    [onClose],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={["60%"]}
      enablePanDownToClose
      backdropComponent={backdropWithClose}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.bottomSheetIndicator}
      onChange={(index) => {
        if (index === -1) {
          onClose();
        }
      }}
    >
      <BottomSheetView style={styles.subSheetContent}>
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.bottomSheetTitle}>{title}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.bottomSheetCloseButton}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <ScrollView>
          {options.map((opt) => {
            const isSelected = selectedValues.includes(opt.value);
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.subOptionRow,
                  isSelected && styles.subOptionRowSelected,
                ]}
                onPress={() => onToggle(opt.value)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    isSelected && styles.checkboxBoxChecked,
                  ]}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <Text
                  style={[
                    styles.subOptionText,
                    isSelected && { color: Colors.primary },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity
          style={styles.confirmLocationButton}
          onPress={onClose}
        >
          <Text style={styles.confirmLocationButtonText}>Tamam</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

export default function WarehouseEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const router = useRouter();
  const {
    mutateAsync: postWarehouseRequest,
    isPending: isPostingWarehouseRequest,
  } = usePostWarehouseRequest();

  // Fetch existing warehouse data when editing
  const { data: warehouseData, isLoading: isLoadingWarehouse } =
    useGetWarehouseById(id);
  const { mutateAsync: getUploadUrl } = usePostWarehouseRequestsUploadUrl();
  const { mutateAsync: confirmUpload } = usePostWarehouseRequestConfirmUpload();

  // Form state (react-hook-form)
  const {
    control,
    watch,
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<WarehouseFormValues>({
    defaultValues: {
      title: "",
      description: "",
      price: "",
      rentOrSale: RentOrSale.RENT,
      currency: Currency.TL,
      storageTypes: [],
      areaTypes: [],
      indoorAreaSize: "",
      outdoorAreaSize: "",
      appropriateProducts: [],
      securityFeatures: [],
      securityCameraTypes: [],
      detectorAlarmTypes: [],
      accessTypes: [],
      vehicleAccessibility: [],
      images: [],
      selectedLocation: null,
      addressContent: "",
      city: "",
      district: "",
      neighborhood: "",
      postalCode: "",
    },
  });

  const rentOrSale = watch("rentOrSale");
  const currency = watch("currency");
  const storageTypes = watch("storageTypes");
  const areaTypes = watch("areaTypes");
  const appropriateProducts = watch("appropriateProducts");
  const securityFeatures = watch("securityFeatures");
  const securityCameraTypes = watch("securityCameraTypes");
  const detectorAlarmTypes = watch("detectorAlarmTypes");
  const accessTypes = watch("accessTypes");
  const vehicleAccessibility = watch("vehicleAccessibility");
  const images = watch("images");
  const selectedLocation = watch("selectedLocation");
  const city = watch("city");
  const district = watch("district");
  const neighborhood = watch("neighborhood");

  const [isUploading, setIsUploading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Province & District & Neighborhood queries
  const [provinceSearch, setProvinceSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [neighborhoodSearch, setNeighborhoodSearch] = useState("");

  const { data: provincesData } = useGetProvinces({
    filters: { limit: 81, search: provinceSearch || undefined, page: 0 },
  });
  const { data: districtsData } = useGetDistricts({
    filters: {
      provinceId: city,
      limit: 100,
      search: districtSearch || undefined,
      page: 0,
    },
    enabled: !!city,
  });
  const { data: neighborhoodsData } = useGetNeighborhoods({
    filters: {
      districtIds: district,
      limit: 100,
      search: neighborhoodSearch || undefined,
      page: 0,
    },
    enabled: !!district,
  });

  // Image viewer modal
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const imageViewerRef = useRef<FlatList>(null);

  // Section refs for scrolling
  const scrollRef = useRef<ScrollView>(null);
  const richTextRef = useRef<RichTextEditorRef>(null);
  const sectionRefs = useRef<Record<string, View | null>>({});
  const sectionPositions = useRef<Record<string, number>>({});

  // Map region (non-form UI state)
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);

  // BottomSheet refs
  const bottomSheetRef = useRef<BottomSheet>(null);
  const provinceSheetRef = useRef<BottomSheet>(null);
  const districtSheetRef = useRef<BottomSheet>(null);
  const neighborhoodSheetRef = useRef<BottomSheet>(null);
  const cameraSheetRef = useRef<BottomSheet>(null);
  const detectorSheetRef = useRef<BottomSheet>(null);
  const accessSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["95%"], []);
  const pickerSnapPoints = useMemo(() => ["95%"], []);

  const isSale = rentOrSale === RentOrSale.SALE;

  // Pre-fill form when editing an existing warehouse
  useEffect(() => {
    if (!isNew && warehouseData?.result) {
      const w = warehouseData.result;
      setValue("title", w.name ?? "");
      setValue("description", w.description ?? "");
      setValue("price", w.price ? String(w.price) : "");
      setValue("rentOrSale", w.rentOrSale ?? RentOrSale.RENT);
      setValue("currency", w.currency ?? Currency.TL);
      setValue("storageTypes", w.storageType ?? []);
      setValue("areaTypes", w.areaType ?? []);
      setValue(
        "indoorAreaSize",
        w.indoorAreaSize ? String(w.indoorAreaSize) : "",
      );
      setValue(
        "outdoorAreaSize",
        w.outdoorAreaSize ? String(w.outdoorAreaSize) : "",
      );
      setValue("appropriateProducts", w.appropriateProductAttributes ?? []);
      setValue("securityFeatures", w.securityFeatures ?? []);
      setValue("securityCameraTypes", w.securityCameraTypes ?? []);
      setValue("detectorAlarmTypes", w.detectorAndAlarmTypes ?? []);
      setValue("accessTypes", w.accessTypes ?? []);
      setValue("vehicleAccessibility", w.vehicleAccessibility ?? []);

      // Address
      if (w.address) {
        setValue("addressContent", w.address.addressContent ?? "");
        setValue("city", w.address.city ?? "");
        setValue("district", w.address.district ?? "");
        setValue("neighborhood", w.address.neighborhood ?? "");
        setValue("postalCode", w.address.postalCode ?? "");

        // Location
        if (
          w.address.location?.coordinates &&
          w.address.location.coordinates.length === 2
        ) {
          const lng = w.address.location.coordinates[0];
          const lat = w.address.location.coordinates[1];
          setValue("selectedLocation", {
            latitude: lat,
            longitude: lng,
            name: w.address.addressContent ?? "",
          });
          setRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      }

      // Images from existing warehouse (convert to ImagePickerAsset-like objects)
      if (w.images && w.images.length > 0) {
        const existingImages = w.images.map((img) => ({
          uri: img.url,
          fileName: img.key,
          mimeType: img.contentType || "image/jpeg",
          width: 0,
          height: 0,
          type: "image" as const,
          assetId: img.key,
        }));
        setValue("images", existingImages as ImagePicker.ImagePickerAsset[]);
      }
    }
  }, [isNew, warehouseData, setValue]);

  // ---- Location handlers ----
  const handleOpenBottomSheet = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleCloseBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const handleMapPress = (event: {
    nativeEvent: { coordinate: { latitude: number; longitude: number } };
  }) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setValue("selectedLocation", { latitude, longitude });
  };

  const handleLocationSelect = (location: {
    latitude: number;
    longitude: number;
    name: string;
    viewport?: { north: number; south: number; east: number; west: number };
  }) => {
    setValue("selectedLocation", {
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name,
    });
    // Adres alanını seçilen konum adıyla doldur
    setValue("addressContent", location.name || "");
    if (location.viewport) {
      const latDelta = location.viewport.north - location.viewport.south;
      const lngDelta = location.viewport.east - location.viewport.west;
      setRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: latDelta * 1.2,
        longitudeDelta: lngDelta * 1.2,
      });
    } else {
      setRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const handleClearLocation = () => {
    setValue("selectedLocation", null);
  };

  // ---- Toggle helpers ----
  const toggleInArray = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  // ---- Image picker ----
  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 8 - images.length,
    });
    if (!result.canceled && result.assets) {
      setValue("images", [...images, ...result.assets].slice(0, 8));
    }
  };

  const removeImage = (index: number) => {
    setValue(
      "images",
      images.filter((_, i) => i !== index),
    );
  };

  // ---- Upload images ----
  const uploadImages = async (requestId: string) => {
    if (images.length === 0) return;
    setIsUploading(true);
    try {
      for (const img of images) {
        const uploadUrlResponse = await getUploadUrl();
        const formData = new FormData();
        formData.append("file", {
          uri: img.uri,
          name: img.fileName || "photo.jpg",
          type: img.mimeType || "image/jpeg",
        } as unknown as Blob);

        const uploadResponse = await fetch(uploadUrlResponse.url, {
          method: "POST",
          body: formData,
        });
        if (!uploadResponse.ok) {
          throw new Error(`Resim yüklenemedi`);
        }
        await confirmUpload({ id: uploadUrlResponse.id, requestId });
      }
    } catch (error) {
      console.error("Resim yükleme hatası:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // ---- Submit ----
  const scrollToField = (fieldKey: string) => {
    const y = sectionPositions.current[fieldKey];
    if (y !== undefined && scrollRef.current) {
      (scrollRef.current as any).scrollTo({
        y: Math.max(0, y - 120),
        animated: true,
      });
    }
  };

  const handleSave = async () => {
    clearErrors();
    const data = getValues();

    const validationErrors: {
      field: keyof WarehouseFormValues;
      sectionKey: string;
    }[] = [];

    if (!data.selectedLocation) {
      validationErrors.push({
        field: "selectedLocation",
        sectionKey: "location",
      });
    }
    if (data.selectedLocation && !data.city) {
      validationErrors.push({ field: "city", sectionKey: "location" });
    }
    if (data.selectedLocation && !data.district) {
      validationErrors.push({ field: "district", sectionKey: "location" });
    }
    if (!data.title.trim()) {
      validationErrors.push({ field: "title", sectionKey: "title" });
    }
    if (data.images.length === 0) {
      validationErrors.push({ field: "images", sectionKey: "images" });
    }
    if (!data.price.trim()) {
      validationErrors.push({ field: "price", sectionKey: "price" });
    }
    if (data.storageTypes.length === 0) {
      validationErrors.push({
        field: "storageTypes",
        sectionKey: "storageTypes",
      });
    }
    if (data.areaTypes.length === 0) {
      validationErrors.push({ field: "areaTypes", sectionKey: "areaTypes" });
    }
    // Validate indoor area size if INDOOR is selected
    if (
      data.areaTypes.includes(WarehouseAreaTypes.INDOOR) &&
      !data.indoorAreaSize.trim()
    ) {
      validationErrors.push({
        field: "indoorAreaSize",
        sectionKey: "areaTypes",
      });
    }
    // Validate outdoor area size if OUTDOOR is selected
    if (
      data.areaTypes.includes(WarehouseAreaTypes.OUTDOOR) &&
      !data.outdoorAreaSize.trim()
    ) {
      validationErrors.push({
        field: "outdoorAreaSize",
        sectionKey: "areaTypes",
      });
    }
    if (data.appropriateProducts.length === 0) {
      validationErrors.push({
        field: "appropriateProducts",
        sectionKey: "appropriateProducts",
      });
    }

    if (validationErrors.length > 0) {
      for (const err of validationErrors) {
        setError(err.field, { message: "Lütfen burayı doldurunuz" });
      }
      setTimeout(() => scrollToField(validationErrors[0].sectionKey), 100);
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      isNew ? "Depo Kaydet" : "Depo Güncelle",
      isNew
        ? "Depo bilgilerini kaydetmek istediğinize emin misiniz?"
        : "Depo bilgilerini güncellemek istediğinize emin misiniz?",
      [
        {
          text: "İptal",
          style: "cancel",
        },
        {
          text: "Kaydet",
          onPress: () => performSave(data),
        },
      ],
    );
  };

  const performSave = async (data: WarehouseFormValues) => {
    setSaveLoading(true);

    try {
      const requestData = {
        warehouseId: isNew ? undefined : id,
        name: data.title,
        description: data.description || null,
        storageType: data.storageTypes,
        address: {
          location: {
            type: "Point" as const,
            coordinates: [
              data.selectedLocation?.longitude,
              data.selectedLocation?.latitude,
            ] as [number, number],
          },
          addressContent:
            data.addressContent || data.selectedLocation?.name || "",
          country: "Türkiye",
          countryCode: "TR",
          city: data.city,
          district: data.district,
          neighborhood: data.neighborhood,
          postalCode: data.postalCode || "",
          utcOffsetMinutes: undefined,
        },
        price: Number(data.price),
        currency: data.currency,
        rentOrSale: data.rentOrSale,
        areaType: data.areaTypes,
        indoorAreaSize: data.indoorAreaSize ? Number(data.indoorAreaSize) : 0,
        outdoorAreaSize: data.outdoorAreaSize
          ? Number(data.outdoorAreaSize)
          : 0,
        appropriateProductAttributes: data.appropriateProducts,
        securityFeatures: data.securityFeatures,
        securityCameraTypes:
          data.securityCameraTypes.length > 0 ? data.securityCameraTypes : null,
        detectorAndAlarmTypes:
          data.detectorAlarmTypes.length > 0 ? data.detectorAlarmTypes : null,
        accessTypes: data.accessTypes.length > 0 ? data.accessTypes : null,
        vehicleAccessibility: data.vehicleAccessibility,
      };

      const response = await postWarehouseRequest(requestData);
      const warehouseRequestId = response.result.id;

      if (data.images.length > 0) {
        await uploadImages(warehouseRequestId);
      }

      setSaveLoading(false);
      // Navigate to my-warehouses page with unpublished tab active
      router.replace({
        pathname: "/profile/my-warehouses",
        params: { tab: "unpublished", refresh: "true" },
      });
    } catch (error) {
      console.error("Kaydetme hatası:", error);
      setSaveLoading(false);
      Alert.alert("Hata", "Kaydetme sırasında bir hata oluştu.");
    }
  };

  const isSubmitting = isPostingWarehouseRequest || isUploading || saveLoading;

  // Verification gate
  const authUser = useAuthStore((s) => s.user?.user);
  const emailVerified = authUser?.emailVerified ?? false;
  const needsVerification = !emailVerified;
  const { mutateAsync: sendEmailVerification, isPending: isSendingEmail } =
    useSendEmailVerification();

  if (needsVerification) {
    return (
      <View style={styles.rootContainer}>
        <ScreenContainer title="Doğrulama Gerekli" showBackButton>
          <View style={verificationStyles.container}>
            <View style={verificationStyles.iconContainer}>
              <MaterialIcons
                name="verified-user"
                size={64}
                color={NEUTRAL_ICON_COLOR}
              />
            </View>
            <Text style={verificationStyles.title}>Doğrulama Gerekli</Text>
            <Text style={verificationStyles.description}>
              İlan paylaşabilmek için e-posta doğrulamanızı tamamlamanız
              gerekmektedir.
            </Text>

            {/* Email Verification */}
            <View style={verificationStyles.card}>
              <View style={verificationStyles.cardRow}>
                <View
                  style={[
                    verificationStyles.iconBadge,
                    emailVerified
                      ? verificationStyles.iconBadgeSuccess
                      : verificationStyles.iconBadgeWarning,
                  ]}
                >
                  <MaterialIcons
                    name="email"
                    size={20}
                    color={NEUTRAL_ICON_COLOR}
                  />
                </View>
                <View style={verificationStyles.cardTextContainer}>
                  <Text style={verificationStyles.cardTitle}>
                    E-posta Doğrulama
                  </Text>
                  <Text style={verificationStyles.cardSubtitle}>
                    {emailVerified
                      ? "E-posta doğrulandı"
                      : "E-posta adresiniz henüz doğrulanmamış"}
                  </Text>
                </View>
                {emailVerified ? (
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={24}
                    color={NEUTRAL_ICON_COLOR}
                  />
                ) : (
                  <TouchableOpacity
                    style={verificationStyles.actionButton}
                    onPress={async () => {
                      try {
                        await sendEmailVerification();
                        Alert.alert(
                          "Başarılı",
                          "Doğrulama e-postası gönderildi!",
                        );
                      } catch (error) {
                        Alert.alert(
                          "Hata",
                          error instanceof Error
                            ? error.message
                            : "Bir hata oluştu",
                        );
                      }
                    }}
                    disabled={isSendingEmail}
                  >
                    {isSendingEmail ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={verificationStyles.actionButtonText}>
                        Doğrula
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </ScreenContainer>
      </View>
    );
  }

  if (!isNew && isLoadingWarehouse) {
    return (
      <View
        style={[
          styles.rootContainer,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <ScreenContainer
        title={isNew ? "Depo Oluştur" : "Depo Düzenle"}
        showBackButton
        scrollRef={scrollRef}
        onScrollBeginDrag={() => richTextRef.current?.blur()}
        headerRight={
          <TouchableOpacity onPress={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.saveButtonText}>Kaydet</Text>
            )}
          </TouchableOpacity>
        }
      >
        {/* ===== 1. Konum ===== */}
        <View
          style={styles.section}
          ref={(ref) => {
            sectionRefs.current.location = ref;
          }}
          onLayout={(e) => {
            sectionPositions.current.location = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionTitle}>Konum</Text>
          <Text style={styles.sectionDesc}>
            Depolama alanınızın konumunu seçiniz.
          </Text>
          <TouchableOpacity
            style={[
              styles.locationButton,
              errors.selectedLocation && styles.inputError,
            ]}
            onPress={() => {
              handleOpenBottomSheet();
              clearErrors("selectedLocation");
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={selectedLocation ? "location" : "location-outline"}
              size={22}
              color={selectedLocation ? Colors.primary : "#8E8E93"}
            />
            <Text
              style={[
                styles.locationButtonText,
                selectedLocation && styles.locationButtonTextActive,
              ]}
              numberOfLines={1}
            >
              {selectedLocation
                ? selectedLocation.name ||
                `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`
                : "Konum seçmek için dokunun"}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
          {errors.selectedLocation && (
            <Text style={styles.errorText}>
              {errors.selectedLocation.message}
            </Text>
          )}

          {/* Adres Detayları - konum seçildikten sonra göster */}
          {selectedLocation && (
            <View style={styles.addressDetailsContainer}>
              {/* Adres */}
              <Text style={styles.addressFieldLabel}>Adres</Text>
              <Controller
                control={control}
                name="addressContent"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, styles.addressTextArea]}
                    placeholder="Adres detayını giriniz"
                    placeholderTextColor="#8E8E93"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />

              {/* İl / İlçe Row */}
              <View style={styles.addressRow}>
                {/* İl Seçimi */}
                <View style={styles.addressFieldHalf}>
                  <Text style={styles.addressFieldLabel}>İl</Text>
                  <TouchableOpacity
                    style={[
                      styles.pickerButton,
                      errors.city && styles.inputError,
                    ]}
                    onPress={() => {
                      setProvinceSearch("");
                      provinceSheetRef.current?.snapToIndex(0);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.pickerButtonText,
                        city && styles.pickerButtonTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {city
                        ? provincesData?.results?.find((p) => p._id === city)
                          ?.name || "İl Seçin"
                        : "İl Seçin"}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#8E8E93" />
                  </TouchableOpacity>
                  {errors.city && (
                    <Text style={styles.errorText}>Lütfen il seçiniz</Text>
                  )}
                </View>

                {/* İlçe Seçimi */}
                <View style={styles.addressFieldHalf}>
                  <Text style={styles.addressFieldLabel}>İlçe</Text>
                  <TouchableOpacity
                    style={[
                      styles.pickerButton,
                      !city && styles.pickerButtonDisabled,
                      errors.district && styles.inputError,
                    ]}
                    onPress={() => {
                      if (!city) return;
                      setDistrictSearch("");
                      districtSheetRef.current?.snapToIndex(0);
                    }}
                    activeOpacity={city ? 0.7 : 1}
                  >
                    <Text
                      style={[
                        styles.pickerButtonText,
                        district && styles.pickerButtonTextActive,
                        !city && { color: "#C7C7CC" },
                      ]}
                      numberOfLines={1}
                    >
                      {district
                        ? districtsData?.results?.find(
                          (d) => d._id === district,
                        )?.name || "İlçe Seçin"
                        : "İlçe Seçin"}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color={city ? "#8E8E93" : "#C7C7CC"}
                    />
                  </TouchableOpacity>
                  {errors.district && (
                    <Text style={styles.errorText}>Lütfen ilçe seçiniz</Text>
                  )}
                </View>
              </View>

              {/* Mahalle Seçimi */}
              <Text style={styles.addressFieldLabel}>Mahalle</Text>
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  !district && styles.pickerButtonDisabled,
                  errors.neighborhood && styles.inputError,
                ]}
                onPress={() => {
                  if (!district) return;
                  setNeighborhoodSearch("");
                  neighborhoodSheetRef.current?.snapToIndex(0);
                }}
                activeOpacity={district ? 0.7 : 1}
              >
                <Text
                  style={[
                    styles.pickerButtonText,
                    neighborhood && styles.pickerButtonTextActive,
                    !district && { color: "#C7C7CC" },
                  ]}
                  numberOfLines={1}
                >
                  {neighborhood
                    ? neighborhoodsData?.results?.find(
                      (n) => n._id === neighborhood,
                    )?.name || "Mahalle Seçin"
                    : "Mahalle Seçin"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={district ? "#8E8E93" : "#C7C7CC"}
                />
              </TouchableOpacity>
              {errors.neighborhood && (
                <Text style={styles.errorText}>Lütfen mahalle seçiniz</Text>
              )}

              {/* Posta Kodu */}
              <Text style={styles.addressFieldLabel}>Posta Kodu</Text>
              <Controller
                control={control}
                name="postalCode"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Posta kodunu giriniz"
                    placeholderTextColor="#8E8E93"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                    maxLength={10}
                  />
                )}
              />
            </View>
          )}
        </View>

        {/* ===== 2. İlan Başlığı ===== */}
        <View
          style={styles.section}
          onLayout={(e) => {
            sectionPositions.current.title = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionTitle}>İlan Başlığı</Text>
          <Text style={styles.sectionDesc}>
            Depolama alanınızın ünvanını giriniz.
          </Text>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="Örn. Merkezi Konumda 500m² Depo"
                placeholderTextColor="#8E8E93"
                value={value}
                onChangeText={(text) => {
                  onChange(text);
                  if (errors.title) clearErrors("title");
                }}
                maxLength={100}
              />
            )}
          />
          {errors.title && (
            <Text style={styles.errorText}>{errors.title.message}</Text>
          )}
        </View>

        {/* ===== 3. Fotoğraflar ===== */}
        <View
          style={styles.section}
          onLayout={(e) => {
            sectionPositions.current.images = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionTitle}>İlan Fotoğrafları</Text>
          <Text style={styles.sectionDesc}>
            Depolama alanınızın fotoğraflarını ekleyiniz. (Maks. 8)
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.imageScrollContainer, { overflow: "visible" }]}
            contentContainerStyle={{ paddingTop: 8, paddingRight: 8 }}
          >
            {images.map((img, index) => (
              <View key={`img-${index}`} style={styles.imageWrapper}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setImageViewerIndex(index);
                    setImageViewerVisible(true);
                  }}
                >
                  <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.imageRemoveButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={22} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 8 && (
              <TouchableOpacity
                style={[styles.photoButton, errors.images && styles.inputError]}
                onPress={() => {
                  pickImages();
                  clearErrors("images");
                }}
              >
                <MaterialIcons
                  name="add-a-photo"
                  size={28}
                  color={errors.images ? "#FF3B30" : "#8E8E93"}
                />
                <Text
                  style={[
                    styles.photoButtonText,
                    errors.images && { color: "#FF3B30" },
                  ]}
                >
                  Ekle
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          {errors.images && (
            <Text style={styles.errorText}>{errors.images.message}</Text>
          )}
        </View>

        {/* ===== 4. Fiyat ===== */}
        <View
          style={styles.section}
          onLayout={(e) => {
            sectionPositions.current.price = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionTitle}>
            {isSale ? "Satış Fiyatı" : "Aylık Fiyat"}
          </Text>
          <Text style={styles.sectionDesc}>
            {isSale
              ? "Depolama alanınız için satış fiyatını giriniz."
              : "Depolama alanınız için aylık kira bedelini giriniz."}
          </Text>

          {/* Rent / Sale Toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                rentOrSale === RentOrSale.RENT && styles.toggleButtonActive,
              ]}
              onPress={() => setValue("rentOrSale", RentOrSale.RENT)}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  rentOrSale === RentOrSale.RENT &&
                  styles.toggleButtonTextActive,
                ]}
              >
                Kiralık
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                rentOrSale === RentOrSale.SALE && styles.toggleButtonActive,
              ]}
              onPress={() => setValue("rentOrSale", RentOrSale.SALE)}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  rentOrSale === RentOrSale.SALE &&
                  styles.toggleButtonTextActive,
                ]}
              >
                Satılık
              </Text>
            </TouchableOpacity>
          </View>

          {/* Price + Currency */}
          <View style={styles.priceRow}>
            <Controller
              control={control}
              name="price"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    styles.priceInput,
                    errors.price && styles.inputError,
                  ]}
                  placeholder="Örn. 15.000"
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric"
                  value={formatPrice(value)}
                  onChangeText={(text) => {
                    const cleanValue = parsePrice(text);
                    onChange(String(cleanValue));
                    if (errors.price) clearErrors("price");
                  }}
                />
              )}
            />
            <View style={styles.currencyRow}>
              {CURRENCY_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[
                    styles.currencyButton,
                    currency === c.value && styles.currencyButtonActive,
                  ]}
                  onPress={() => setValue("currency", c.value)}
                >
                  <Text
                    style={[
                      styles.currencyButtonText,
                      currency === c.value && styles.currencyButtonTextActive,
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {errors.price && (
            <Text style={styles.errorText}>{errors.price.message}</Text>
          )}
        </View>

        {/* ===== 5. Açıklama ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Açıklama</Text>
          <Text style={styles.sectionDesc}>
            Depolama alanınız hakkında detaylı bilgi veriniz.
          </Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <RichTextEditor
                ref={richTextRef}
                initialValue={value}
                onChange={onChange}
                placeholder="Depolama alanınız hakkında açıklama yazınız..."
                minHeight={200}
              />
            )}
          />
        </View>

        {/* ===== 6. Depolama Tipi ===== */}
        <View
          style={styles.section}
          onLayout={(e) => {
            sectionPositions.current.storageTypes = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionTitle}>Depolama Tipi</Text>
          <Text style={styles.sectionDesc}>
            Depolama alanınızın tipini seçiniz.
          </Text>
          <View
            style={[
              styles.checkboxGrid,
              errors.storageTypes && styles.checkboxGridError,
            ]}
          >
            {STORAGE_TYPES.map((type) => (
              <CheckBoxItem
                key={type.value}
                title={type.label}
                checked={storageTypes.includes(type.value)}
                onPress={() => {
                  setValue(
                    "storageTypes",
                    toggleInArray(storageTypes, type.value),
                  );
                  if (errors.storageTypes) clearErrors("storageTypes");
                }}
              />
            ))}
          </View>
          {errors.storageTypes && (
            <Text style={styles.errorText}>{errors.storageTypes.message}</Text>
          )}
        </View>

        {/* ===== 7. Alan Türü ===== */}
        <View
          style={styles.section}
          onLayout={(e) => {
            sectionPositions.current.areaTypes = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionTitle}>Alan Türü</Text>
          <Text style={styles.sectionDesc}>
            Depolama alanınıza uygun alan türlerini seçiniz.
          </Text>

          {/* Kapalı Alan */}
          <TouchableOpacity
            style={[
              styles.areaTypeCard,
              areaTypes.includes(WarehouseAreaTypes.INDOOR) &&
              styles.areaTypeCardActive,
              errors.areaTypes && styles.areaTypeCardError,
            ]}
            onPress={() => {
              setValue(
                "areaTypes",
                toggleInArray(areaTypes, WarehouseAreaTypes.INDOOR),
              );
              if (errors.areaTypes) clearErrors("areaTypes");
            }}
            activeOpacity={0.7}
          >
            <View style={styles.checkboxRow}>
              <View
                style={[
                  styles.checkboxBox,
                  areaTypes.includes(WarehouseAreaTypes.INDOOR) &&
                  styles.checkboxBoxChecked,
                ]}
              >
                {areaTypes.includes(WarehouseAreaTypes.INDOOR) && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>
              <Text style={styles.areaTypeTitle}>Kapalı Alan</Text>
            </View>
            <Text style={styles.areaTypeDesc}>
              Üstü kapalı, dört duvarla çevrili depolama alanı.
            </Text>
            {areaTypes.includes(WarehouseAreaTypes.INDOOR) && (
              <View style={styles.areaSizeRow}>
                <Text style={styles.areaSizeLabel}>m²</Text>
                <Controller
                  control={control}
                  name="indoorAreaSize"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        styles.areaSizeInput,
                        errors.indoorAreaSize && styles.areaSizeInputError,
                      ]}
                      placeholder="Toplam m² giriniz"
                      placeholderTextColor="#8E8E93"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={(text) => {
                        onChange(text);
                        if (errors.indoorAreaSize)
                          clearErrors("indoorAreaSize");
                      }}
                    />
                  )}
                />
              </View>
            )}
            {errors.indoorAreaSize && (
              <Text style={[styles.errorText, { marginLeft: 32 }]}>
                {errors.indoorAreaSize.message}
              </Text>
            )}
          </TouchableOpacity>

          {/* Açık Alan */}
          <TouchableOpacity
            style={[
              styles.areaTypeCard,
              areaTypes.includes(WarehouseAreaTypes.OUTDOOR) &&
              styles.areaTypeCardActive,
              errors.areaTypes && styles.areaTypeCardError,
              { marginTop: 12 },
            ]}
            onPress={() => {
              setValue(
                "areaTypes",
                toggleInArray(areaTypes, WarehouseAreaTypes.OUTDOOR),
              );
              if (errors.areaTypes) clearErrors("areaTypes");
            }}
            activeOpacity={0.7}
          >
            <View style={styles.checkboxRow}>
              <View
                style={[
                  styles.checkboxBox,
                  areaTypes.includes(WarehouseAreaTypes.OUTDOOR) &&
                  styles.checkboxBoxChecked,
                ]}
              >
                {areaTypes.includes(WarehouseAreaTypes.OUTDOOR) && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>
              <Text style={styles.areaTypeTitle}>Açık Alan</Text>
            </View>
            <Text style={styles.areaTypeDesc}>
              Üstü açık, çevresi açık veya kısmen kapalı depolama alanı.
            </Text>
            {areaTypes.includes(WarehouseAreaTypes.OUTDOOR) && (
              <View style={styles.areaSizeRow}>
                <Text style={styles.areaSizeLabel}>m²</Text>
                <Controller
                  control={control}
                  name="outdoorAreaSize"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        styles.areaSizeInput,
                        errors.outdoorAreaSize && styles.areaSizeInputError,
                      ]}
                      placeholder="Toplam m² giriniz"
                      placeholderTextColor="#8E8E93"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={(text) => {
                        onChange(text);
                        if (errors.outdoorAreaSize)
                          clearErrors("outdoorAreaSize");
                      }}
                    />
                  )}
                />
              </View>
            )}
            {errors.outdoorAreaSize && (
              <Text style={[styles.errorText, { marginLeft: 32 }]}>
                {errors.outdoorAreaSize.message}
              </Text>
            )}
          </TouchableOpacity>
          {errors.areaTypes && (
            <Text style={styles.errorText}>{errors.areaTypes.message}</Text>
          )}
        </View>

        {/* ===== 8. Uygun Ürün Nitelikleri ===== */}
        <View
          style={styles.section}
          onLayout={(e) => {
            sectionPositions.current.appropriateProducts =
              e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionTitle}>Uygun Ürün Nitelikleri</Text>
          <Text style={styles.sectionDesc}>
            Depolamanız için uygun olan ürün niteliklerini seçiniz.
          </Text>
          <View
            style={[
              styles.checkboxGrid,
              errors.appropriateProducts && styles.checkboxGridError,
            ]}
          >
            <CheckBoxItem
              title="Normal Ürün"
              checked={appropriateProducts.includes(
                AppropriateProductAttributes.NORMAL_PRODUCT,
              )}
              onPress={() => {
                setValue(
                  "appropriateProducts",
                  toggleInArray(
                    appropriateProducts,
                    AppropriateProductAttributes.NORMAL_PRODUCT,
                  ),
                );
                if (errors.appropriateProducts)
                  clearErrors("appropriateProducts");
              }}
            />
            <CheckBoxItem
              title="Soğuk Zincir"
              checked={appropriateProducts.includes(
                AppropriateProductAttributes.COLD_CHAIN_PRODUCT,
              )}
              onPress={() => {
                setValue(
                  "appropriateProducts",
                  toggleInArray(
                    appropriateProducts,
                    AppropriateProductAttributes.COLD_CHAIN_PRODUCT,
                  ),
                );
                if (errors.appropriateProducts)
                  clearErrors("appropriateProducts");
              }}
            />
            <CheckBoxItem
              title="Askılı Ürün"
              checked={appropriateProducts.includes(
                AppropriateProductAttributes.HANGING_PRODUCT,
              )}
              onPress={() => {
                setValue(
                  "appropriateProducts",
                  toggleInArray(
                    appropriateProducts,
                    AppropriateProductAttributes.HANGING_PRODUCT,
                  ),
                );
                if (errors.appropriateProducts)
                  clearErrors("appropriateProducts");
              }}
            />
            <CheckBoxItem
              title="Tehlikeli Ürün"
              checked={appropriateProducts.includes(
                AppropriateProductAttributes.DANGEROUS_PRODUCT,
              )}
              onPress={() => {
                setValue(
                  "appropriateProducts",
                  toggleInArray(
                    appropriateProducts,
                    AppropriateProductAttributes.DANGEROUS_PRODUCT,
                  ),
                );
                if (errors.appropriateProducts)
                  clearErrors("appropriateProducts");
              }}
            />
          </View>
          {errors.appropriateProducts && (
            <Text style={styles.errorText}>
              {errors.appropriateProducts.message}
            </Text>
          )}
        </View>

        {/* ===== 9. Güvenlik ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Güvenlik</Text>
          <Text style={styles.sectionDesc}>
            Depolama alanınızda bulunan güvenlik özelliklerini seçiniz.
          </Text>
          <View style={styles.checkboxGrid}>
            {/* Güvenlik Kamerası */}
            <CheckBoxItem
              title="Güvenlik Kamerası"
              checked={securityFeatures.includes(SecurityFeatures.CAMERA)}
              desc={
                securityFeatures.includes(SecurityFeatures.CAMERA) &&
                  securityCameraTypes.length > 0
                  ? `${securityCameraTypes.length} seçenek`
                  : undefined
              }
              onPress={() => {
                const newFeatures = toggleInArray(
                  securityFeatures,
                  SecurityFeatures.CAMERA,
                );
                setValue("securityFeatures", newFeatures);
                if (newFeatures.includes(SecurityFeatures.CAMERA)) {
                  cameraSheetRef.current?.expand();
                } else {
                  setValue("securityCameraTypes", []);
                }
              }}
            />
            {/* Detektör ve Alarm */}
            <CheckBoxItem
              title="Detektör ve Alarm"
              checked={securityFeatures.includes(
                SecurityFeatures.DETECTOR_AND_ALARM,
              )}
              desc={
                securityFeatures.includes(
                  SecurityFeatures.DETECTOR_AND_ALARM,
                ) && detectorAlarmTypes.length > 0
                  ? `${detectorAlarmTypes.length} seçenek`
                  : undefined
              }
              onPress={() => {
                const newFeatures = toggleInArray(
                  securityFeatures,
                  SecurityFeatures.DETECTOR_AND_ALARM,
                );
                setValue("securityFeatures", newFeatures);
                if (newFeatures.includes(SecurityFeatures.DETECTOR_AND_ALARM)) {
                  detectorSheetRef.current?.expand();
                } else {
                  setValue("detectorAlarmTypes", []);
                }
              }}
            />
            {/* Sigorta */}
            <CheckBoxItem
              title="Sigorta"
              checked={securityFeatures.includes(SecurityFeatures.INSURANCE)}
              onPress={() =>
                setValue(
                  "securityFeatures",
                  toggleInArray(securityFeatures, SecurityFeatures.INSURANCE),
                )
              }
            />
            {/* Erişebilirlik */}
            <CheckBoxItem
              title="Erişebilirlik"
              checked={securityFeatures.includes(SecurityFeatures.ACCESS_TYPE)}
              desc={
                securityFeatures.includes(SecurityFeatures.ACCESS_TYPE) &&
                  accessTypes.length > 0
                  ? `${accessTypes.length} seçenek`
                  : undefined
              }
              onPress={() => {
                const newFeatures = toggleInArray(
                  securityFeatures,
                  SecurityFeatures.ACCESS_TYPE,
                );
                setValue("securityFeatures", newFeatures);
                if (newFeatures.includes(SecurityFeatures.ACCESS_TYPE)) {
                  accessSheetRef.current?.expand();
                } else {
                  setValue("accessTypes", []);
                }
              }}
            />
          </View>
        </View>

        {/* ===== 10. Erişebilen Araçlar ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Erişebilen Araçlar</Text>
          <Text style={styles.sectionDesc}>
            Depolama alanınıza erişebilen araç türlerini seçiniz.
          </Text>
          <View style={styles.checkboxGrid}>
            {VEHICLE_ACCESSIBILITY_OPTIONS.map((type) => (
              <CheckBoxItem
                key={type.value}
                title={type.label}
                checked={vehicleAccessibility.includes(type.value)}
                onPress={() =>
                  setValue(
                    "vehicleAccessibility",
                    toggleInArray(vehicleAccessibility, type.value),
                  )
                }
              />
            ))}
          </View>
        </View>

        {/* ===== Submit Button ===== */}
        <TouchableOpacity
          style={[
            styles.createButton,
            isSubmitting && styles.createButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>
              {isNew ? "Depo Oluştur" : "Depo Güncelle"}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScreenContainer>

      {/* ===== Konum Seçim BottomSheet ===== */}
      <View style={styles.bottomSheetPortal} pointerEvents="box-none">
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.bottomSheetIndicator}
        >
          <BottomSheetView style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Konum Seç</Text>
              <TouchableOpacity
                onPress={handleCloseBottomSheet}
                style={styles.bottomSheetCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSheetSearchWrapper}>
              <MapSearch onLocationSelect={handleLocationSelect} />
            </View>

            <View style={styles.bottomSheetMapContainer}>
              <MapView
                style={styles.bottomSheetMap}
                provider={
                  Platform.OS === "android" ? PROVIDER_GOOGLE : undefined
                }
                region={region}
                onRegionChangeComplete={setRegion}
                onPress={handleMapPress}
                showsUserLocation
                showsMyLocationButton
              >
                {selectedLocation && (
                  <Marker
                    coordinate={{
                      latitude: selectedLocation.latitude,
                      longitude: selectedLocation.longitude,
                    }}
                    draggable
                    onDragEnd={(e) =>
                      setValue("selectedLocation", {
                        ...selectedLocation,
                        latitude: e.nativeEvent.coordinate.latitude,
                        longitude: e.nativeEvent.coordinate.longitude,
                      })
                    }
                  />
                )}
              </MapView>
              {!selectedLocation && (
                <View style={styles.mapOverlayHint}>
                  <Ionicons name="finger-print" size={20} color="#fff" />
                  <Text style={styles.mapOverlayHintText}>
                    Haritaya dokunarak konum seçin
                  </Text>
                </View>
              )}
            </View>

            {selectedLocation && (
              <View style={styles.selectedLocationBar}>
                <View style={styles.selectedLocationInfo}>
                  <Ionicons name="location" size={20} color={Colors.primary} />
                  <Text style={styles.selectedLocationText} numberOfLines={2}>
                    {selectedLocation.name ||
                      `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleClearLocation}
                  style={styles.clearSelectedButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.confirmLocationButton,
                !selectedLocation && styles.confirmLocationButtonDisabled,
              ]}
              onPress={handleCloseBottomSheet}
              disabled={!selectedLocation}
            >
              <Text style={styles.confirmLocationButtonText}>
                {selectedLocation ? "Konumu Onayla" : "Lütfen konum seçin"}
              </Text>
            </TouchableOpacity>
          </BottomSheetView>
        </BottomSheet>

        {/* İl Seçim BottomSheet */}
        <BottomSheet
          ref={provinceSheetRef}
          index={-1}
          snapPoints={pickerSnapPoints}
          enableDynamicSizing={false}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.bottomSheetIndicator}
          onChange={(index) => {
            if (index === -1) setProvinceSearch("");
          }}
        >
          <View style={styles.subSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>İl Seçin</Text>
              <TouchableOpacity
                onPress={() => provinceSheetRef.current?.close()}
                style={styles.bottomSheetCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.pickerSearchContainer}>
              <Ionicons name="search" size={18} color="#8E8E93" />
              <BottomSheetTextInput
                style={styles.pickerSearchInput}
                placeholder="İl ara..."
                placeholderTextColor="#8E8E93"
                value={provinceSearch}
                onChangeText={setProvinceSearch}
                autoCorrect={false}
              />
              {provinceSearch.length > 0 && (
                <TouchableOpacity onPress={() => setProvinceSearch("")}>
                  <Ionicons name="close-circle" size={18} color="#C7C7CC" />
                </TouchableOpacity>
              )}
            </View>
            <BottomSheetScrollView
              contentContainerStyle={styles.pickerListContent}
              keyboardShouldPersistTaps="handled"
            >
              {provincesData?.results?.map((province) => {
                const isSelected = city === province._id;
                return (
                  <TouchableOpacity
                    key={province._id}
                    style={[
                      styles.pickerItem,
                      isSelected && styles.pickerItemSelected,
                    ]}
                    onPress={() => {
                      setValue("city", province._id);
                      setValue("district", "");
                      setValue("neighborhood", "");
                      setProvinceSearch("");
                      provinceSheetRef.current?.close();
                      if (errors.city) clearErrors("city");
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        isSelected && styles.pickerItemTextSelected,
                      ]}
                    >
                      {province.name}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={Colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </BottomSheetScrollView>
          </View>
        </BottomSheet>

        {/* İlçe Seçim BottomSheet */}
        <BottomSheet
          ref={districtSheetRef}
          index={-1}
          snapPoints={pickerSnapPoints}
          enableDynamicSizing={false}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.bottomSheetIndicator}
          onChange={(index) => {
            if (index === -1) setDistrictSearch("");
          }}
        >
          <View style={styles.subSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>İlçe Seçin</Text>
              <TouchableOpacity
                onPress={() => districtSheetRef.current?.close()}
                style={styles.bottomSheetCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.pickerSearchContainer}>
              <Ionicons name="search" size={18} color="#8E8E93" />
              <BottomSheetTextInput
                style={styles.pickerSearchInput}
                placeholder="İlçe ara..."
                placeholderTextColor="#8E8E93"
                value={districtSearch}
                onChangeText={setDistrictSearch}
                autoCorrect={false}
              />
              {districtSearch.length > 0 && (
                <TouchableOpacity onPress={() => setDistrictSearch("")}>
                  <Ionicons name="close-circle" size={18} color="#C7C7CC" />
                </TouchableOpacity>
              )}
            </View>
            <BottomSheetScrollView
              contentContainerStyle={styles.pickerListContent}
              keyboardShouldPersistTaps="handled"
            >
              {districtsData?.results?.map((districtItem) => {
                const isSelected = district === districtItem._id;
                return (
                  <TouchableOpacity
                    key={districtItem._id}
                    style={[
                      styles.pickerItem,
                      isSelected && styles.pickerItemSelected,
                    ]}
                    onPress={() => {
                      setValue("district", districtItem._id);
                      setValue("neighborhood", "");
                      setDistrictSearch("");
                      districtSheetRef.current?.close();
                      if (errors.district) clearErrors("district");
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        isSelected && styles.pickerItemTextSelected,
                      ]}
                    >
                      {districtItem.name}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={Colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </BottomSheetScrollView>
          </View>
        </BottomSheet>

        {/* Mahalle Seçim BottomSheet */}
        <BottomSheet
          ref={neighborhoodSheetRef}
          index={-1}
          snapPoints={pickerSnapPoints}
          enableDynamicSizing={false}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.bottomSheetIndicator}
          onChange={(index) => {
            if (index === -1) setNeighborhoodSearch("");
          }}
        >
          <View style={styles.subSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Mahalle Seçin</Text>
              <TouchableOpacity
                onPress={() => neighborhoodSheetRef.current?.close()}
                style={styles.bottomSheetCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.pickerSearchContainer}>
              <Ionicons name="search" size={18} color="#8E8E93" />
              <BottomSheetTextInput
                style={styles.pickerSearchInput}
                placeholder="Mahalle ara..."
                placeholderTextColor="#8E8E93"
                value={neighborhoodSearch}
                onChangeText={setNeighborhoodSearch}
                autoCorrect={false}
              />
              {neighborhoodSearch.length > 0 && (
                <TouchableOpacity onPress={() => setNeighborhoodSearch("")}>
                  <Ionicons name="close-circle" size={18} color="#C7C7CC" />
                </TouchableOpacity>
              )}
            </View>
            <BottomSheetScrollView
              contentContainerStyle={styles.pickerListContent}
              keyboardShouldPersistTaps="handled"
            >
              {neighborhoodsData?.results?.map((neighborhoodItem) => {
                const isSelected = neighborhood === neighborhoodItem._id;
                return (
                  <TouchableOpacity
                    key={neighborhoodItem._id}
                    style={[
                      styles.pickerItem,
                      isSelected && styles.pickerItemSelected,
                    ]}
                    onPress={() => {
                      setValue("neighborhood", neighborhoodItem._id);
                      setNeighborhoodSearch("");
                      neighborhoodSheetRef.current?.close();
                      if (errors.neighborhood) clearErrors("neighborhood");
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        isSelected && styles.pickerItemTextSelected,
                      ]}
                    >
                      {neighborhoodItem.name}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={Colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </BottomSheetScrollView>
          </View>
        </BottomSheet>

        {/* Sub-option sheets */}
        <SubOptionSheet
          sheetRef={cameraSheetRef}
          title="Güvenlik Kamerası Türleri"
          options={SECURITY_CAMERA_OPTIONS}
          selectedValues={securityCameraTypes}
          onToggle={(val) =>
            setValue(
              "securityCameraTypes",
              toggleInArray(securityCameraTypes, val as SecurityCameraTypes),
            )
          }
          onClose={() => {
            cameraSheetRef.current?.close();
            if (getValues("securityCameraTypes").length === 0) {
              setValue(
                "securityFeatures",
                getValues("securityFeatures").filter(
                  (f) => f !== SecurityFeatures.CAMERA,
                ),
              );
            }
          }}
        />
        <SubOptionSheet
          sheetRef={detectorSheetRef}
          title="Detektör ve Alarm Türleri"
          options={DETECTOR_ALARM_OPTIONS}
          selectedValues={detectorAlarmTypes}
          onToggle={(val) =>
            setValue(
              "detectorAlarmTypes",
              toggleInArray(detectorAlarmTypes, val as DetectorAndAlarmTypes),
            )
          }
          onClose={() => {
            detectorSheetRef.current?.close();
            if (getValues("detectorAlarmTypes").length === 0) {
              setValue(
                "securityFeatures",
                getValues("securityFeatures").filter(
                  (f) => f !== SecurityFeatures.DETECTOR_AND_ALARM,
                ),
              );
            }
          }}
        />
        <SubOptionSheet
          sheetRef={accessSheetRef}
          title="Erişim Türleri"
          options={ACCESS_TYPE_OPTIONS}
          selectedValues={accessTypes}
          onToggle={(val) =>
            setValue(
              "accessTypes",
              toggleInArray(accessTypes, val as AccessTypes),
            )
          }
          onClose={() => {
            accessSheetRef.current?.close();
            if (getValues("accessTypes").length === 0) {
              setValue(
                "securityFeatures",
                getValues("securityFeatures").filter(
                  (f) => f !== SecurityFeatures.ACCESS_TYPE,
                ),
              );
            }
          }}
        />
      </View>

      {/* Fullscreen Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.imageViewerOverlay}>
          {/* Header */}
          <View style={styles.imageViewerHeader}>
            <TouchableOpacity
              onPress={() => setImageViewerVisible(false)}
              style={styles.imageViewerCloseBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.imageViewerCounter}>
              {imageViewerIndex + 1} / {images.length}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Swipeable Images */}
          <FlatList
            ref={imageViewerRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={imageViewerIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
              );
              setImageViewerIndex(newIndex);
            }}
            keyExtractor={(_, index) => `viewer-${index}`}
            renderItem={({ item }) => (
              <View style={styles.imageViewerSlide}>
                <Image
                  source={{ uri: item.uri }}
                  style={styles.imageViewerImage}
                  resizeMode="contain"
                />
              </View>
            )}
          />
        </View>
      </Modal>

      {/* Loading Overlay Modal */}
      <Modal visible={saveLoading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Depo kaydediliyor...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  saveButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSheetPortal: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "black",
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: "#FF3B30",
    marginTop: 6,
    fontWeight: "500",
  },
  inputError: {
    borderColor: "#FF3B30",
    borderWidth: 1.5,
  },
  checkboxGridError: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#FF3B30",
    padding: 6,
    margin: -6,
  },
  areaTypeCardError: {
    borderColor: "#FF3B30",
    borderWidth: 1.5,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1C1C1E",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  // ---- Image picker styles ----
  imageScrollContainer: {
    flexDirection: "row",
    overflow: "visible",
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 10,
    position: "relative",
    overflow: "visible",
    zIndex: 10,
  },
  imageThumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  imageRemoveButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#fff",
    borderRadius: 11,
    zIndex: 10,
    elevation: 10,
  },
  photoButton: {
    width: 100,
    height: 100,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D1D6",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  photoButtonText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  // ---- Price section ----
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#8E8E93",
  },
  toggleButtonTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  priceRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  priceInput: {
    flex: 1,
  },
  currencyRow: {
    flexDirection: "row",
    gap: 6,
  },
  currencyButton: {
    width: 40,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  currencyButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "15",
  },
  currencyButtonText: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "600",
  },
  currencyButtonTextActive: {
    color: Colors.primary,
  },
  // ---- Checkbox grid ----
  checkboxGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  checkboxItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: (SCREEN_WIDTH - 62) / 2,
    flexGrow: 1,
  },
  checkboxItemChecked: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "08",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D1D6",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1C1C1E",
  },
  checkboxTitleChecked: {
    color: Colors.primary,
    fontWeight: "600",
  },
  checkboxDesc: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 4,
    marginLeft: 32,
  },
  // ---- Area type cards ----
  areaTypeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    padding: 16,
  },
  areaTypeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "08",
  },
  areaTypeTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  areaTypeDesc: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 6,
    marginLeft: 32,
  },
  areaSizeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    marginLeft: 32,
  },
  areaSizeLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primary,
  },
  areaSizeInput: {
    flex: 1,
    paddingVertical: 10,
  },
  // ---- Create button ----
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // ---- Location button ----
  locationButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  locationButtonText: {
    flex: 1,
    fontSize: 16,
    color: "#8E8E93",
  },
  locationButtonTextActive: {
    color: "#1C1C1E",
  },
  // ---- BottomSheet ----
  bottomSheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetIndicator: {
    backgroundColor: "#D1D1D6",
    width: 36,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginBottom: 12,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  bottomSheetCloseButton: {
    padding: 4,
  },
  bottomSheetSearchWrapper: {
    marginBottom: 12,
    zIndex: 10,
  },
  bottomSheetMapContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    position: "relative",
  },
  bottomSheetMap: {
    flex: 1,
    minHeight: SCREEN_HEIGHT * 0.45,
  },
  mapOverlayHint: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mapOverlayHintText: {
    color: "#fff",
    fontSize: 14,
  },
  selectedLocationBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 10,
  },
  selectedLocationInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectedLocationText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  clearSelectedButton: {
    padding: 6,
  },
  confirmLocationButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  confirmLocationButtonDisabled: {
    backgroundColor: "#C7C7CC",
  },
  confirmLocationButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // ---- Address Details ----
  addressDetailsContainer: {
    marginTop: 16,
    gap: 4,
  },
  addressFieldLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#1C1C1E",
    marginBottom: 4,
    marginTop: 8,
  },
  addressTextArea: {
    minHeight: 72,
    paddingTop: 12,
  },
  addressRow: {
    flexDirection: "row" as const,
    gap: 12,
  },
  addressFieldHalf: {
    flex: 1,
  },
  // ---- Picker Button ----
  pickerButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  pickerButtonDisabled: {
    backgroundColor: "#F9F9F9",
    borderColor: "#ECECEC",
  },
  pickerButtonText: {
    fontSize: 15,
    color: "#8E8E93",
    flex: 1,
  },
  pickerButtonTextActive: {
    color: "#1C1C1E",
  },
  // ---- Picker BottomSheet ----
  pickerSearchContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 8,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
    color: "#1C1C1E",
  },
  pickerListContent: {
    paddingBottom: 20,
  },
  pickerItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 2,
  },
  pickerItemSelected: {
    backgroundColor: Colors.primary + "10",
  },
  pickerItemText: {
    fontSize: 16,
    color: "#1C1C1E",
  },
  pickerItemTextSelected: {
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  // ---- Sub-option sheet ----
  subSheetContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  subOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  subOptionRowSelected: {
    backgroundColor: Colors.primary + "10",
  },
  subOptionText: {
    fontSize: 15,
    color: "#1C1C1E",
  },
  // Image Viewer Modal
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
  },
  imageViewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  imageViewerCloseBtn: {
    width: 28,
    alignItems: "center",
  },
  imageViewerCounter: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  imageViewerSlide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
  // Loading Overlay
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  // Area Size Input Error
  areaSizeInputError: {
    borderColor: "#FF3B30",
    borderWidth: 1.5,
  },
});

const verificationStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBadgeSuccess: {
    backgroundColor: NEUTRAL_ICON_BG,
  },
  iconBadgeWarning: {
    backgroundColor: NEUTRAL_ICON_BG,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
