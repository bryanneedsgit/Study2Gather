import { createElement, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { StyleSheet, Text, View } from "react-native";
import { formatWalkMinutes } from "@/lib/walkTime";
import { colors } from "@/theme/colors";
import { radius, space } from "@/theme/layout";
import type { MapPoi, MapRegion, StudySpotsMapProps } from "./studySpotsMapTypes";

function poiMetaLine(spot: MapPoi): string {
  const parts: string[] = [];
  if (spot.estimatedWalkMinutes != null) parts.push(formatWalkMinutes(spot.estimatedWalkMinutes));
  if (spot.distanceLabel) parts.push(spot.distanceLabel);
  return parts.join(" · ");
}

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

const PIN_CAFE = "#f59e0b";
const PIN_SELECTED = "#818cf8";
const USER_DOT = "#3b82f6";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletMap = any;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") return resolve();
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });
}

function loadCss(href: string): void {
  if (typeof document === "undefined") return;
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  document.head.appendChild(l);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function regionFromLeaflet(map: LeafletMap): MapRegion {
  const c = map.getCenter();
  const b = map.getBounds();
  return {
    latitude: c.lat,
    longitude: c.lng,
    latitudeDelta: Math.max(0.0001, b.getNorth() - b.getSouth()),
    longitudeDelta: Math.max(0.0001, b.getEast() - b.getWest())
  };
}

function zoomFromRegion(r: MapRegion): number {
  const z = Math.log2(360 / Math.max(r.longitudeDelta, 1e-9));
  return Math.min(18, Math.max(3, Math.round(z)));
}

declare global {
  interface Window {
    L?: LeafletMap;
  }
}

export default function StudySpotsMap({
  region,
  spots,
  selectedKey,
  onSelect,
  onRegionChangeComplete,
  showsUserLocation,
  userLocation
}: StudySpotsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersLayerRef = useRef<LeafletMap | null>(null);
  const userLayerRef = useRef<LeafletMap | null>(null);
  const skipEmitRef = useRef(false);
  const markerByKeyRef = useRef<Map<string, LeafletMap>>(new Map());
  const regionRef = useRef(region);
  regionRef.current = region;
  const [mapReady, setMapReady] = useState(false);

  const spotSig = useMemo(
    () => spots.map((s) => `${s.key}:${s.lat.toFixed(5)}:${s.lng.toFixed(5)}`).join("|"),
    [spots]
  );

  useEffect(() => {
    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;

    (async () => {
      loadCss(LEAFLET_CSS);
      await loadScript(LEAFLET_JS);
      if (cancelled || !window.L || !containerRef.current) return;

      const L = window.L;
      const map = L.map(containerRef.current, { scrollWheelZoom: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      const userLayer = L.layerGroup().addTo(map);
      userLayerRef.current = userLayer;
      const r0 = regionRef.current;
      map.setView([r0.latitude, r0.longitude], zoomFromRegion(r0));

      map.on("moveend", () => {
        if (skipEmitRef.current) {
          skipEmitRef.current = false;
          return;
        }
        onRegionChangeComplete(regionFromLeaflet(map));
      });

      mapRef.current = map;
      markersLayerRef.current = markersLayer;
      setMapReady(true);
    })();

    return () => {
      cancelled = true;
      setMapReady(false);
      mapRef.current?.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      userLayerRef.current = null;
      markerByKeyRef.current.clear();
    };
    // Map is created once; region updates are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial center uses first-render region; parent syncs via separate effect
  }, [onRegionChangeComplete]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    skipEmitRef.current = true;
    mapRef.current.setView([region.latitude, region.longitude], zoomFromRegion(region), {
      animate: true
    });
  }, [mapReady, region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta]);

  useEffect(() => {
    if (!mapReady || !userLayerRef.current || !window.L) return;
    const layer = userLayerRef.current;
    layer.clearLayers();
    if (!showsUserLocation || !userLocation) return;
    const L = window.L;
    const m = L.circleMarker([userLocation.latitude, userLocation.longitude], {
      radius: 10,
      color: USER_DOT,
      fillColor: USER_DOT,
      fillOpacity: 0.88,
      weight: 2
    });
    m.bindPopup("You are here");
    m.addTo(layer);
  }, [mapReady, showsUserLocation, userLocation?.latitude, userLocation?.longitude]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.L || !markersLayerRef.current) return;

    const L = window.L;
    const layer = markersLayerRef.current;
    layer.clearLayers();
    markerByKeyRef.current.clear();

    spots.forEach((spot: MapPoi) => {
      const selected = selectedKey === spot.key;
      const color = selected ? PIN_SELECTED : PIN_CAFE;
      const r = selected ? 12 : 8;
      const m = L.circleMarker([spot.lat, spot.lng], {
        radius: r,
        color,
        fillColor: color,
        fillOpacity: 0.92,
        weight: selected ? 3 : 2
      });
      const meta = poiMetaLine(spot);
      m.bindPopup(
        `<div class="s2g-popup"><strong>${escapeHtml(spot.name)}</strong>${
          meta ? `<br/><span style="opacity:0.85">${escapeHtml(meta)}</span>` : ""
        }<br/>${escapeHtml(spot.subtitle)}</div>`
      );
      m.on("click", () => {
        onSelect(spot.key);
      });
      m.addTo(layer);
      markerByKeyRef.current.set(spot.key, m);
    });

    if (selectedKey) {
      const mk = markerByKeyRef.current.get(selectedKey);
      if (mk) {
        mk.openPopup();
      }
    }
  }, [mapReady, spotSig, selectedKey, onSelect]);

  return (
    <View style={styles.mapWrap}>
      {createElement("div", {
        ref: containerRef,
        style: mapDivStyle
      })}
      <View style={styles.badge} pointerEvents="none">
        <Text style={styles.badgeText}>
          Pan & zoom — blue dot = you (when location allowed). Amber = partner cafés.
        </Text>
      </View>
    </View>
  );
}

const mapDivStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minHeight: 300
};

const styles = StyleSheet.create({
  mapWrap: {
    height: 320,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated
  },
  badge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 6,
    paddingHorizontal: space.sm,
    backgroundColor: "rgba(10,15,26,0.88)"
  },
  badgeText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center"
  }
});
