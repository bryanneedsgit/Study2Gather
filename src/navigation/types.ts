import { NavigatorScreenParams } from "@react-navigation/native";

/** Screens inside the unauthenticated stack (sign-in + password recovery UI). */
export type AuthStackParamList = {
  Auth: undefined;
  Welcome: undefined;
  SignIn: undefined;
  ForgotPasswordEmail: undefined;
  ForgotPasswordOtp: { email: string };
};

export type MainTabParamList = {
  Discover: undefined;
  "Lock-In": undefined;
  "Check-In": undefined;
  Forum: undefined;
  "Study Spots": undefined;
  Rewards: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};
