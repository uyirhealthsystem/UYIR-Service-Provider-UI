import { registerRootComponent } from "expo";
// Must load first: Android runs its push task here when the app is closed.
import "./src/providers/ambulance/push/offerPush";
import App from "./src/App";

registerRootComponent(App);
