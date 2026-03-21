import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { clearStoredUserId, readStoredUserId, writeStoredUserId } from "@/lib/sessionStorage";

const getCurrentUserRef = "auth:getCurrentUser" as unknown as FunctionReference<"query">;
const signInWithEmailRef = "auth:signInWithEmail" as unknown as FunctionReference<"mutation">;
const completeOnboardingRef = "auth:completeOnboarding" as unknown as FunctionReference<"mutation">;

export type SessionUser = {
  _id: string;
  email: string;
  name?: string;
  school?: string;
  course?: string;
  age?: number;
  onboarding_completed: boolean;
  points_total: number;
  tier_status: string;
  created_at: number;
};

type SessionContextValue = {
  hydrated: boolean;
  userId: string | null;
  user: SessionUser | null | undefined;
  loading: boolean;
  signInWithEmail: (email: string) => Promise<void>;
  completeOnboarding: (input: { school: string; course: string; age: number }) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void readStoredUserId().then((id) => {
      setUserId(id);
      setHydrated(true);
    });
  }, []);

  const user = useQuery(getCurrentUserRef, userId ? { userId: userId as never } : "skip") as
    | SessionUser
    | null
    | undefined;

  useEffect(() => {
    if (!hydrated || !userId) return;
    if (user === null) {
      void clearStoredUserId();
      setUserId(null);
    }
  }, [hydrated, userId, user]);

  const signInMutation = useMutation(signInWithEmailRef);
  const completeMutation = useMutation(completeOnboardingRef);

  const signInWithEmail = useCallback(
    async (email: string) => {
      const result = (await signInMutation({ email })) as { userId: string };
      await writeStoredUserId(result.userId);
      setUserId(result.userId);
    },
    [signInMutation]
  );

  const completeOnboarding = useCallback(
    async (input: { school: string; course: string; age: number }) => {
      if (!userId) throw new Error("Not signed in");
      await completeMutation({
        userId: userId as never,
        school: input.school,
        course: input.course,
        age: input.age
      });
    },
    [completeMutation, userId]
  );

  const signOut = useCallback(async () => {
    await clearStoredUserId();
    setUserId(null);
  }, []);

  /** `user === null` means invalid id — keep loading until storage clears in effect. */
  const loading =
    !hydrated ||
    (userId !== null && user === undefined) ||
    (userId !== null && user === null);

  const value = useMemo(
    (): SessionContextValue => ({
      hydrated,
      userId,
      user: user ?? null,
      loading,
      signInWithEmail,
      completeOnboarding,
      signOut
    }),
    [hydrated, userId, user, loading, signInWithEmail, completeOnboarding, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
