import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";

type TabBarHoverContextValue = {
  hoveredTabId: string | null;
  setHoveredTabId: (id: string | null) => void;
  /** Clear only if this tab was the hovered one (avoids fighting when moving between tabs). */
  clearHoverIfTab: (id: string) => void;
};

const TabBarHoverContext = createContext<TabBarHoverContextValue | null>(null);

export function TabBarHoverProvider({ children }: { children: ReactNode }) {
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);

  const clearHoverIfTab = useCallback((id: string) => {
    setHoveredTabId((current) => (current === id ? null : current));
  }, []);

  const value = useMemo(
    () => ({ hoveredTabId, setHoveredTabId, clearHoverIfTab }),
    [hoveredTabId, clearHoverIfTab]
  );

  return (
    <TabBarHoverContext.Provider value={value}>
      {children}
    </TabBarHoverContext.Provider>
  );
}

export function useTabBarHover() {
  const ctx = useContext(TabBarHoverContext);
  if (!ctx) {
    return {
      hoveredTabId: null as string | null,
      setHoveredTabId: (_id: string | null) => {},
      clearHoverIfTab: (_id: string) => {}
    };
  }
  return ctx;
}
