import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo
} from "react";
import { useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/lib/convexApi";

export type SessionUser = {
  _id: string;
  email?: string;
  name?: string;
  school?: string;
  course?: string;
  age?: number;
  onboarding_completed: boolean;
  points: number;
  tier_status: string;
  created_at: number;
};

type SessionContextValue = {
  user: SessionUser | null | undefined;
  loading: boolean;
  signInWithPassword: (input: {
    email: string;
    password: string;
    flow: "signIn" | "signUp";
  }) => Promise<void>;
  completeOnboarding: (input: { school: string; course: string; age: number }) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const user = useQuery(api.profile.getCurrentUser, {}) as SessionUser | null | undefined;
  const completeMutation = useMutation(api.profile.completeOnboarding);
  const { signIn, signOut: authSignOut } = useAuthActions();

  const signInWithPassword = useCallback(
    async (input: { email: string; password: string; flow: "signIn" | "signUp" }) => {
      await signIn("password", {
        email: input.email.trim().toLowerCase(),
        password: input.password,
        flow: input.flow
      });
    },
    [signIn]
  );

  const completeOnboarding = useCallback(
    async (input: { school: string; course: string; age: number }) => {
      await completeMutation({
        school: input.school,
        course: input.course,
        age: input.age
      });
    },
    [completeMutation]
  );

  const signOut = useCallback(async () => {
    await authSignOut();
  }, [authSignOut]);

  const loading = user === undefined;

  const value = useMemo(
    (): SessionContextValue => ({
      user: user ?? null,
      loading,
      signInWithPassword,
      completeOnboarding,
      signOut
    }),
    [user, loading, signInWithPassword, completeOnboarding, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
