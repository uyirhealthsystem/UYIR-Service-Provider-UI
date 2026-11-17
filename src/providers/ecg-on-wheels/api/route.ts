/** Free routing through the public OSRM demo server, using OpenStreetMap road data.
 * Public demo service has fair-use limits; production traffic should use a self-hosted OSRM/Valhalla instance or a contracted provider.
 */
export async function getRoute(origin: { latitude: number; longitude: number }, destination: { latitude: number; longitude: number }) {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&steps=true`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.code !== "Ok" || !data?.routes?.[0]) throw new Error(data?.message || "Unable to calculate route using OpenStreetMap routing.");
  const route = data.routes[0];
  return {
    coordinates: (route.geometry?.coordinates || []).map((p: number[]) => ({ latitude: p[1], longitude: p[0] })),
    distance: `${(Number(route.distance || 0) / 1000).toFixed(1)} km`,
    duration: `${Math.max(1, Math.round(Number(route.duration || 0) / 60))} min`,
  };
}
