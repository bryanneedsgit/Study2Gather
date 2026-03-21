import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  AppState,
  type AppStateStatus
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/lib/convexApi";
import { useSession } from "@/context/SessionContext";
import type { Id } from "../../convex/_generated/dataModel";

function timezoneOffsetMinutesEast(): number {
  return -new Date().getTimezoneOffset();
}

type LockInSessionContextValue = {
  /** Active solo lock-in row from Convex, if any */
  activeSession: {
    _id: Id<"lock_in_sessions">;
    started_at: number;
  } | null;
  /** True while a session is active (shows fullscreen modal) */
  isLockedIn: boolean;
  /** Elapsed ms since start (for display) */
  elapsedMs: number;
  /** Last known app foreground state while locked */
  appState: AppStateStatus;
  startLockIn: () => Promise<void>;
  endLockIn: () => Promise<void>;
};

const LockInSessionContext = createContext<LockInSessionContextValue | null>(null);

export function LockInSessionProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const userId = user?._id;
  const active = useQuery(
    api.lockInSolo.getActiveSoloLockIn,
    userId ? { userId: userId as Id<"users"> } : "skip"
  );

  const startMutation = useMutation(api.lockInSolo.startSoloLockIn);
  const endMutation = useMutation(api.lockInSolo.endSoloLockIn);

  const [tick, setTick] = useState(0);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener("change", setAppState);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!active?._id) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [active?._id]);

  const elapsedMsDisplay = useMemo(() => {
    if (!active) return 0;
    return Date.now() - active.started_at;
  }, [active, tick]);

  const isLockedIn = Boolean(active && userId);

  const startLockIn = useCallback(async () => {
    if (!userId) throw new Error("Not signed in");
    await startMutation({
      userId: userId as Id<"users">,
      nowMs: Date.now(),
      timezoneOffsetMinutes: timezoneOffsetMinutesEast()
    });
  }, [startMutation, userId]);

  const endLockIn = useCallback(async () => {
    if (!userId || !active) return;
    await endMutation({
      sessionId: active._id,
      userId: userId as Id<"users">,
      endedAtMs: Date.now(),
      timezoneOffsetMinutes: timezoneOffsetMinutesEast()
    });
  }, [endMutation, userId, active]);

  const { width, height } = useWindowDimensions();

  const value = useMemo(
    (): LockInSessionContextValue => ({
      activeSession: active ?? null,
      isLockedIn,
      elapsedMs: elapsedMsDisplay,
      appState,
      startLockIn,
      endLockIn
    }),
    [active, isLockedIn, elapsedMsDisplay, appState, startLockIn, endLockIn]
  );

  return (
    <LockInSessionContext.Provider value={value}>
      {children}
      <Modal visible={isLockedIn} animationType="fade" presentationStyle="fullScreen">
        <View style={[styles.fullScreen, { width, height }]}>
          <Text style={styles.lockedTitle}>Locked in</Text>
          <Text style={styles.timer}>{formatDuration(elapsedMsDisplay)}</Text>
          <Text style={styles.hint}>
            Focus time is counting. For OS-level lock, use Guided Access (iOS) or screen pinning (Android) —
            this app runs a timer and awards points when you end the session.
          </Text>
          {appState !== "active" ? (
            <Text style={styles.warning}>App is in background — return to stay focused.</Text>
          ) : null}
          <Pressable style={styles.endBtn} onPress={() => void endLockIn()}>
            <Text style={styles.endBtnText}>End locked in</Text>
          </Pressable>
        </View>
      </Modal>
    </LockInSessionContext.Provider>
  );
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function useLockInSession(): LockInSessionContextValue {
  const ctx = useContext(LockInSessionContext);
  if (!ctx) throw new Error("useLockInSession must be used within LockInSessionProvider");
  return ctx;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  lockedTitle: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16
  },
  timer: {
    color: "#38bdf8",
    fontSize: 48,
    fontWeight: "700",
    fontVariant: ["tabular-nums"]
  },
  hint: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    marginTop: 24,
    marginBottom: 16,
    lineHeight: 20
  },
  warning: {
    color: "#fbbf24",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12
  },
  endBtn: {
    marginTop: 32,
    backgroundColor: "#e2e8f0",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12
  },
  endBtnText: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "700"
  }
});
