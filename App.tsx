import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConvexProvider } from "convex/react";
import { RootNavigator } from "@/navigation/RootNavigator";
import { theme } from "@/theme";
import { convex } from "@/lib/convex";

export default function App() {
  const app = (
    <SafeAreaProvider>
      <NavigationContainer theme={theme.navigationTheme}>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );

  if (!convex) return app;
  return <ConvexProvider client={convex}>{app}</ConvexProvider>;
}
