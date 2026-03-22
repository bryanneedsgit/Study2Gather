import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MainTabsNavigator } from "@/navigation/MainTabsNavigator";
import type { MainAppStackParamList } from "@/navigation/types";
import { PaymentScreen } from "@/screens/payments/PaymentScreen";
import { colors } from "@/theme/colors";

const Stack = createNativeStackNavigator<MainAppStackParamList>();

/**
 * Tabs + stack screens (e.g. Stripe checkout) that sit above the tab bar.
 */
export function MainAppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Tabs">
      <Stack.Screen name="Tabs" component={MainTabsNavigator} />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
          headerShown: true,
          title: "Pay",
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.backgroundElevated },
          headerTitleStyle: { color: colors.textPrimary, fontWeight: "700" }
        }}
      />
    </Stack.Navigator>
  );
}
