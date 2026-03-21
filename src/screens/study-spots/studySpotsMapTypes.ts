/** Shared map types — no import from `react-native-maps` (web bundle). */

export type MapPoiKind = "study_spot" | "partner_cafe";

/** Unified pin + list row for study spots (directory) and partner cafés (`cafe_locations`). */
export type MapPoi = {
  key: string;
  kind: MapPoiKind;
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
  distanceMeters: number;
  /** Short line under the title (e.g. type or seat summary). */
  subtitle: string;
  description?: string;
};

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type StudySpotsMapProps = {
  region: MapRegion;
  spots: MapPoi[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onRegionChangeComplete: (r: MapRegion) => void;
  /** When true, show the user on the map (native: OS location dot; web: marker from `userLocation`). */
  showsUserLocation: boolean;
  /** Current user position when permission granted; required for web user marker. */
  userLocation?: { latitude: number; longitude: number } | null;
};
