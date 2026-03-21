import { Button, Text } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { RootStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

export function OnboardingScreen({ navigation }: Props) {
  return (
    <PlaceholderScreen title="Onboarding" subtitle="Collect school, course, and age for matchmaking.">
      <Text>Current status: placeholder form flow.</Text>
      <Button title="Enter App" onPress={() => navigation.replace("Main", { screen: "Discover" })} />
    </PlaceholderScreen>
  );
}
