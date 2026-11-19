// Injects secrets from environment variables (.env.local locally, EAS env vars in the cloud)
// so they never live in app.json / git.
module.exports = ({ config }) => {
  const iosKey = process.env.GOOGLE_MAPS_IOS_API_KEY;
  const androidKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;

  if (!iosKey || !androidKey) {
    console.warn(
      '[app.config] GOOGLE_MAPS_IOS_API_KEY / GOOGLE_MAPS_ANDROID_API_KEY not set — maps will not load. See .env.example.'
    );
  }

  return {
    ...config,
    ios: {
      ...config.ios,
      config: { ...config.ios?.config, googleMapsApiKey: iosKey },
    },
    android: {
      ...config.android,
      config: { ...config.android?.config, googleMaps: { apiKey: androidKey } },
    },
  };
};
