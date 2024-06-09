import * as WebBrowser from "expo-web-browser";
import React from "react";

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    // biome-ignore lint/complexity/noVoid: <explanation>
    void WebBrowser.warmUpAsync();
    return () => {
      // biome-ignore lint/complexity/noVoid: <explanation>
      void WebBrowser.coolDownAsync();
    };
  }, []);
};
