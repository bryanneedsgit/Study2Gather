import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import * as Location from "expo-location";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery } from "convex/react";
import { AppCard } from "@/components/AppCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useSession } from "@/context/SessionContext";
import { api } from "@/lib/convexApi";
import { getCafeReservationUserMessage } from "@/lib/cafeReservationUi";
import { formatStoreLocalDateTime } from "@/lib/storeLocalTime";
import { formatDistanceLabel } from "@/lib/formatDistance";
import { formatWalkMinutes } from "@/lib/walkTime";
import { colors } from "@/theme/colors";
import { radius, space } from "@/theme/layout";
import type { Id } from "../../../convex/_generated/dataModel";
import type { MainAppStackParamList, MainTabParamList } from "@/navigation/types";
import { CafeReservationModal } from "./CafeReservationModal";

type StudySpotsNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Study Spots">,
  NativeStackNavigationProp<MainAppStackParamList>
>;
import StudySpotsMap from "./StudySpotsMap";
import type { MapPoi, MapRegion } from "./studySpotsMapTypes";

/** Default map center before GPS resolves (partner café seed area ~Heilbronn). */
const DEFAULT_LAT = 49.1427;
const DEFAULT_LNG = 9.2109;

type CafeRow = {
  _id: string;
  name: string;
  lat: number;
  lng: number;
  total_stipulated_tables: number;
  current_occupied_tables: number;
  footfall_metric: number;
  distanceKm: number;
  distanceMeters: number;
  estimatedWalkMinutes: number;
  timezone_offset_minutes: number;
  opens_local_minute: number;
  closes_local_minute: number;
};

function cafeToPoi(c: CafeRow): MapPoi {
  const free = Math.max(0, c.total_stipulated_tables - c.current_occupied_tables);
  return {
    key: `c:${c._id}`,
    kind: "partner_cafe",
    name: c.name,
    lat: c.lat,
    lng: c.lng,
    distanceKm: c.distanceKm,
    distanceMeters: c.distanceMeters,
    distanceLabel: formatDistanceLabel(c.distanceMeters),
    cafeId: c._id as Id<"cafe_locations">,
    timezone_offset_minutes: c.timezone_offset_minutes,
    opens_local_minute: c.opens_local_minute,
    closes_local_minute: c.closes_local_minute,
    estimatedWalkMinutes: c.estimatedWalkMinutes,
    subtitle: `Partner café · ${free} seats free · footfall ${c.footfall_metric}`
  };
}

function matchesSearch(poi: MapPoi, q: string): boolean {
  const n = q.trim().toLowerCase();
  if (!n) return true;
  return (
    poi.name.toLowerCase().includes(n) ||
    poi.subtitle.toLowerCase().includes(n) ||
    (poi.description ?? "").toLowerCase().includes(n)
  );
}

