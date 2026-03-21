import { useCallback, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppCard } from "@/components/AppCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { colors } from "@/theme/colors";
import { radius, space } from "@/theme/layout";

export function CheckInScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [lastData, setLastData] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  const handleBarcodeScanned = useCallback(
    (event: { data: string }) => {
      setLastData(event.data);
      setPaused(true);
    },
    []
  );

  const handleScanAgain = useCallback(() => {
    setLastData(null);
    setPaused(false);
  }, []);

  if (Platform.OS === "web") {
    return (
      <ScreenContainer>
        <Text style={styles.webTitle}>Check in</Text>
        <Text style={styles.webBody}>
          QR scanning runs in the Study2Gather app on a phone or tablet (Expo Go or a dev build). Use the
          iOS or Android tab in Expo, then open this tab to scan check-in codes with the camera.
        </Text>
        <AppCard muted style={styles.webCard}>
          <Text style={styles.webHint}>
            Web preview does not have camera-based QR scanning wired up yet.
          </Text>
        </AppCard>
      </ScreenContainer>
    );
  }

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.permText}>Checking camera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenContainer>
        <Text style={styles.permTitle}>Camera access</Text>
        <Text style={styles.permBody}>
          Allow camera access to scan check-in QR codes at study spots and events.
        </Text>
        <PrimaryButton title="Allow camera" onPress={() => void requestPermission()} />
      </ScreenContainer>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={paused ? undefined : handleBarcodeScanned}
      />

      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + space.sm,
            paddingLeft: Math.max(insets.left, space.lg),
            paddingRight: Math.max(insets.right, space.lg)
          }
        ]}
        pointerEvents="box-none"
      >
        <Text style={styles.headerTitle}>Check in</Text>
        <Text style={styles.headerSubtitle}>Point your camera at the QR code</Text>
      </View>

      {lastData != null ? (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + space.lg,
              paddingLeft: Math.max(insets.left, space.lg),
              paddingRight: Math.max(insets.right, space.lg)
            }
          ]}
        >
          <AppCard style={styles.resultCard}>
            <Text style={styles.resultLabel}>Scanned</Text>
            <Text style={styles.resultData} selectable>
              {lastData}
            </Text>
            <PrimaryButton title="Scan again" onPress={handleScanAgain} variant="secondary" />
          </AppCard>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000"
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: space.md
  },
  permText: {
    fontSize: 15,
    color: colors.textSecondary
  },
  permTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: space.sm
  },
  permBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: space.lg
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingBottom: space.md
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff"
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "rgba(255,255,255,0.85)"
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0
  },
  resultCard: {
    borderRadius: radius.lg
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: space.sm
  },
  resultData: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
    marginBottom: space.md
  },
  webTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.6,
    marginBottom: space.sm
  },
  webBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: space.lg
  },
  webCard: {
    marginBottom: space.lg
  },
  webHint: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary
  }
});
