import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { ReactNode } from "react";
import {
  RefreshControlProps,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HEADER_HEIGHT = 56;

interface ScreenContainerProps {
  readonly title: string;
  readonly children: ReactNode;
  readonly contentContainerStyle?: StyleProp<ViewStyle>;
  readonly headerRight?: ReactNode;
  readonly showBackButton?: boolean;
  readonly scrollRef?: React.RefObject<ScrollView | null>;
  readonly onScrollBeginDrag?: () => void;
  readonly refreshControl?: React.ReactElement<RefreshControlProps>;
  readonly scrollable?: boolean;
}

export default function ScreenContainer({
  title,
  children,
  contentContainerStyle,
  headerRight,
  showBackButton = false,
  scrollRef,
  onScrollBeginDrag,
  refreshControl,
  scrollable = true,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const renderContent = () => {
    if (!scrollable) {
      return (
        <View
          style={[
            styles.staticContainer,
            { marginTop: HEADER_HEIGHT + insets.top },
            contentContainerStyle,
          ]}
        >
          {children}
        </View>
      );
    }

    return (
      <ScrollView
        ref={scrollRef}
        style={[styles.scrollView, { marginTop: HEADER_HEIGHT + insets.top }]}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={onScrollBeginDrag}
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            height: HEADER_HEIGHT + insets.top,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerSide}>
            {showBackButton && (
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons
                  name="arrow-back-ios"
                  size={22}
                  color="#1C1C1E"
                />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={[styles.headerSide, styles.headerRightContainer]}>
            {headerRight}
          </View>
        </View>
        <View style={styles.headerBorder} />
      </View>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 100,
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerSide: {
    width: 80,
    justifyContent: "center",
  },
  backButton: {
    padding: 4,
  },
  headerRightContainer: {
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  headerBorder: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#E5E5EA",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  staticContainer: {
    flex: 1,
  },
});
