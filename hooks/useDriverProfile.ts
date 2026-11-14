import { useCallback, useEffect, useState } from "react";
import * as driverService from "@services/driver";
import type { DriverDocument, DriverPerformance, DutyStatus } from "@/types/driver";

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export function useDriverPerformance() {
  const [state, setState] = useState<AsyncState<DriverPerformance>>({ data: null, isLoading: true, error: null });

  const fetchPerformance = useCallback(async () => {
    try {
      const data = await driverService.getPerformance();
      setState({ data, isLoading: false, error: null });
    } catch (e) {
      setState({ data: null, isLoading: false, error: e instanceof Error ? e.message : "Failed to load performance." });
    }
  }, []);

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    fetchPerformance();
  }, [fetchPerformance]);

  useEffect(() => {
    let active = true;
    driverService.getPerformance().then(
      (data) => {
        if (active) setState({ data, isLoading: false, error: null });
      },
      (e) => {
        if (active) setState({ data: null, isLoading: false, error: e instanceof Error ? e.message : "Failed to load performance." });
      }
    );
    return () => {
      active = false;
    };
  }, []);

  return { ...state, refresh };
}

export function useDriverDocuments() {
  const [state, setState] = useState<AsyncState<DriverDocument[]>>({ data: null, isLoading: true, error: null });

  const fetchDocuments = useCallback(async () => {
    try {
      const data = await driverService.getDocuments();
      setState({ data, isLoading: false, error: null });
    } catch (e) {
      setState({ data: null, isLoading: false, error: e instanceof Error ? e.message : "Failed to load documents." });
    }
  }, []);

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    let active = true;
    driverService.getDocuments().then(
      (data) => {
        if (active) setState({ data, isLoading: false, error: null });
      },
      (e) => {
        if (active) setState({ data: null, isLoading: false, error: e instanceof Error ? e.message : "Failed to load documents." });
      }
    );
    return () => {
      active = false;
    };
  }, []);

  return { ...state, refresh };
}

/** Optimistic duty-status toggle backed by services/driver.ts. */
export function useDutyStatusToggle(initial: DutyStatus, onChange: (status: DutyStatus) => void) {
  const [status, setStatus] = useState<DutyStatus>(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStatus(initial);
  }, [initial]);

  const toggle = useCallback(async () => {
    const next: DutyStatus = status === "online" ? "offline" : "online";
    setLoading(true);
    setStatus(next);
    try {
      await driverService.setDutyStatus(next);
      onChange(next);
    } catch {
      if (!__DEV__) {
        setStatus(status);
      } else {
        onChange(next);
      }
    } finally {
      setLoading(false);
    }
  }, [status, onChange]);

  return { status, loading, toggle };
}
