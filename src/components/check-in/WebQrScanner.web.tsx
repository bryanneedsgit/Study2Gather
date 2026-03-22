import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Html5Qrcode } from "html5-qrcode";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors } from "@/theme/colors";
import { radius, space } from "@/theme/layout";

const SLOT_ID = "s2g-checkin-qr-slot";

type Props = {
  onScan: (data: string) => void;
  paused: boolean;
};

export function WebQrScanner({ onScan, paused }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const [error, setError] = useState<string | null>(null);

  const stopScanner = useCallback(async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (!s) return;
    try {
      await s.stop();
      s.clear();
    } catch {
      // already stopped
    }
  }, []);

  useEffect(() => {
    if (!paused) handledRef.current = false;
  }, [paused]);

  useEffect(() => {
    if (paused) {
      void stopScanner();
      return;
    }

    let cancelled = false;

    const start = async () => {
      setError(null);
      await stopScanner();

      if (typeof document === "undefined" || !document.getElementById(SLOT_ID)) {
        setError("Scanner container not ready.");
        return;
      }

      const scanner = new Html5Qrcode(SLOT_ID, false);
      scannerRef.current = scanner;

      const onDecoded = (decodedText: string) => {
        if (cancelled || handledRef.current) return;
        handledRef.current = true;
        void stopScanner();
        const text = decodedText.trim();
        if (text.length > 0) {
          queueMicrotask(() => onScanRef.current(text));
        }
      };

      const config = { fps: 10, qrbox: { width: 260, height: 260 } };

      try {
        await scanner.start({ facingMode: "environment" }, config, onDecoded, () => {});
      } catch {
        try {
          await scanner.start({ facingMode: "user" }, config, onDecoded, () => {});
        } catch (e) {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : "Could not access the camera.");
          }
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [paused, stopScanner]);

  return (
    <View style={styles.wrap}>
      <View id={SLOT_ID} style={styles.slot} />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Camera unavailable</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Text style={styles.errorHint}>
            Use https or localhost, allow the camera when prompted, or enter the code manually below.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function WebManualCheckInInput({
  onSubmit,
  disabled
}: {
  onSubmit: (value: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  return (
    <View style={styles.manualWrap}>
      <Text style={styles.manualLabel}>Or enter check-in code</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholder="Paste or type the code"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!disabled}
      />
      <PrimaryButton
        title="Submit code"
        onPress={() => {
          const t = value.trim();
          if (t.length > 0) onSubmit(t);
        }}
        disabled={disabled || value.trim().length === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    alignItems: "center"
  },
  slot: {
    width: "100%",
    minHeight: 280,
    maxWidth: 400,
    alignSelf: "center",
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: "#0f172a"
  },
  errorBox: {
    marginTop: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 400,
    width: "100%"
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: space.sm
  },
  errorBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: space.sm
  },
  errorHint: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted
  },
  manualWrap: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    marginTop: space.lg,
    gap: space.sm
  },
  manualLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.backgroundElevated
  }
});
