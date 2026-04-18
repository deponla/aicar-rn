import ScreenContainer from "@/components/ScreenContainer";
import { Colors } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function LegalScreen() {
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
  const [webViewTitle, setWebViewTitle] = useState<string>("");

  const closeWebView = () => {
    setWebViewUrl(null);
  };

  const webViewModal = (
    <Modal
      visible={webViewUrl !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeWebView}
    >
      <SafeAreaView style={styles.modalContainer} edges={["top"]}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderSpacer} />
          <Text style={styles.modalTitle}>{webViewTitle}</Text>
          <TouchableOpacity onPress={closeWebView} style={styles.closeButton}>
            <View style={styles.closeButtonCircle}>
              <MaterialIcons size={16} name="close" color="#8E8E93" />
            </View>
          </TouchableOpacity>
        </View>
        {webViewUrl && (
          <WebView source={{ uri: webViewUrl }} style={styles.webView} />
        )}
      </SafeAreaView>
    </Modal>
  );

  return (
    <ScreenContainer title="Yasal" showBackButton>
      {webViewModal}

      <View style={styles.card}>
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.6}
          onPress={() => {
            setWebViewTitle("Kullanım Koşulları");
            setWebViewUrl("https://deponla.com/terms");
          }}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconCircle}>
              <MaterialIcons
                name="description"
                size={20}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.menuItemTitle}>Kullanım Koşulları</Text>
          </View>
          <MaterialIcons size={20} name="chevron-right" color="#C7C7CC" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.6}
          onPress={() => {
            setWebViewTitle("Gizlilik Politikası");
            setWebViewUrl("https://deponla.com/privacy");
          }}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconCircle}>
              <MaterialIcons
                name="privacy-tip"
                size={20}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.menuItemTitle}>Gizlilik Politikası</Text>
          </View>
          <MaterialIcons size={20} name="chevron-right" color="#C7C7CC" />
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  modalHeaderSpacer: {
    width: 30,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C1C1E",
    flex: 1,
    textAlign: "center",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F2F4F8",
    justifyContent: "center",
    alignItems: "center",
  },
  webView: {
    flex: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5EA",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + "14",
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1C1C1E",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E5EA",
    marginLeft: 50,
  },
});
