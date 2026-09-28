import { useCallback, useEffect, useState } from "react";
import * as tripsService from "@services/trips";
import type { DashboardSummary } from "@/types/dashboard";
import type { ProofOfDelivery, Trip, TripListFilter, TripStatus } from "@/types/trip";

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export function useDashboard() {
  const [state, setState] = useState<AsyncState<DashboardSummary>>({ data: null, isLoading: true, error: null });

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await tripsService.getDashboardSummary();
      setState({ data, isLoading: false, error: null });
    } catch (e) {
      setState({ data: null, isLoading: false, error: e instanceof Error ? e.message : "Failed to load dashboard." });
    }
  }, []);

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    let active = true;
    tripsService.getDashboardSummary().then(
      (data) => {
        if (active) setState({ data, isLoading: false, error: null });
      },
      (e) => {
        if (active) setState({ data: null, isLoading: false, error: e instanceof Error ? e.message : "Failed to load dashboard." });
      }
    );

    const unsubscribe = tripsService.subscribeToDriverTrips("all", () => {
      tripsService.getDashboardSummary().then((data) => {
        if (active) setState({ data, isLoading: false, error: null });
      });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return { ...state, refresh };
}

export function useTripList(filter: TripListFilter) {
  const [state, setState] = useState<AsyncState<Trip[]>>({ data: null, isLoading: true, error: null });

  const fetchTrips = useCallback(async () => {
    try {
      const data = await tripsService.getTrips(filter);
      setState({ data, isLoading: false, error: null });
    } catch (e) {
      setState({ data: null, isLoading: false, error: e instanceof Error ? e.message : "Failed to load trips." });
    }
  }, [filter]);

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    fetchTrips();
  }, [fetchTrips]);

  useEffect(() => {
    let active = true;
    tripsService.getTrips(filter).then(
      (data) => {
        if (active) setState({ data, isLoading: false, error: null });
      },
      (e) => {
        if (active) setState({ data: null, isLoading: false, error: e instanceof Error ? e.message : "Failed to load trips." });
      }
    );

    const unsubscribe = tripsService.subscribeToDriverTrips("all", () => {
      tripsService.getTrips(filter).then((data) => {
        if (active) setState({ data, isLoading: false, error: null });
      });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [filter]);

  return { ...state, refresh };
}

export function useTrip(id: string | undefined) {
  const [state, setState] = useState<AsyncState<Trip>>({ data: null, isLoading: true, error: null });

  const fetchTrip = useCallback(async () => {
    if (!id) return;
    try {
      const data = await tripsService.getTripById(id);
      setState({ data, isLoading: false, error: null });
    } catch (e) {
      setState({ data: null, isLoading: false, error: e instanceof Error ? e.message : "Failed to load trip." });
    }
  }, [id]);

  const refresh = useCallback(() => {
    if (!id) return;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    fetchTrip();
  }, [id, fetchTrip]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    tripsService.getTripById(id).then(
      (data) => {
        if (active) setState({ data, isLoading: false, error: null });
      },
      (e) => {
        if (active) setState({ data: null, isLoading: false, error: e instanceof Error ? e.message : "Failed to load trip." });
      }
    );

    const unsubscribe = tripsService.subscribeToDriverTrips(id, () => {
      tripsService.getTripById(id).then((data) => {
        if (active) setState({ data, isLoading: false, error: null });
      });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [id]);

  const advanceStatus = useCallback(
    async (nextStatus: TripStatus) => {
      if (!id) return;
      const updated = await tripsService.advanceTripStatus(id, nextStatus);
      setState((s) => ({ ...s, data: updated }));
      return updated;
    },
    [id]
  );

  const accept = useCallback(async () => {
    if (!id) return;
    const updated = await tripsService.acceptTrip(id);
    setState((s) => ({ ...s, data: updated }));
    return updated;
  }, [id]);

  const submitPod = useCallback(
    async (pod: ProofOfDelivery) => {
      if (!id) return;
      const updated = await tripsService.submitProofOfDelivery(id, pod);
      setState((s) => ({ ...s, data: updated }));
      return updated;
    },
    [id]
  );

  return { ...state, refresh, advanceStatus, accept, submitPod };
}