export function StudySpotsScreen() {
  const navigation = useNavigation<StudySpotsNav>();
  const { user, loading: sessionLoading } = useSession();
  const userId = user?._id as Id<"users"> | undefined;
  const reserveMutation = useMutation(api.cafe.createTimeBasedReservation);
  const [reservingKey, setReservingKey] = useState<string | null>(null);
  const [reserveModalPoi, setReserveModalPoi] = useState<MapPoi | null>(null);
  const [modalNowMs, setModalNowMs] = useState(() => Date.now());

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG
  });
  const [region, setRegion] = useState<MapRegion>({
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12
  });
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [locReady, setLocReady] = useState(false);
  const [userOnMap, setUserOnMap] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== "granted") {
        setLocReady(true);
        setUserOnMap(false);
        return;
      }
      setUserOnMap(true);
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        if (cancelled) return;
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        setCoords({ lat, lng });
        setRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08
        });
      } finally {
        if (!cancelled) setLocReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const nearbyCafes = useQuery(api.cafeLocations.getNearbyCafeLocations, {
    lat: coords.lat,
    lng: coords.lng,
    limit: 40,
    maxDistanceKm: 80
  });

  const mapPois = useMemo(() => {
    const cafeList = (nearbyCafes?.cafes ?? []) as CafeRow[];
    return cafeList.map(cafeToPoi).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [nearbyCafes?.cafes]);

  const filtered = useMemo(() => {
    return mapPois.filter((p) => matchesSearch(p, search));
  }, [mapPois, search]);

  const onRegionChangeComplete = useCallback((r: MapRegion) => {
    setRegion(r);
  }, []);

  const focusPoi = useCallback((poi: MapPoi) => {
    setSelectedKey(poi.key);
    setRegion({
      latitude: poi.lat,
      longitude: poi.lng,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04
    });
  }, []);

  const openInMaps = useCallback((lat: number, lng: number) => {
    const url =
      Platform.OS === "web"
        ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`
        : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    void Linking.openURL(url);
  }, []);

  const openReserveModal = useCallback((poi: MapPoi) => {
    if (poi.kind !== "partner_cafe" || !poi.cafeId) return;
    setModalNowMs(Date.now());
    setReserveModalPoi(poi);
  }, []);

  const handleReserveFromModal = useCallback(
    async (args: {
      cafeId: Id<"cafe_locations">;
      userId: Id<"users">;
      startTime: number;
      endTime: number;
      nowMs: number;
      bookingNowMs: number;
      storeTimezoneOffsetMinutes: number;
    }): Promise<boolean> => {
      const key = reserveModalPoi?.key;
      if (key) setReservingKey(key);
      try {
        const { storeTimezoneOffsetMinutes, ...mutationArgs } = args;
        const r = await reserveMutation(mutationArgs);
        const endStore = formatStoreLocalDateTime(r.expiresAt, storeTimezoneOffsetMinutes);
        const startStore = formatStoreLocalDateTime(args.startTime, storeTimezoneOffsetMinutes);
        Alert.alert(
          "Reservation confirmed",
          `Store local time: ${startStore} – ${endStore}\nEstimated total: €${r.totalCost.toFixed(2)}.`
        );
        return true;
      } catch (e) {
        Alert.alert("Could not reserve", getCafeReservationUserMessage(e));
        return false;
      } finally {
        setReservingKey(null);
      }
    },
    [reserveModalPoi?.key, reserveMutation]
  );

  const reserveModalCafe =
    reserveModalPoi &&
    reserveModalPoi.kind === "partner_cafe" &&
    reserveModalPoi.cafeId &&
    reserveModalPoi.timezone_offset_minutes !== undefined &&
    reserveModalPoi.opens_local_minute !== undefined &&
    reserveModalPoi.closes_local_minute !== undefined
      ? {
          name: reserveModalPoi.name,
          cafeId: reserveModalPoi.cafeId,
          timezone_offset_minutes: reserveModalPoi.timezone_offset_minutes,
          opens_local_minute: reserveModalPoi.opens_local_minute,
          closes_local_minute: reserveModalPoi.closes_local_minute
        }
      : null;

  const dataLoading = nearbyCafes === undefined;

  const userLocation =
    userOnMap ? { latitude: coords.lat, longitude: coords.lng } : null;

  return (
    <ScreenContainer scroll tabTitle="Study Spots">
      <Text style={styles.lead}>
        Partner cafés near you. Your location appears on the map when location access is allowed. Search
        or tap a pin, pick start and end (store time), then confirm — lower flat reservation fee when you
        book ahead, plus cheaper hourly tiers for longer stays.
      </Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search partner cafés…"
        placeholderTextColor={colors.textMuted}
        style={styles.search}
        autoCapitalize="none"
        autoCorrect={false}
        {...(Platform.OS === "ios" ? { clearButtonMode: "while-editing" as const } : {})}
      />

      {!locReady || dataLoading ? (
        <View style={styles.loadingMap}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading map & cafés…</Text>
        </View>
      ) : (
        <StudySpotsMap
          region={region}
          spots={filtered}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          onRegionChangeComplete={onRegionChangeComplete}
          showsUserLocation={userOnMap}
          userLocation={userLocation}
        />
      )}

      {!dataLoading && filtered.length === 0 ? (
        <AppCard muted style={styles.empty}>
          <Text style={styles.emptyText}>
            {(nearbyCafes?.count ?? 0) === 0
              ? "No partner cafés in range. Seed cafe_locations in Convex."
              : "No cafés match your search. Try another keyword."}
          </Text>
        </AppCard>
      ) : null}

      <CafeReservationModal
        visible={reserveModalCafe !== null}
        onClose={() => setReserveModalPoi(null)}
        cafe={reserveModalCafe}
        userId={userId}
        nowMs={modalNowMs}
        bookingNowMs={modalNowMs}
        onOpenPaymentFlow={(payload) => {
          const parent = navigation.getParent<NativeStackNavigationProp<MainAppStackParamList>>();
          (parent ?? navigation).navigate("Payment", {
            amountCents: payload.amountCents,
            description: `Café reservation · ${payload.cafeName}`,
            storeTimezoneOffsetMinutes: payload.storeTimezoneOffsetMinutes,
            afterPayReserve: {
              cafeId: payload.cafeId,
              userId: payload.userId,
              startTime: payload.startTime,
              endTime: payload.endTime,
              bookingNowMs: payload.bookingNowMs
            }
          });
        }}
        onReserve={async (args) => {
          if (!userId) {
            Alert.alert("Sign in required", "Please sign in to reserve a seat at a partner café.");
            return false;
          }
          return handleReserveFromModal(args);
        }}
      />

      {filtered.map((s) => (
        <Pressable key={s.key} onPress={() => focusPoi(s)} accessibilityRole="button">
          <AppCard
            style={StyleSheet.flatten([
              styles.card,
              selectedKey === s.key ? styles.cardSelected : undefined
            ])}
          >
            <View style={styles.cardTop}>
              <Text style={styles.name}>{s.name}</Text>
              <View style={[styles.kindPill, styles.kindPillCafe]}>
                <Text style={[styles.kindPillText, styles.kindPillTextCafe]}>Partner café</Text>
              </View>
            </View>
            <Text style={styles.meta}>
              {[
                s.estimatedWalkMinutes != null ? formatWalkMinutes(s.estimatedWalkMinutes) : null,
                s.distanceLabel
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
            <Text style={styles.subtitle}>{s.subtitle}</Text>
            {s.description ? <Text style={styles.desc}>{s.description}</Text> : null}
            <View style={styles.cardActions}>
              <Pressable
                onPress={() => openReserveModal(s)}
                disabled={sessionLoading || reservingKey === s.key || s.kind !== "partner_cafe"}
                style={({ pressed }) => [
                  styles.reserveBtn,
                  (sessionLoading || reservingKey === s.key) && styles.reserveBtnDisabled,
                  pressed && styles.reserveBtnPressed
                ]}
                accessibilityRole="button"
                accessibilityLabel="Reserve seat"
              >
                <Text style={styles.reserveBtnText}>
                  {reservingKey === s.key ? "Reserving…" : "Reserve"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => openInMaps(s.lat, s.lng)}
                style={styles.mapsLink}
                accessibilityRole="link"
                accessibilityLabel="Open in maps"
              >
                <Text style={styles.mapsLinkText}>Open in maps</Text>
              </Pressable>
            </View>
          </AppCard>
        </Pressable>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: space.md
  },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: space.md,
    backgroundColor: colors.cardMuted
  },
  loadingMap: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    marginBottom: space.lg
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary
  },
  empty: {
    marginBottom: space.md
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary
  },
  card: {
    marginBottom: space.md
  },
  cardSelected: {
    borderWidth: 1,
    borderColor: colors.primary
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: space.sm,
    marginBottom: space.xs
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary
  },
  kindPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  kindPillCafe: {
    backgroundColor: "rgba(251, 191, 36, 0.15)"
  },
  kindPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textPrimary
  },
  kindPillTextCafe: {
    color: colors.warning
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: space.xs
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: space.sm
  },
  cardActions: {
    marginTop: space.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space.md
  },
  reserveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: colors.primary
  },
  reserveBtnPressed: {
    opacity: 0.88
  },
  reserveBtnDisabled: {
    opacity: 0.5
  },
  reserveBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0a0f1a"
  },
  mapsLink: {
    alignSelf: "flex-start",
    paddingVertical: 10
  },
  mapsLinkText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary
  }
});
