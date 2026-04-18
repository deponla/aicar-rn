import NetInfo from "@react-native-community/netinfo";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BannerState = "hidden" | "offline" | "back-online";

export default function NetInfoProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const insets = useSafeAreaInsets();
  const [banner, setBanner] = useState<BannerState>("hidden");
  const translateY = useRef(new Animated.Value(-100)).current;
  const wasOffline = useRef(false);
  const isInitial = useRef(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBanner = () => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      speed: 14,
      bounciness: 4,
    }).start();
  };

  const hideBanner = (callback?: () => void) => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => callback?.());
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isInternetReachable henüz belirlenememiş (null) ise yoksay
      if (state.isInternetReachable === null) return;

      const isConnected = !!(state.isConnected && state.isInternetReachable);

      // Uygulama açılışında ilk kesin sonucu yoksay
      if (isInitial.current) {
        isInitial.current = false;
        if (!isConnected) {
          // Uygulama internetsiz açıldıysa göster
          wasOffline.current = true;
          setBanner("offline");
          showBanner();
        }
        return;
      }

      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }

      if (!isConnected) {
        wasOffline.current = true;
        setBanner("offline");
        showBanner();
      } else if (isConnected && wasOffline.current) {
        wasOffline.current = false;
        setBanner("back-online");
        showBanner();
        hideTimer.current = setTimeout(() => {
          hideBanner(() => setBanner("hidden"));
        }, 2500);
      }
    });

    return () => {
      unsubscribe();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const isOffline = banner === "offline";
  const backgroundColor = isOffline ? "#E53935" : "#43A047";
  const message = isOffline
    ? "İnternet bağlantısı yok"
    : "İnternet bağlantısı sağlandı";

  return (
    <>
      {children}
      {banner !== "hidden" && (
        <Animated.View
          style={[
            styles.banner,
            {
              paddingTop: insets.top + 4,
              backgroundColor,
              transform: [{ translateY }],
            },
          ]}
        >
          <Text style={styles.text}>{message}</Text>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  text: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
