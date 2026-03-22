import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  Image
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { colors } from "@/theme/colors";
import { radius, space } from "@/theme/layout";

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  qrValue: string;
  onClose: () => void;
};

/**
 * Full-screen modal with a scannable QR for café / reward vouchers.
 * Web uses a data-URL fallback when the SVG QR path is flaky.
 */
export function CouponQrModal({ visible, title, subtitle, qrValue, onClose }: Props) {
  const [webUri, setWebUri] = useState<string | null>(null);
  const [webErr, setWebErr] = useState(false);

  useEffect(() => {
    if (!visible || Platform.OS === "web") {
      setWebUri(null);
      setWebErr(false);
    }
    if (!visible || Platform.OS !== "web" || !qrValue) return;

    let cancelled = false;
    (async () => {
      try {
        const QR = await import("qrcode");
        const uri = await QR.toDataURL(qrValue, {
          width: 240,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" }
        });
        if (!cancelled) setWebUri(uri);
      } catch {
        if (!cancelled) setWebErr(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, qrValue]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
          <View style={styles.qrWrap}>
            {Platform.OS === "web" ? (
              webErr ? (
                <Text style={styles.err}>Could not render QR on web. Use the iOS/Android app.</Text>
              ) : webUri ? (
                <Image source={{ uri: webUri }} style={styles.webQr} resizeMode="contain" />
              ) : (
                <ActivityIndicator color={colors.primary} />
              )
            ) : (
              <QRCode value={qrValue} size={220} backgroundColor="#ffffff" color="#000000" />
            )}
          </View>
          <Text style={styles.hint}>Show this code at the partner café counter when you pay or pick up.</Text>
          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    padding: space.lg
  },
  sheet: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: space.xs
  },
  sub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: space.md
  },
  qrWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
    marginVertical: space.md,
    backgroundColor: "#ffffff",
    borderRadius: radius.md,
    padding: space.md
  },
  webQr: { width: 240, height: 240 },
  err: { color: colors.danger, textAlign: "center", padding: space.md },
  hint: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: space.md
  },
  closeBtn: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: radius.md
  },
  closeText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0f1a"
  }
});
