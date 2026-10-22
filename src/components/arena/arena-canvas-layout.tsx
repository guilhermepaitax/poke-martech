"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type ArenaCanvasLayoutContextValue = {
  active: boolean;
  setActive: (active: boolean) => void;
};

const ArenaCanvasLayoutContext =
  createContext<ArenaCanvasLayoutContextValue | null>(null);

function ArenaCanvasLayoutProvider({
  pathname,
  children,
}: {
  pathname: string;
  children: ReactNode;
}) {
  const [state, setState] = useState({ pathname, active: false });
  if (state.pathname !== pathname) {
    setState({ pathname, active: false });
  }
  const active = state.pathname === pathname && state.active;

  return (
    <ArenaCanvasLayoutContext.Provider
      value={{
        active,
        setActive: (next) => setState({ pathname, active: next }),
      }}
    >
      {children}
    </ArenaCanvasLayoutContext.Provider>
  );
}

function useArenaCanvasLayout() {
  const value = useContext(ArenaCanvasLayoutContext);
  if (!value) throw new Error("ArenaCanvasLayout ausente.");
  return value;
}

export { ArenaCanvasLayoutProvider, useArenaCanvasLayout };
