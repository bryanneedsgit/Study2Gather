import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { AuthScreen } from "@/screens/auth/AuthScreen";
import { OnboardingScreen } from "@/screens/onboarding/OnboardingScreen";
import { MainTabsNavigator } from "@/navigation/MainTabsNavigator";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Auth" screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Main" component={MainTabsNavigator} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
