const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web") {
    if (moduleName === "react-native-maps") {
      return {
        filePath: path.resolve(__dirname, "src/web/react-native-maps.tsx"),
        type: "sourceFile",
      };
    }
    if (moduleName === "react-native-webview") {
      return {
        filePath: path.resolve(__dirname, "src/web/react-native-webview.tsx"),
        type: "sourceFile",
      };
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
