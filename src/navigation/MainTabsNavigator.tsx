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
import { hoverableTabButton } from "@/components/HoverableTabBarButton";
import { TabBarHoverProvider } from "@/context/TabBarHoverContext";
import { colors } from "@/theme/colors";
import {
  forLivelyTab,
  livelyTabTransitionSpec
} from "@/navigation/tabTransition";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabsNavigator() {
  return (
    <TabBarHoverProvider>
    <Tab.Navigator
      screenOptions={{
        /**
         * Do not set `title` here: `getLabel` uses `title` when `tabBarLabel` is omitted,
         * which would show “Study2Gather” on every tab. Browser tab title is set in
         * `App.tsx` via `setWebDocumentTitle()`.
         */
        headerShown: false,
        animation: "shift",
        transitionSpec: livelyTabTransitionSpec,
        sceneStyleInterpolator: forLivelyTab,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          paddingTop: 4,
          height: 58,
          elevation: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.35,
          shadowRadius: 12
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
        options={{
          tabBarIcon: tabBarIonicon("compass-outline"),
          tabBarButton: hoverableTabButton("Discover")
        }}
      />
      <Tab.Screen
        name="Lock-In"
        component={LockInScreen}
        options={{
          tabBarIcon: tabBarIonicon("lock-closed-outline"),
          tabBarButton: hoverableTabButton("Lock-In")
        }}
      />
      <Tab.Screen
        name="Check-In"
        component={CheckInScreen}
        options={{
          tabBarLabel: "Check in",
          tabBarIcon: tabBarIonicon("qr-code-outline"),
          headerShown: false,
          tabBarButton: hoverableTabButton("Check-In")
        }}
      />
      <Tab.Screen
        name="Menu"
        component={CafeMenuScreen}
        options={{
          tabBarIcon: tabBarIonicon("restaurant-outline"),
          tabBarButton: hoverableTabButton("Menu")
        }}
      />
      <Tab.Screen
        name="Forum"
        component={ForumScreen}
        options={{
          tabBarIcon: tabBarIonicon("chatbubbles-outline"),
          tabBarButton: hoverableTabButton("Forum")
        }}
      />
      <Tab.Screen
        name="Study Spots"
        component={StudySpotsScreen}
        options={{
          tabBarIcon: tabBarIonicon("map-outline"),
          tabBarButton: hoverableTabButton("Study Spots")
        }}
      />
      <Tab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{
          tabBarIcon: tabBarIonicon("gift-outline"),
          tabBarButton: hoverableTabButton("Rewards")
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: tabBarIonicon("trophy-outline"),
          tabBarButton: hoverableTabButton("Leaderboard")
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: tabBarIonicon("person-circle-outline"),
          tabBarButton: hoverableTabButton("Profile")
        }}
      />
    </Tab.Navigator>
    </TabBarHoverProvider>
  );
}
