import { Ionicons } from "@expo/vector-icons";
import { useImperativeHandle, useRef, useState } from "react";
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

export default function MapSearch({ onLocationSelect, ref }: MapSearchProps) {
  const innerRef = useRef<GooglePlacesAutocompleteRef>(null);
  const [searchText, setSearchText] = useState("");

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
            color="#999"
            style={styles.searchIcon}
          />
          <GooglePlacesAutocomplete
            ref={innerRef}
            placeholder="Konum ara..."
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
              key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
              language: "tr",
              components: "country:tr",
            }}
            requestUrl={{
              useOnPlatform: "all",
              url: "https://maps.googleapis.com/maps/api",
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
                backgroundColor: "transparent",
                borderWidth: 0,
                marginBottom: 0,
                marginTop: 0,
              },
              listView: {
                backgroundColor: "#fff",
                borderRadius: 12,
                marginTop: 8,
                position: "absolute",
                top: 44,
                left: -12,
                right: -12,
                zIndex: 1000,
                elevation: 5,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                borderWidth: 1,
                borderColor: "#eee",
              },
              row: {
                padding: 14,
                minHeight: 48,
              },
              separator: {
                height: 1,
                backgroundColor: "#f0f0f0",
              },
              description: {
                fontSize: 15,
                color: "#333",
              },
            }}
            textInputProps={{
              placeholderTextColor: "#999",
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
                <Ionicons name="close" size={16} color="#fff" />
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
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: "#999",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
