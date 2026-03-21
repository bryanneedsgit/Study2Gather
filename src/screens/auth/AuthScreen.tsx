import { useState } from "react";
import { Button, Text, TextInput } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { RootStackParamList } from "@/navigation/types";
import { signInWithEmail } from "@/services/authService";

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;

export function AuthScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("Enter email to request OTP");

  const handleEmailOtp = async () => {
    if (!email.trim()) {
      setStatus("Please enter an email.");
      return;
    }
    try {
      await signInWithEmail(email.trim());
      setStatus("Auth placeholder ready. Convex backend is connected; auth flow comes next.");
    } catch {
      setStatus("Backend call failed. Check Convex setup and app env.");
    }
  };

  return (
    <PlaceholderScreen title="Auth" subtitle="Email sign-in and account creation will be added next.">
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="student@school.edu"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 10, marginBottom: 10 }}
      />
      <Button title="Send OTP" onPress={handleEmailOtp} />
      <Text style={{ marginTop: 10 }}>{status}</Text>
      <Button title="Continue to Onboarding" onPress={() => navigation.navigate("Onboarding")} />
    </PlaceholderScreen>
  );
}
