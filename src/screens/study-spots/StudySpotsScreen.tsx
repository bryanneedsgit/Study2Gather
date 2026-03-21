import { StyleSheet, Text, View } from "react-native";
import { AppCard } from "@/components/AppCard";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { colors } from "@/theme/colors";
import { space } from "@/theme/layout";

const SPOTS = [
  { id: "1", name: "Central Library — Level 3 Quiet", distance: "0.4 km", open: "07:00–23:00", seats: "Busy" },
  { id: "2", name: "Innovation Hub — Hot desks", distance: "0.9 km", open: "08:00–22:00", seats: "Moderate" },
  { id: "3", name: "Campus Cafe — Window bar", distance: "1.1 km", open: "08:00–20:00", seats: "Calm" }
] as const;

export function StudySpotsScreen() {
  return (
    <PlaceholderScreen title="Study Spots" subtitle="Partner cafés and campus spaces — map view coming soon.">
      {SPOTS.map((s) => (
        <AppCard key={s.id} style={styles.card}>
          <Text style={styles.name}>{s.name}</Text>
          <View style={styles.row}>
            <Text style={styles.pill}>{s.distance}</Text>
            <Text style={styles.pillMuted}>{s.open}</Text>
          </View>
          <Text style={styles.foot}>Footfall: {s.seats}</Text>
        </AppCard>
      ))}
      <AppCard muted>
        <Text style={styles.mapHint}>
          Next: Expo Maps / web map with Convex `study_spots` pins and filters (quiet, power, hours).
        </Text>
      </AppCard>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: space.md
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: space.sm
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm
  },
  pill: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent,
    backgroundColor: colors.accentMuted,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden"
  },
  pillMuted: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    backgroundColor: colors.cardMuted,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden"
  },
  foot: {
    marginTop: space.sm,
    fontSize: 13,
    color: colors.textSecondary
  },
  mapHint: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary
  }
});
