import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { tabBarGlyph } from "@/components/TabBarGlyph";
import { MainTabParamList } from "@/navigation/types";
import { DiscoverScreen } from "@/screens/discover/DiscoverScreen";
import { LockInScreen } from "@/screens/lockin/LockInScreen";
import { ForumScreen } from "@/screens/forum/ForumScreen";
import { StudySpotsScreen } from "@/screens/study-spots/StudySpotsScreen";
import { RewardsScreen } from "@/screens/rewards/RewardsScreen";
import { LeaderboardScreen } from "@/screens/leaderboard/LeaderboardScreen";
import { CheckInScreen } from "@/screens/check-in/CheckInScreen";
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
        options={{ tabBarIcon: tabBarGlyph("D") }}
      />
      <Tab.Screen
        name="Lock-In"
        component={LockInScreen}
        options={{ tabBarIcon: tabBarGlyph("I") }}
      />
      <Tab.Screen
        name="Check-In"
        component={CheckInScreen}
        options={{
          tabBarLabel: "Check in",
          tabBarIcon: tabBarGlyph("C"),
          headerShown: false
        }}
      />
      <Tab.Screen name="Forum" component={ForumScreen} options={{ tabBarIcon: tabBarGlyph("F") }} />
      <Tab.Screen
        name="Study Spots"
        component={StudySpotsScreen}
        options={{ tabBarIcon: tabBarGlyph("M") }}
      />
      <Tab.Screen name="Rewards" component={RewardsScreen} options={{ tabBarIcon: tabBarGlyph("R") }} />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ tabBarIcon: tabBarGlyph("T") }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabBarGlyph("P") }} />
    </Tab.Navigator>
  );
}
