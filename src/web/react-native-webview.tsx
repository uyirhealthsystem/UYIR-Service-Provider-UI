import React, { forwardRef, useImperativeHandle } from "react";
import { View } from "react-native";

const WebView = forwardRef<any, any>((props, ref) => {
  useImperativeHandle(ref, () => ({
    goBack: () => {},
    goForward: () => {},
    reload: () => {},
    stopLoading: () => {},
  }));

  const uri = typeof props.source?.uri === "string" ? props.source.uri : "";
  return (
    <View style={[{ flex: 1, overflow: "hidden" }, props.style]}>
      {uri
        ? React.createElement("iframe", {
            src: uri,
            style: { width: "100%", height: "100%", border: 0 },
            title: "WebView",
          })
        : null}
    </View>
  );
});

export default WebView;
export type WebViewNavigation = {
  url: string;
  title?: string;
  canGoBack: boolean;
  canGoForward: boolean;
};
