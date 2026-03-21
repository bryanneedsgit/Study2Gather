import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConvexProvider } from "convex/react";
import { RootNavigator } from "@/navigation/RootNavigator";
import { theme } from "@/theme";
import { convex } from "@/lib/convex";
import { SessionProvider } from "@/context/SessionContext";
import { ConfigureBackendScreen } from "@/screens/ConfigureBackendScreen";

export default function App() {
  if (!convex) {
    return (
      <SafeAreaProvider>
        <NavigationContainer theme={theme.navigationTheme}>
          <StatusBar style="dark" />
          <ConfigureBackendScreen />
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }

  return (
    <ConvexProvider client={convex}>
      <SessionProvider>
        <SafeAreaProvider>
          <NavigationContainer theme={theme.navigationTheme}>
            <StatusBar style="dark" />
            <RootNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </SessionProvider>
    </ConvexProvider>
  );
}
