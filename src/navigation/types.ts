import { NavigatorScreenParams } from "@react-navigation/native";

export type MainTabParamList = {
  Discover: undefined;
  "Lock-In": undefined;
  Forum: undefined;
  "Study Spots": undefined;
  Rewards: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};
