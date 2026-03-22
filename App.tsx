import "react-native-gesture-handler";
import { useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setWebDocumentTitle } from "@/lib/webDocumentTitle";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { RootNavigator } from "@/navigation/RootNavigator";
import { theme } from "@/theme";
import { convex } from "@/lib/convex";
import { convexAuthStorage } from "@/lib/convexAuthStorage";
import { SessionProvider } from "@/context/SessionContext";
import { LockInSessionProvider } from "@/context/LockInSessionContext";
import { ReservationVoucherProvider } from "@/context/ReservationVoucherContext";
import { StripeOptionalProvider } from "@/components/StripeOptionalProvider";
import { ConfigureBackendScreen } from "@/screens/ConfigureBackendScreen";

export default function App() {
  const onNavReadyOrChange = useCallback(() => {
    setWebDocumentTitle();
  }, []);

  if (!convex) {
    return (
      <SafeAreaProvider>
        <NavigationContainer
          theme={theme.navigationTheme}
          onReady={onNavReadyOrChange}
          onStateChange={onNavReadyOrChange}
        >
          <StatusBar style="light" />
          <ConfigureBackendScreen />
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }

  return (
    <ConvexAuthProvider client={convex} storage={convexAuthStorage}>
      <SessionProvider>
        <ReservationVoucherProvider>
          <LockInSessionProvider>
            <StripeOptionalProvider>
              <SafeAreaProvider>
                <NavigationContainer
                  theme={theme.navigationTheme}
                  onReady={onNavReadyOrChange}
                  onStateChange={onNavReadyOrChange}
                >
                  <StatusBar style="light" />
                  <RootNavigator />
                </NavigationContainer>
              </SafeAreaProvider>
            </StripeOptionalProvider>
          </LockInSessionProvider>
        </ReservationVoucherProvider>
      </SessionProvider>
    </ConvexAuthProvider>
  );
}
