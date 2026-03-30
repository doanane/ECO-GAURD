import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { WebSocketProvider } from '../context/WebSocketContext';
import { SensorDataProvider } from '../context/SensorDataContext';
import { AlertProvider } from '../context/AlertContext';

function AppShell() {
  const { resolved } = useTheme();
  return (
    <>
      <StatusBar style={resolved === 'light' ? 'dark' : 'light'} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <WebSocketProvider>
        <SensorDataProvider>
          <AlertProvider>
            <AppShell />
          </AlertProvider>
        </SensorDataProvider>
      </WebSocketProvider>
    </ThemeProvider>
  );
}
