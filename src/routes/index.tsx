import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../auth/store";
import AuthRoutes from "./AuthRoutes";
import ProviderRoutes from "./ProviderRoutes";

export default function Routes() {
  const { user, restoring } = useAuth();

  // Wait for the saved login before choosing a screen, so a signed-in user
  // doesn't see the login screen flash first.
  if (restoring) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#075DE8" />
      </View>
    );
  }

  return user ? <ProviderRoutes /> : <AuthRoutes />;
}
