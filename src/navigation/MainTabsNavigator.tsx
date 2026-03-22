import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { tabBarIonicon } from "@/components/TabBarIonicon";
import { MainTabParamList } from "@/navigation/types";
import { DiscoverScreen } from "@/screens/discover/DiscoverScreen";
import { LockInScreen } from "@/screens/lockin/LockInScreen";
import { ForumScreen } from "@/screens/forum/ForumScreen";
import { StudySpotsScreen } from "@/screens/study-spots/StudySpotsScreen";
import { RewardsScreen } from "@/screens/rewards/RewardsScreen";
import { LeaderboardScreen } from "@/screens/leaderboard/LeaderboardScreen";
import { CheckInScreen } from "@/screens/check-in/CheckInScreen";
import { CafeMenuScreen } from "@/screens/menu/CafeMenuScreen";
import { ProfileScreen } from "@/screens/profile/ProfileScreen";
import { colors } from "@/theme/colors";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        /** Title + Log out live in `ScreenContainer` (`tabTitle`). */
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          paddingTop: 4,
          height: 58
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600"
        }
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{ tabBarIcon: tabBarIonicon("compass-outline") }}
      />
      <Tab.Screen
        name="Lock-In"
        component={LockInScreen}
        options={{ tabBarIcon: tabBarIonicon("lock-closed-outline") }}
      />
      <Tab.Screen
        name="Check-In"
        component={CheckInScreen}
        options={{
          tabBarLabel: "Check in",
          tabBarIcon: tabBarIonicon("qr-code-outline"),
          headerShown: false
        }}
      />
      <Tab.Screen
        name="Forum"
        component={ForumScreen}
        options={{ tabBarIcon: tabBarIonicon("chatbubbles-outline") }}
      />
      <Tab.Screen
        name="Study Spots"
        component={StudySpotsScreen}
        options={{ tabBarIcon: tabBarIonicon("map-outline") }}
      />
      <Tab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{ tabBarIcon: tabBarIonicon("gift-outline") }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ tabBarIcon: tabBarIonicon("trophy-outline") }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: tabBarIonicon("person-circle-outline") }}
      />
    </Tab.Navigator>
  );
}
