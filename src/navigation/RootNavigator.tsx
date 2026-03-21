import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useSession } from "@/context/SessionContext";
import { AuthScreen } from "@/screens/auth/AuthScreen";
import { OnboardingScreen } from "@/screens/onboarding/OnboardingScreen";
import { MainTabsNavigator } from "@/navigation/MainTabsNavigator";
import { isOnboardingComplete } from "@/utils/profile";

const AuthStack = createNativeStackNavigator();
const OnboardingStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

export function RootNavigator() {
  const { userId, user, loading } = useSession();

  if (loading) {
    return <LoadingScreen message="Restoring session…" />;
  }

  if (!userId) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Auth" component={AuthScreen} />
      </AuthStack.Navigator>
    );
  }

  if (!isOnboardingComplete(user)) {
    return (
      <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
        <OnboardingStack.Screen name="Onboarding" component={OnboardingScreen} />
      </OnboardingStack.Navigator>
    );
  }

  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Main" component={MainTabsNavigator} />
    </MainStack.Navigator>
  );
}
