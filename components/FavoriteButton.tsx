import { useNotification } from "@/components/Notification";
import {
  useCreateFavoriteCategory,
  useGetFavoriteCategories,
} from "@/query-hooks/useFavoriteCategories";
import {
  useCreateFavorite,
  useDeleteFavorite,
  useGetFavorites,
} from "@/query-hooks/useFavorites";
import { useAuthStore } from "@/store/useAuth";
import { AuthStatusEnum } from "@/types/auth";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FavoriteButtonProps {
  readonly warehouseId: string;
  readonly size?: number;
  readonly style?: object;
}

export default function FavoriteButton({
  warehouseId,
  size = 22,
  style,
}: FavoriteButtonProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const auth = useAuthStore();
  const { notify } = useNotification();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [addingToCategoryId, setAddingToCategoryId] = useState<string | null>(
    null,
  );

  const isLoggedIn = auth.status === AuthStatusEnum.LOGGED_IN;

  // Queries
  const { data: favoritesData } = useGetFavorites({
    enabled: isLoggedIn,
  });
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useGetFavoriteCategories({
      enabled: isLoggedIn,
    });

  // Mutations
  const createFavorite = useCreateFavorite();
  const deleteFavorite = useDeleteFavorite();
  const createCategory = useCreateFavoriteCategory();

  const favorites = useMemo(
    () => favoritesData?.results || [],
    [favoritesData?.results],
  );
  const categories = useMemo(
    () => categoriesData?.results || [],
    [categoriesData?.results],
  );

  const existingFavorite = useMemo(
    () => favorites.find((f) => f.warehouseId === warehouseId),
    [favorites, warehouseId],
  );

  const isFavorited = !!existingFavorite;

  const handleRemoveFavorite = useCallback(async () => {
    if (!existingFavorite) return;
    try {
      await deleteFavorite.mutateAsync(
        existingFavorite.id || existingFavorite._id || "",
      );
      notify({
        type: "success",
        title: "Favorilerden kaldırıldı",
        duration: 2000,
      });
    } catch {
      notify({ type: "error", title: "Favori kaldırılamadı", duration: 2000 });
    }
  }, [existingFavorite, deleteFavorite, notify]);

  const openSheet = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  const closeSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    setNewCategoryName("");
  }, []);

  const handlePress = () => {
    if (!isLoggedIn) {
      router.push("/profile");
      notify({
        type: "info",
        title: "Favorilere eklemek için giriş yapmalısınız",
        duration: 3000,
      });
      return;
    }

    if (isFavorited) {
      Alert.alert(
        "Favorilerden Kaldır",
        "Bu depoyu favorilerden kaldırmak istediğinize emin misiniz?",
        [
          { text: "İptal", style: "cancel" },
          {
            text: "Kaldır",
            style: "destructive",
            onPress: () => void handleRemoveFavorite(),
          },
        ],
      );
    } else {
      openSheet();
    }
  };

  const handleAddToCategory = async (categoryId: string) => {
    try {
      setAddingToCategoryId(categoryId);
      await createFavorite.mutateAsync({
        warehouseId,
        categoryId,
      });
      notify({ type: "success", title: "Favorilere eklendi", duration: 2000 });
      closeSheet();
    } catch {
      notify({ type: "error", title: "Favorilere eklenemedi", duration: 2000 });
    } finally {
      setAddingToCategoryId(null);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      notify({ type: "info", title: "Kategori adı girin", duration: 2000 });
      return;
    }

    try {
      setIsCreatingCategory(true);
      const result = await createCategory.mutateAsync({
        name: newCategoryName.trim(),
      });
      setNewCategoryName("");
      if (result.result.id) {
        await handleAddToCategory(result.result.id);
      }
    } catch {
      notify({
        type: "error",
        title: "Kategori oluşturulamadı",
        duration: 2000,
      });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  if (auth.status === AuthStatusEnum.LOADING) {
    return (
      <View style={[styles.button, style]}>
        <Ionicons name="heart-outline" size={size} color="#ccc" />
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        disabled={deleteFavorite.isPending}
        style={[styles.button, style]}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {deleteFavorite.isPending ? (
          <ActivityIndicator size="small" color="#FF3B30" />
        ) : (
          <Ionicons
            name={isFavorited ? "heart" : "heart-outline"}
            size={size}
            color={isFavorited ? "#FF3B30" : "#666"}
          />
        )}
      </TouchableOpacity>

      {/* Category Selection BottomSheet */}
      <BottomSheetModal
        ref={bottomSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetView
          style={[styles.sheetContent, { paddingBottom: insets.bottom + 16 }]}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Kategoriye Ekle</Text>
            <TouchableOpacity
              onPress={closeSheet}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Categories List */}
          {isLoadingCategories ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            <View>
              {categories.length > 0 ? (
                <View style={styles.categoriesList}>
                  {categories.map((category) => {
                    const isAdding = addingToCategoryId === category.id;
                    return (
                      <TouchableOpacity
                        key={category.id}
                        onPress={() => handleAddToCategory(category.id || "")}
                        disabled={isAdding}
                        style={[
                          styles.categoryItem,
                          isAdding && styles.categoryItemDisabled,
                        ]}
                        activeOpacity={0.7}
                      >
                        <View style={styles.categoryIcon}>
                          {isAdding ? (
                            <ActivityIndicator size="small" color="#007AFF" />
                          ) : (
                            <Ionicons
                              name="folder-outline"
                              size={20}
                              color="#666"
                            />
                          )}
                        </View>
                        <Text style={styles.categoryName} numberOfLines={1}>
                          {category.name}
                        </Text>
                        {isAdding && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color="#007AFF"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyText}>Henüz kategoriniz yok</Text>
              )}

              {/* Create New Category */}
              <View style={styles.newCategorySection}>
                <Text style={styles.newCategoryLabel}>
                  Yeni kategori oluştur
                </Text>
                <View style={styles.newCategoryRow}>
                  <BottomSheetTextInput
                    style={styles.newCategoryInput}
                    placeholder="Kategori adı"
                    placeholderTextColor="#999"
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    onSubmitEditing={handleCreateCategory}
                    maxLength={50}
                    editable={!isCreatingCategory}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    onPress={handleCreateCategory}
                    disabled={isCreatingCategory || !newCategoryName.trim()}
                    style={[
                      styles.createButton,
                      (!newCategoryName.trim() || isCreatingCategory) &&
                        styles.createButtonDisabled,
                    ]}
                    activeOpacity={0.7}
                  >
                    {isCreatingCategory ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="add" size={22} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  // BottomSheet
  sheetBackground: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetIndicator: {
    backgroundColor: "#D1D1D6",
    width: 36,
  },
  sheetContent: {
    paddingHorizontal: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  // Categories
  categoriesList: {
    gap: 8,
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#fff",
  },
  categoryItemDisabled: {
    opacity: 0.6,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginBottom: 16,
    paddingVertical: 12,
  },
  // New Category
  newCategorySection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5EA",
    paddingTop: 16,
  },
  newCategoryLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  newCategoryRow: {
    flexDirection: "row",
    gap: 8,
  },
  newCategoryInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#1a1a1a",
    backgroundColor: "#F8F9FA",
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#B0B0B0",
  },
});
