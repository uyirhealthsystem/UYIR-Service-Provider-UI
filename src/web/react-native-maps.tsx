import React, { forwardRef, useImperativeHandle } from "react";
import { View } from "react-native";

const MapView = forwardRef<any, any>((props, ref) => {
  useImperativeHandle(ref, () => ({
    animateToRegion: () => {},
    fitToCoordinates: () => {},
  }));

  return <View style={[{ minHeight: 180 }, props.style]}>{props.children}</View>;
});

export default MapView;
export const Marker = (props: any) => <View>{props.children}</View>;
export const Polyline = (_props: any) => null;
export const Overlay = (_props: any) => null;
export const Callout = (props: any) => <>{props.children}</>;
export const UrlTile = (_props: any) => null;
export const WMSTile = (_props: any) => null;
export const PROVIDER_GOOGLE = "google";
export const PROVIDER_DEFAULT = "default";
export const MAP_TYPES = {
  STANDARD: "standard",
  SATELLITE: "satellite",
  HYBRID: "hybrid",
  TERRAIN: "terrain",
  NONE: "none",
};
export const AnimatedMapView = MapView;
export const AnimatedRegion = class {};
