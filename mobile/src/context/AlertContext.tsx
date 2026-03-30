import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Alert as AlertModel } from '../types/alert';
import { useWebSocket } from './WebSocketContext';
import api from '../services/api';

interface AlertContextValue {
  activeAlerts: AlertModel[];
  allAlerts: AlertModel[];
  criticalCount: number;
  warningCount: number;
  unacknowledgedCount: number;
  acknowledgeAlert: (id: number) => Promise<void>;
  resolveAlert: (id: number, action: string) => Promise<void>;
  refresh: () => void;
}

const AlertContext = createContext<AlertContextValue>({
  activeAlerts: [],
  allAlerts: [],
  criticalCount: 0,
  warningCount: 0,
  unacknowledgedCount: 0,
  acknowledgeAlert: async () => {},
  resolveAlert: async () => {},
  refresh: () => {},
});

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const { client } = useWebSocket();
  const [activeAlerts, setActiveAlerts] = useState<AlertModel[]>([]);
  const [allAlerts, setAllAlerts] = useState<AlertModel[]>([]);

  const fetchAlerts = useCallback(async () => {
    try {
      const [active, all] = await Promise.all([
        api.getAlerts(true),
        api.getAlerts(false, 48),
      ]);
      setActiveAlerts(Array.isArray(active) ? active : []);
      setAllAlerts(Array.isArray(all) ? all : []);
    } catch (err) {
      console.warn('[Alerts] Fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  useEffect(() => {
    const handleAlert = (payload: AlertModel) => {
      setActiveAlerts((prev) => {
        const exists = prev.find((a) => a.id === payload.id);
        if (exists) return prev;
        return [payload, ...prev];
      });
      setAllAlerts((prev) => {
        const exists = prev.find((a) => a.id === payload.id);
        if (exists) return prev;
        return [payload, ...prev];
      });
    };

    client.on('alert', handleAlert);
    return () => client.off('alert', handleAlert);
  }, [client]);

  const acknowledgeAlert = useCallback(async (id: number) => {
    try {
      const updated = await api.acknowledgeAlert(id);
      setActiveAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setAllAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      console.error('[Alerts] Acknowledge failed:', err);
    }
  }, []);

  const resolveAlert = useCallback(async (id: number, action: string) => {
    try {
      const updated = await api.resolveAlert(id, action);
      setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
      setAllAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      console.error('[Alerts] Resolve failed:', err);
    }
  }, []);

  const criticalCount = activeAlerts.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = activeAlerts.filter((a) => a.severity === 'WARNING').length;
  const unacknowledgedCount = activeAlerts.filter((a) => !a.acknowledged).length;

  return (
    <AlertContext.Provider
      value={{
        activeAlerts,
        allAlerts,
        criticalCount,
        warningCount,
        unacknowledgedCount,
        acknowledgeAlert,
        resolveAlert,
        refresh: fetchAlerts,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  return useContext(AlertContext);
}
