export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type RouteStep = {
  coordinate: Coordinate;
  instruction: string;
  modifier: string;
  maneuverType: string;
  distanceMeters: number;
  durationSeconds: number;
  routeIndex: number;
};

function instructionForStep(step: any): string {
  const type = String(step?.maneuver?.type || "").toLowerCase();
  const modifier = String(step?.maneuver?.modifier || "").toLowerCase();
  const road = String(step?.name || "").trim();
  const roadSuffix = road ? ` onto ${road}` : "";

  if (type === "arrive") return "You have arrived";
  if (type === "depart") return road ? `Continue on ${road}` : "Start driving";
  if (type === "roundabout" || type === "rotary") {
    return road ? `Enter the roundabout${roadSuffix}` : "Enter the roundabout";
  }
  if (type === "uturn") return "Make a U-turn";
  if (type === "merge") return modifier.includes("left") ? "Merge left" : modifier.includes("right") ? "Merge right" : "Merge ahead";
  if (type === "fork" || type === "on ramp" || type === "off ramp") {
    if (modifier.includes("left")) return `Keep left${roadSuffix}`;
    if (modifier.includes("right")) return `Keep right${roadSuffix}`;
  }
  if (type === "turn" || type === "end of road" || type === "new name") {
    if (modifier.includes("uturn")) return "Make a U-turn";
    if (modifier.includes("sharp left")) return `Turn sharp left${roadSuffix}`;
    if (modifier.includes("slight left")) return `Turn slight left${roadSuffix}`;
    if (modifier.includes("left")) return `Turn left${roadSuffix}`;
    if (modifier.includes("sharp right")) return `Turn sharp right${roadSuffix}`;
    if (modifier.includes("slight right")) return `Turn slight right${roadSuffix}`;
    if (modifier.includes("right")) return `Turn right${roadSuffix}`;
    return road ? `Continue on ${road}` : "Continue straight";
  }
  if (modifier.includes("left")) return `Keep left${roadSuffix}`;
  if (modifier.includes("right")) return `Keep right${roadSuffix}`;
  return road ? `Continue on ${road}` : "Continue straight";
}

function nearestCoordinateIndex(coordinates: Coordinate[], point: Coordinate): number {
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  coordinates.forEach((coordinate, index) => {
    const distance = Math.pow(coordinate.latitude - point.latitude, 2) + Math.pow(coordinate.longitude - point.longitude, 2);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestIndex;
}

export async function getOpenSourceRoute(
  origin: Coordinate,
  destination: Coordinate,
) {
  if (
    !Number.isFinite(origin.latitude) ||
    !Number.isFinite(origin.longitude) ||
    !Number.isFinite(destination.latitude) ||
    !Number.isFinite(destination.longitude) ||
    Math.abs(origin.latitude) > 90 ||
    Math.abs(destination.latitude) > 90 ||
    Math.abs(origin.longitude) > 180 ||
    Math.abs(destination.longitude) > 180
  ) {
    return null;
  }

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${origin.longitude},${origin.latitude};` +
    `${destination.longitude},${destination.latitude}` +
    `?overview=full&geometries=geojson&steps=true`;

  try {
    const response = await fetch(url);
    const data = await response.json().catch(() => null);

    if (!response.ok || data?.code !== "Ok" || !data?.routes?.[0]) {
      console.log("AMBULANCE ROUTE ERROR:", response.status, data);
      return null;
    }

    const route = data.routes[0];
    const coordinates: Coordinate[] = (route.geometry?.coordinates || []).map(
      ([longitude, latitude]: [number, number]) => ({ latitude, longitude }),
    );

    const rawSteps = route.legs?.[0]?.steps || [];
    const steps: RouteStep[] = rawSteps.map((step: any) => {
      const [longitude, latitude] = step?.maneuver?.location || [NaN, NaN];
      const coordinate = { latitude: Number(latitude), longitude: Number(longitude) };
      return {
        coordinate,
        instruction: instructionForStep(step),
        modifier: String(step?.maneuver?.modifier || "straight"),
        maneuverType: String(step?.maneuver?.type || "continue"),
        distanceMeters: Number(step?.distance || 0),
        durationSeconds: Number(step?.duration || 0),
        routeIndex: coordinates.length && Number.isFinite(coordinate.latitude) && Number.isFinite(coordinate.longitude)
          ? nearestCoordinateIndex(coordinates, coordinate)
          : 0,
      };
    }).filter((step: RouteStep) => Number.isFinite(step.coordinate.latitude) && Number.isFinite(step.coordinate.longitude));

    return {
      coordinates,
      steps,
      distanceKm: Number(route.distance || 0) / 1000,
      durationMinutes: Math.ceil(Number(route.duration || 0) / 60),
    };
  } catch (error) {
    console.log("AMBULANCE ROUTE REQUEST ERROR:", error);
    return null;
  }
}
