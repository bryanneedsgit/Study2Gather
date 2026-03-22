import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { useQuery } from "convex/react";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppCard } from "@/components/AppCard";
import { LogoutLink } from "@/components/HeaderLogoutButton";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useSession } from "@/context/SessionContext";
import { mapVenueCheckInError, useVenueCheckIn } from "@/hooks/useVenueCheckIn";
import { api } from "@/lib/convexApi";
import { colors } from "@/theme/colors";
import { radius, space } from "@/theme/layout";

type FailureState = { title: string; subtitle: string } | null;

export function CheckInScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  /** useIsFocused() can stay false incorrectly with nested stacks + tabs; useFocusEffect matches real tab focus. */
  const [screenFocused, setScreenFocused] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [lastData, setLastData] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const gpsAttemptForPayload = useRef<string | null>(null);
  const { runCheckIn, isCheckingIn } = useVenueCheckIn();
  const [failure, setFailure] = useState<FailureState>(null);
  const [verified, setVerified] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  /** Block duplicate barcode events before React state updates (same frame). */
  const scanLockedRef = useRef(false);

  const venuePreview = useQuery(
    api.locationCheckIn.getQrLocationPreview,
    lastData ? { raw: lastData } : "skip"
  );

  const isCafe = venuePreview?.ok && venuePreview.kind === "cafe";

  const [androidCameraKey, setAndroidCameraKey] = useState(0);

  const resetScan = useCallback(() => {
    setLastData(null);
    setPaused(false);
    setFailure(null);
    setVerified(false);
    setShowDurationPicker(false);
    scanLockedRef.current = false;
    gpsAttemptForPayload.current = null;
    if (Platform.OS === "android") {
      setAndroidCameraKey((k) => k + 1);
    }
  }, []);

  /** Ask for camera + location when this tab is focused; reset scan state so the camera isn’t stuck off after a prior scan. */
  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      resetScan();
      void requestPermission();
      void Location.requestForegroundPermissionsAsync();
      return () => {
        setScreenFocused(false);
      };
    }, [requestPermission, resetScan])
  );

  const handleBarcodeScanned = useCallback(
    (event: { data: string }) => {
      if (paused || scanLockedRef.current) return;
      scanLockedRef.current = true;
      void requestPermission();
      setLastData(event.data);
      setPaused(true);
      setFailure(null);
      setVerified(false);
      gpsAttemptForPayload.current = null;
    },
    [paused, requestPermission]
  );

  /** After a valid DB match + signed-in user: request location automatically and call Convex (lat/lng vs venue). */
  useEffect(() => {
    /** Don’t re-enter the pipeline while the failure overlay is up (prevents flicker / cleared state). */
    if (failure) return;
    if (showDurationPicker) return;
    if (!lastData) return;
    if (venuePreview === undefined) return;

    if (venuePreview instanceof Error) {
      const { userMessage } = mapVenueCheckInError(venuePreview.message);
      setFailure({
        title: "Verification failed",
        subtitle: userMessage
      });
      return;
    }

    if (!venuePreview.ok) {
      const { userMessage } = mapVenueCheckInError(venuePreview.error);
      setFailure({
        title: "Verification failed",
        subtitle: userMessage
      });
      return;
    }

    if (!user?._id) {
      setFailure({
        title: "Verification failed",
        subtitle: "Sign in to verify your location."
      });
      return;
    }

    if (isCafe) {
      setShowDurationPicker(true);
      return;
    }

    if (gpsAttemptForPayload.current === lastData) return;
    gpsAttemptForPayload.current = lastData;
    setFailure(null);

    void (async () => {
      try {
        await runCheckIn(lastData);
        setVerified(true);
        setFailure(null);
        setShowDurationPicker(false);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (isCafe && message.toLowerCase().includes("no_reservation")) {
          setShowDurationPicker(true);
          return;
        }
        const { userMessage } = mapVenueCheckInError(message);
        setFailure({
          title: "Verification failed",
          subtitle: userMessage
        });
      }
    })();
  }, [failure, lastData, venuePreview, user?._id, runCheckIn, isCafe, showDurationPicker]);

  const handleWalkInDurationSelect = useCallback(
    async (durationMinutes: number) => {
      if (!lastData) return;
      try {
        await runCheckIn(lastData, durationMinutes);
        setVerified(true);
        setFailure(null);
        setShowDurationPicker(false);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        const { userMessage } = mapVenueCheckInError(message);
        setFailure({
          title: "Verification failed",
          subtitle: userMessage
        });
        setShowDurationPicker(false);
      }
    },
    [lastData, runCheckIn]
  );

  const handleHasReservation = useCallback(
    async () => {
      if (!lastData) return;
      try {
        await runCheckIn(lastData);
        setVerified(true);
        setFailure(null);
        setShowDurationPicker(false);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        const { userMessage } = mapVenueCheckInError(message);
        setFailure({
          title: "Verification failed",
          subtitle: userMessage
        });
        setShowDurationPicker(false);
      }
    },
    [lastData, runCheckIn]
  );

  if (!permission) {
    return (
      <ScreenContainer scroll={false} tabTitle="Check in">
        <View style={styles.loadingBody}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.permText}>Checking camera…</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!permission.granted) {
    const blockedNoPrompt = permission.canAskAgain === false;
    const isWeb = Platform.OS === "web";
    return (
      <ScreenContainer tabTitle="Check in">
        <Text style={styles.permTitle}>Camera access</Text>
        {blockedNoPrompt ? (
          <>
            <Text style={styles.permBody}>
              Camera permission was denied or blocked. You need to allow it in{" "}
              {isWeb ? "your browser settings for this site" : "system settings"} before check-in can work.
            </Text>
            {isWeb ? (
              <Text style={styles.permBody}>
                In Chrome: click the lock or “site information” icon in the address bar → Site settings → Camera →
                Allow, then reload this page. Safari: Safari → Settings for This Website → Camera.
              </Text>
            ) : (
              <Text style={styles.permBody}>
                Open Settings → Study2Gather → enable Camera, then return here.
              </Text>
            )}
            {isWeb ? (
              <PrimaryButton title="Try again" onPress={() => void requestPermission()} />
            ) : (
              <PrimaryButton title="Open app settings" onPress={() => void Linking.openSettings()} />
            )}
          </>
        ) : (
          <>
            <Text style={styles.permBody}>
              Allow camera access to scan check-in QR codes at study spots and events. If you dismissed the prompt,
              tap below to try again.
            </Text>
            <PrimaryButton title="Allow camera" onPress={() => void requestPermission()} />
          </>
        )}
      </ScreenContainer>
    );
  }

  /** Stop the camera while showing result overlays or after a scan is in progress (until reset). */
  const cameraActive =
    screenFocused &&
    !failure &&
    !verified &&
    !showDurationPicker &&
    !(paused && lastData != null);

  return (
    <View style={styles.root}>
      {/* Unmount when tab loses focus or when we’re done scanning — releases camera hardware. */}
      {cameraActive ? (
        <CameraView
          key={
            Platform.OS === "android"
              ? `cam-${androidCameraKey}`
              : Platform.OS === "web"
                ? "cam-web"
                : "cam-native"
          }
          style={StyleSheet.absoluteFill}
          facing="back"
          mode="picture"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleBarcodeScanned}
          onMountError={(e) => {
            console.warn("[CheckIn] Camera mount error:", e.message);
          }}
        />
      ) : (
        <View style={styles.cameraOff} />
      )}

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
        <View style={styles.headerTopRow}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>Check in</Text>
            <Text style={styles.headerSubtitle}>Point your camera at the QR code</Text>
          </View>
          <LogoutLink size="inline" tone="light" />
        </View>
      </View>

      {lastData != null && !failure && !verified ? (
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
          {showDurationPicker ? (
            <AppCard style={styles.resultCard}>
              <Text style={styles.durationTitle}>How long do you want to stay?</Text>
              <Text style={styles.durationSubtitle}>Pick a duration (up to 4 hours)</Text>
              <View style={styles.durationRow}>
                {[60, 120, 180, 240].map((mins) => (
                  <Pressable
                    key={mins}
                    style={styles.durationBtn}
                    onPress={() => void handleWalkInDurationSelect(mins)}
                    disabled={isCheckingIn}
                  >
                    <Text style={styles.durationBtnText}>
                      {mins === 60 ? "1h" : `${mins / 60}h`}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {isCheckingIn ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: space.md }} />
              ) : (
                <Pressable
                  style={styles.durationLinkBtn}
                  onPress={() => void handleHasReservation()}
                >
                  <Text style={styles.durationLinkText}>I already have a reservation</Text>
                </Pressable>
              )}
              <Pressable style={styles.durationCancelBtn} onPress={resetScan}>
                <Text style={styles.durationCancelBtnText}>Cancel</Text>
              </Pressable>
            </AppCard>
          ) : (
            <AppCard style={styles.resultCard}>
              <Text style={styles.resultLabel}>Scanned</Text>
              <Text style={styles.resultData} selectable>
                {lastData}
              </Text>
              <Text style={styles.resultLabel}>Status</Text>
            {venuePreview === undefined || isCheckingIn ? (
              <Text style={styles.previewPending}>Verifying venue and location…</Text>
            ) : venuePreview instanceof Error ? (
              <Text style={styles.previewPending}>Couldn’t verify this code.</Text>
            ) : venuePreview.ok ? (
              <Text style={styles.previewOk}>
                Venue found: <Text style={styles.previewName}>{venuePreview.name}</Text>
              </Text>
            ) : null}
          </AppCard>
          )}
        </View>
      ) : null}

      {failure ? (
        <View style={[styles.fullOverlay, styles.failOverlay, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.overlayTitle}>{failure.title}</Text>
          <Text style={styles.overlaySubtitle}>{failure.subtitle}</Text>
          <Pressable style={styles.overlayBtn} onPress={resetScan}>
            <Text style={styles.overlayBtnText}>Scan again</Text>
          </Pressable>
        </View>
      ) : null}

      {verified ? (
        <View style={[styles.fullOverlay, styles.okOverlay, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.overlayTitle}>Verified</Text>
          <Text style={styles.overlaySubtitle}>
            Your location matches the venue. You can start lock-in from the Lock-In tab.
          </Text>
          <Pressable style={styles.overlayBtnLight} onPress={resetScan}>
            <Text style={styles.overlayBtnTextDark}>Scan again</Text>
          </Pressable>
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
  cameraOff: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000"
  },
  loadingBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
    minHeight: 220,
    paddingVertical: space.xl
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
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: space.md
  },
  headerTextBlock: {
    flex: 1,
    minWidth: 0
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
  previewPending: {
    fontSize: 14,
    color: colors.textSecondary
  },
  previewOk: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary
  },
  webSecureHint: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.75)"
  },
  previewName: {
    fontWeight: "700"
  },
  fullOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: space.lg,
    zIndex: 100
  },
  failOverlay: {
    backgroundColor: "#7f1d1d"
  },
  durationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: space.xs
  },
  durationSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: space.md
  },
  durationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.md,
    justifyContent: "center",
    marginBottom: space.lg
  },
  durationBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: radius.md,
    minWidth: 64
  },
  durationBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff"
  },
  durationLinkBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: space.sm
  },
  durationLinkText: {
    fontSize: 15,
    color: colors.primary,
    textDecorationLine: "underline"
  },
  durationCancelBtn: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: radius.md,
    marginTop: space.sm,
    borderWidth: 1,
    borderColor: colors.textMuted
  },
  durationCancelBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textSecondary
  },
  okOverlay: {
    backgroundColor: "#14532d"
  },
  overlayTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: space.md
  },
  overlaySubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    marginBottom: space.xl
  },
  overlayBtn: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: radius.md
  },
  overlayBtnLight: {
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: radius.md
  },
  overlayBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#7f1d1d"
  },
  overlayBtnTextDark: {
    fontSize: 17,
    fontWeight: "700",
    color: "#14532d"
  }
});
