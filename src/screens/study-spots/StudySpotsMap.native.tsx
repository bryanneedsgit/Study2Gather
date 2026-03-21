import { StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker, Region } from "react-native-maps";
import { colors } from "@/theme/colors";
import { radius, space } from "@/theme/layout";
import type { MapPoi, StudySpotsMapProps } from "./studySpotsMapTypes";

const PIN_CAFE = "#f59e0b";

export default function StudySpotsMap({
  region,
  spots,
  selectedKey,
  onSelect,
  onRegionChangeComplete,
  showsUserLocation
}: StudySpotsMapProps) {
  return (
    <View style={styles.mapWrap}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={(r: Region) =>
          onRegionChangeComplete({
            latitude: r.latitude,
            longitude: r.longitude,
            latitudeDelta: r.latitudeDelta,
            longitudeDelta: r.longitudeDelta
          })
        }
        showsUserLocation={showsUserLocation}
        showsPointsOfInterest={false}
      >
        {spots.map((spot) => {
          const selected = selectedKey === spot.key;
          const pinColor = selected ? colors.primary : PIN_CAFE;
          return (
            <Marker
              key={spot.key}
              coordinate={{ latitude: spot.lat, longitude: spot.lng }}
              pinColor={pinColor}
              tracksViewChanges={false}
              onPress={() => onSelect(spot.key)}
            >
              <Callout tooltip onPress={() => onSelect(spot.key)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{spot.name}</Text>
                  <Text style={styles.calloutSub}>{spot.subtitle}</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  callout: {
    maxWidth: 260,
    paddingVertical: 4
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4
  },
  calloutSub: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16
  },
  mapWrap: {
    height: 320,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated
  },
  map: {
    ...StyleSheet.absoluteFillObject
  }
});
