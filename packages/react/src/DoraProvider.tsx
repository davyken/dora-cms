import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createDoraApi, type DoraApi } from "./api";
import type { ContentItem, ContentType, DoraConfig } from "./types";

interface DoraContextValue {
  config: DoraConfig;
  api: DoraApi;
  content: Record<string, ContentItem>;
  loading: boolean;
  isAdminMode: boolean;
  isAuthenticated: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
  setContentValue: (slotId: string, type: ContentType, value: string) => Promise<void>;
  resetContentValue: (slotId: string) => Promise<void>;
}

const DoraContext = createContext<DoraContextValue | null>(null);

export interface DoraProviderProps extends DoraConfig {
  children: React.ReactNode;
  /** Query param that puts the page into admin mode, e.g. ?edit=true. Defaults to "edit". */
  adminParam?: string;
}

export function DoraProvider({ children, siteId, apiUrl, adminParam = "edit" }: DoraProviderProps) {
  const config = useMemo(() => ({ siteId, apiUrl }), [siteId, apiUrl]);
  const api = useMemo(() => createDoraApi(config), [config]);

  const [content, setContent] = useState<Record<string, ContentItem>>({});
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isAdminMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get(adminParam) === "true";
  }, [adminParam]);

  useEffect(() => {
    setIsAuthenticated(api.isAuthenticated());
  }, [api]);

  useEffect(() => {
    let cancelled = false;
    api
      .getContent()
      .then(({ items }) => {
        if (cancelled) return;
        const map: Record<string, ContentItem> = {};
        for (const item of items) map[item.slotId] = item;
        setContent(map);
      })
      .catch(() => {
        // Public read failing (offline, backend not deployed yet) shouldn't
        // crash the page — components fall back to their default children.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const login = useCallback(
    async (password: string) => {
      await api.login(password);
      setIsAuthenticated(true);
    },
    [api]
  );

  const logout = useCallback(() => {
    api.logout();
    setIsAuthenticated(false);
  }, [api]);

  const setContentValue = useCallback(
    async (slotId: string, type: ContentType, value: string) => {
      const saved = await api.saveContent(slotId, type, value);
      setContent((prev) => ({ ...prev, [slotId]: saved }));
    },
    [api]
  );

  const resetContentValue = useCallback(
    async (slotId: string) => {
      await api.deleteContent(slotId);
      setContent((prev) => {
        const next = { ...prev };
        delete next[slotId];
        return next;
      });
    },
    [api]
  );

  const value: DoraContextValue = {
    config,
    api,
    content,
    loading,
    isAdminMode,
    isAuthenticated,
    login,
    logout,
    setContentValue,
    resetContentValue,
  };

  return <DoraContext.Provider value={value}>{children}</DoraContext.Provider>;
}

export function useDora(): DoraContextValue {
  const ctx = useContext(DoraContext);
  if (!ctx) {
    throw new Error("useDora() was called outside a <DoraProvider>. Wrap your app in <DoraProvider>.");
  }
  return ctx;
}
