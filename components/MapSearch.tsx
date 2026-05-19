import { Ionicons } from "@expo/vector-icons";
import { ambientShadow, FontFamily, tokens } from "@/constants/theme";
import {
  GOOGLE_PLACES_API_KEY,
  GOOGLE_PLACES_API_URL,
} from "@/utils/env";
import { useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Keyboard,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  GooglePlaceDetail,
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteRef,
} from "react-native-google-places-autocomplete";

export interface MapSearchRef {
  blur: () => void;
}

interface MapSearchProps {
  readonly ref?: React.Ref<MapSearchRef>;
  readonly onLocationSelect?: (location: {
    latitude: number;
    longitude: number;
    name: string;
    viewport?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  }) => void;
}

function resolvePlacesLanguage(language?: string): string {
  if (!language) return "en";
  if (language.startsWith("tr")) return "tr";
  if (language.startsWith("de")) return "de";
  return "en";
}

export default function MapSearch({ onLocationSelect, ref }: MapSearchProps) {
  const innerRef = useRef<GooglePlacesAutocompleteRef>(null);
  const [searchText, setSearchText] = useState("");
  const { t, i18n } = useTranslation();

  useImperativeHandle(ref, () => ({
    blur: () => {
      innerRef.current?.blur();
      Keyboard.dismiss();
    },
  }));

  const handleClear = () => {
    innerRef.current?.setAddressText("");
    setSearchText("");
    innerRef.current?.blur();
    Keyboard.dismiss();
  };

  const handleOutsidePress = () => {
    innerRef.current?.blur();
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress} accessible={false}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={tokens.textTertiary}
            style={styles.searchIcon}
          />
          <GooglePlacesAutocomplete
            ref={innerRef}
            placeholder={t("common.searchLocation")}
            onPress={(data, details: GooglePlaceDetail | null = null) => {
              if (details?.geometry?.location) {
                const { lat, lng } = details.geometry.location;
                const viewport = details.geometry.viewport;
                onLocationSelect?.({
                  latitude: lat,
                  longitude: lng,
                  name: data.description,
                  viewport: viewport
                    ? {
                      north: viewport.northeast.lat,
                      south: viewport.southwest.lat,
                      east: viewport.northeast.lng,
                      west: viewport.southwest.lng,
                    }
                    : undefined,
                });
                setSearchText(data.description);
                innerRef.current?.blur();
                Keyboard.dismiss();
              }
            }}
            onFail={(error) => console.error("GooglePlaces Error:", error)}
            onNotFound={() => console.log("No results found")}
            fetchDetails={true}
            debounce={300}
            enablePoweredByContainer={false}
            minLength={2}
            disableScroll={true}
            keyboardShouldPersistTaps="handled"
            keepResultsAfterBlur={false}
            query={{
              key: GOOGLE_PLACES_API_KEY,
              language: resolvePlacesLanguage(i18n.language),
              components: "country:tr",
            }}
            requestUrl={{
              useOnPlatform: "all",
              url: GOOGLE_PLACES_API_URL,
            }}
            styles={{
              container: {
                flex: 1,
              },
              textInputContainer: {
                backgroundColor: "transparent",
              },
              textInput: {
                height: 44,
                borderRadius: 0,
                paddingLeft: 36,
                paddingRight: 40,
                fontSize: 16,
                fontFamily: FontFamily.regular,
                color: tokens.textPrimary,
                backgroundColor: "transparent",
                borderWidth: 0,
                marginBottom: 0,
                marginTop: 0,
              },
              listView: {
                backgroundColor: tokens.surfaceContainerLowest,
                borderRadius: 16,
                marginTop: 8,
                position: "absolute",
                top: 44,
                left: -12,
                right: -12,
                zIndex: 1000,
                ...ambientShadow,
                borderWidth: 1,
                borderColor: tokens.borderSubtle,
              },
              row: {
                padding: 14,
                minHeight: 48,
              },
              separator: {
                height: 1,
                backgroundColor: tokens.borderSubtle,
              },
              description: {
                fontSize: 15,
                fontFamily: FontFamily.regular,
                color: tokens.textPrimary,
              },
            }}
            textInputProps={{
              placeholderTextColor: tokens.textPlaceholder,
              autoCorrect: false,
              onChangeText: (text) => setSearchText(text),
            }}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.clearIconContainer}>
                <Ionicons name="close" size={16} color={tokens.textSecondary} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 10,
    elevation: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.borderSubtle,
    paddingHorizontal: 12,
    ...ambientShadow,
  },
  searchIcon: {
    position: "absolute",
    left: 14,
    zIndex: 1,
  },
  clearButton: {
    position: "absolute",
    right: 12,
    zIndex: 1,
  },
  clearIconContainer: {
    backgroundColor: tokens.surfaceContainerHighest,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
