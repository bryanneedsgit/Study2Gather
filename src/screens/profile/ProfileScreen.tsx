import { Button, Text, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { env } from "@/config/env";

const getBackendHealth = "queries:getBackendHealth" as unknown as FunctionReference<"query">;
const incrementTestCounter = "mutations:incrementTestCounter" as unknown as FunctionReference<"mutation">;

export function ProfileScreen() {
  const hasConvexEnv = Boolean(env.convexUrl);
  if (!hasConvexEnv) {
    return (
      <PlaceholderScreen title="Profile" subtitle="View account and study preferences.">
        <Text>Set EXPO_PUBLIC_CONVEX_URL to enable Convex backend smoke test.</Text>
      </PlaceholderScreen>
    );
  }

  const backendStatus = useQuery(getBackendHealth, { key: "profile-smoke-test" });
  const increment = useMutation(incrementTestCounter);

  return (
    <PlaceholderScreen title="Profile" subtitle="View account and study preferences.">
      <Text>Convex smoke test (query + mutation):</Text>
      <Text>{backendStatus ? `${backendStatus.message}. Count: ${backendStatus.count}` : "Loading backend status..."}</Text>
      <View style={{ marginTop: 10 }}>
        <Button title="Increment Convex Counter" onPress={() => increment({ key: "profile-smoke-test" })} />
      </View>
    </PlaceholderScreen>
  );
}
