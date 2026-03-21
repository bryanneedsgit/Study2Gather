import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { tabBarIcon } from "@/components/TabBarIcon";
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
        options={{ tabBarIcon: tabBarIcon("compass-outline") }}
      />
      <Tab.Screen
        name="Lock-In"
        component={LockInScreen}
        options={{ tabBarIcon: tabBarIcon("lock-closed-outline") }}
      />
      <Tab.Screen
        name="Check-In"
        component={CheckInScreen}
        options={{
          tabBarLabel: "Check in",
          tabBarIcon: tabBarIcon("qr-code-outline"),
          headerShown: false
        }}
      />
      <Tab.Screen
        name="Menu"
        component={CafeMenuScreen}
        options={{ tabBarIcon: tabBarIcon("restaurant-outline") }}
      />
      <Tab.Screen
        name="Forum"
        component={ForumScreen}
        options={{ tabBarIcon: tabBarIcon("chatbubbles-outline") }}
      />
      <Tab.Screen
        name="Study Spots"
        component={StudySpotsScreen}
        options={{ tabBarIcon: tabBarIcon("map-outline") }}
      />
      <Tab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{ tabBarIcon: tabBarIcon("gift-outline") }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ tabBarIcon: tabBarIcon("trophy-outline") }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: tabBarIcon("person-circle-outline") }}
      />
    </Tab.Navigator>
  );
}
