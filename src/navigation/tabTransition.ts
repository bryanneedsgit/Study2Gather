import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { Easing } from "react-native";

/** Slightly gentler slide than the default shift (±50), plus light scale for depth. */
const SLIDE_PX = 28;

export const livelyTabTransitionSpec: NonNullable<
  BottomTabNavigationOptions["transitionSpec"]
> = {
  animation: "timing",
  config: {
    duration: 300,
    easing: Easing.inOut(Easing.cubic)
  }
};

type TabSceneInterpolator = NonNullable<
  BottomTabNavigationOptions["sceneStyleInterpolator"]
>;

export const forLivelyTab: TabSceneInterpolator = ({ current }) => {
  const { progress } = current;
  return {
    sceneStyle: {
      opacity: progress.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [0, 1, 0]
      }),
      transform: [
        {
          translateX: progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-SLIDE_PX, 0, SLIDE_PX]
          })
        },
        {
          scale: progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [0.985, 1, 0.985]
          })
        }
      ]
    }
  };
};
