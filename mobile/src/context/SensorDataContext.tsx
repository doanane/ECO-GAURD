import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { SensorReading, KPISnapshot } from '../types/reading';
import { useWebSocket } from './WebSocketContext';
import api from '../services/api';

interface SensorDataContextValue {
  latestReadings: Record<string, SensorReading>;
  kpiSnapshot: KPISnapshot | null;
  leakRiskPercent: number;
  riskLevel: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  readingHistory: Record<string, number[]>;
  isLoading: boolean;
  refresh: () => void;
}

const HISTORY_SIZE = 60;

const defaultContext: SensorDataContextValue = {
  latestReadings: {},
  kpiSnapshot: null,
  leakRiskPercent: 0,
  riskLevel: 'NOMINAL',
  readingHistory: {},
  isLoading: true,
  refresh: () => {},
};

const SensorDataContext = createContext<SensorDataContextValue>(defaultContext);

export function SensorDataProvider({ children }: { children: React.ReactNode }) {
  const { client } = useWebSocket();
  const [latestReadings, setLatestReadings] = useState<Record<string, SensorReading>>({});
  const [kpiSnapshot, setKpiSnapshot] = useState<KPISnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const historyRef = useRef<Record<string, number[]>>({});
  const [historyVersion, setHistoryVersion] = useState(0);

  const fetchKPI = useCallback(async () => {
    try {
      const kpi = await api.getKPISnapshot();
      setKpiSnapshot(kpi);
      setIsLoading(false);
    } catch (err) {
      console.warn('[SensorData] KPI fetch failed:', err);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKPI();
    const interval = setInterval(fetchKPI, 30000);
    return () => clearInterval(interval);
  }, [fetchKPI]);

  useEffect(() => {
    const handleReading = (payload: SensorReading) => {
      const sid = payload.sensor_id;

      setLatestReadings((prev) => ({ ...prev, [sid]: payload }));

      // Maintain rolling history
      if (!historyRef.current[sid]) {
        historyRef.current[sid] = [];
      }
      historyRef.current[sid].push(payload.value);
      if (historyRef.current[sid].length > HISTORY_SIZE) {
        historyRef.current[sid].shift();
      }
      setHistoryVersion((v) => v + 1);
    };

    client.on('sensor_reading', handleReading);
    return () => client.off('sensor_reading', handleReading);
  }, [client]);

  const leakRiskPercent = kpiSnapshot?.composite_risk ?? 0;
  const riskLevel = (kpiSnapshot?.risk_level ?? 'NOMINAL') as 'NOMINAL' | 'WARNING' | 'CRITICAL';

  return (
    <SensorDataContext.Provider
      value={{
        latestReadings,
        kpiSnapshot,
        leakRiskPercent,
        riskLevel,
        readingHistory: historyRef.current,
        isLoading,
        refresh: fetchKPI,
      }}
    >
      {children}
    </SensorDataContext.Provider>
  );
}

export function useSensorData() {
  return useContext(SensorDataContext);
}
