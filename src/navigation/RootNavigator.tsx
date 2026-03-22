import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useSession } from "@/context/SessionContext";
import { AuthScreen } from "@/screens/auth/AuthScreen";
import { ForgotPasswordEmailScreen } from "@/screens/auth/ForgotPasswordEmailScreen";
import { ForgotPasswordOtpScreen } from "@/screens/auth/ForgotPasswordOtpScreen";
import { OnboardingScreen } from "@/screens/onboarding/OnboardingScreen";
import { MainAppNavigator } from "@/navigation/MainAppNavigator";
import type { AuthStackParamList } from "@/navigation/types";
import { WEB_PAGE_TITLE } from "@/lib/webDocumentTitle";
import { isOnboardingComplete } from "@/utils/profile";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

export function RootNavigator() {
  const { user, loading } = useSession();

  if (loading) {
    return <LoadingScreen message="Restoring session…" />;
  }

  if (!user) {
    return (
      <AuthStack.Navigator
        initialRouteName="Auth"
        screenOptions={{
          title: WEB_PAGE_TITLE,
          headerShown: false,
          animation: "slide_from_right",
          animationDuration: 280,
          gestureEnabled: true,
          fullScreenGestureEnabled: true
        }}
      >
        <AuthStack.Screen name="Auth" component={AuthScreen} options={{ animation: "fade", animationDuration: 320 }} />
        <AuthStack.Screen name="ForgotPasswordEmail" component={ForgotPasswordEmailScreen} />
        <AuthStack.Screen name="ForgotPasswordOtp" component={ForgotPasswordOtpScreen} />
      </AuthStack.Navigator>
    );
  }

  if (!isOnboardingComplete(user)) {
    return (
      <OnboardingStack.Navigator
        screenOptions={{
          title: WEB_PAGE_TITLE,
          headerShown: false,
          animation: "slide_from_right",
          animationDuration: 300,
          gestureEnabled: true
        }}
      >
        <OnboardingStack.Screen name="Onboarding" component={OnboardingScreen} />
      </OnboardingStack.Navigator>
    );
  }

  return (
    <MainStack.Navigator screenOptions={{ title: WEB_PAGE_TITLE, headerShown: false }}>
      <MainStack.Screen name="Main" component={MainAppNavigator} />
    </MainStack.Navigator>
  );
}
