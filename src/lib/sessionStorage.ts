import AsyncStorage from "@react-native-async-storage/async-storage";

export const SESSION_USER_ID_KEY = "study2gather_user_id";

export async function readStoredUserId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SESSION_USER_ID_KEY);
  } catch {
    return null;
  }
}

export async function writeStoredUserId(userId: string): Promise<void> {
  await AsyncStorage.setItem(SESSION_USER_ID_KEY, userId);
}

export async function clearStoredUserId(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_USER_ID_KEY);
}
