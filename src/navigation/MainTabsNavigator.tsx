import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MainTabParamList } from "@/navigation/types";
import { DiscoverScreen } from "@/screens/discover/DiscoverScreen";
import { LockInScreen } from "@/screens/lockin/LockInScreen";
import { ForumScreen } from "@/screens/forum/ForumScreen";
import { StudySpotsScreen } from "@/screens/study-spots/StudySpotsScreen";
import { RewardsScreen } from "@/screens/rewards/RewardsScreen";
import { LeaderboardScreen } from "@/screens/leaderboard/LeaderboardScreen";
import { ProfileScreen } from "@/screens/profile/ProfileScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabsNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Lock-In" component={LockInScreen} />
      <Tab.Screen name="Forum" component={ForumScreen} />
      <Tab.Screen name="Study Spots" component={StudySpotsScreen} />
      <Tab.Screen name="Rewards" component={RewardsScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
