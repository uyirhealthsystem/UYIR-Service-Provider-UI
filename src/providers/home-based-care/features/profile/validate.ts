// Mirrors the API's rules: pincode ^[0-9]{4,10}$, lat -90..90, lng -180..180,
// and latitude/longitude always sent together.
export function validateLocation(pincode: string, lat: string, lng: string, required: boolean) {
  const out: { pincode?: string; latitude?: number; longitude?: number } = {};
  const pin = pincode.trim();
  if (pin || required) {
    if (!/^[0-9]{4,10}$/.test(pin)) return "Enter a valid pincode (4–10 digits).";
    out.pincode = pin;
  }
  const hasLat = lat.trim() !== "";
  const hasLng = lng.trim() !== "";
  if (hasLat !== hasLng) return "Latitude and longitude must be entered together.";
  if (!hasLat && required) return "Location is required. Tap “Use my location” or enter coordinates.";
  if (hasLat) {
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return "Latitude must be between -90 and 90.";
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return "Longitude must be between -180 and 180.";
    out.latitude = latitude;
    out.longitude = longitude;
  }
  return out as { pincode: string; latitude: number; longitude: number };
}
