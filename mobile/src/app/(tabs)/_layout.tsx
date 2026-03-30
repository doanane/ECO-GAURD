import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAlerts } from '../../context/AlertContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { LiveIndicator } from '../../components/ui/LiveIndicator';

function ThemeToggleButton() {
  const { mode, toggle, colors } = useTheme();

  const icon =
    mode === 'dark' ? 'moon' :
    mode === 'light' ? 'sunny' :
    'phone-portrait-outline';

  const label =
    mode === 'dark' ? 'DARK' :
    mode === 'light' ? 'LIGHT' :
    'SYSTEM';

  return (
    <TouchableOpacity style={styles.themeBtn} onPress={toggle} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={16} color={colors.cyan} />
      <Text style={[styles.themeBtnText, { color: colors.textMuted }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ConnectionBadge() {
  const { connectionState } = useWebSocket();
  const { colors } = useTheme();
  const isConnected = connectionState === 'connected';
  const color = isConnected ? colors.green : colors.red;

  return (
    <View style={styles.connBadge}>
      <LiveIndicator color={color} size={7} />
      <Text style={[styles.connText, { color }]}>
        {isConnected ? 'LIVE' : connectionState === 'reconnecting' ? 'RECONNECTING' : 'OFFLINE'}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { colors, resolved } = useTheme();
  const { unacknowledgedCount } = useAlerts();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.headerBg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
        } as any,
        headerTitleStyle: {
          fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace',
          fontSize: 13,
          letterSpacing: 3,
          color: colors.cyan,
          fontWeight: '700',
        },
        headerRight: () => (
          <View style={styles.headerRight}>
            <ConnectionBadge />
            <ThemeToggleButton />
          </View>
        ),
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'web' ? 56 : 60,
          paddingBottom: Platform.OS === 'web' ? 6 : 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.cyan,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: 'monospace',
          fontSize: 9,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'ECOGUARD',
          tabBarLabel: 'Dashboard',
          tabBarActiveTintColor: colors.cyan,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'ANALYTICS',
          tabBarLabel: 'Analytics',
          tabBarActiveTintColor: colors.magenta,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'ALERTS',
          tabBarLabel: 'Alerts',
          tabBarActiveTintColor: colors.red,
          tabBarIcon: ({ color, size, focused }) => (
            <View>
              <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={size ?? 22} color={color} />
              {unacknowledgedCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.red }]}>
                  <Text style={styles.badgeText}>
                    {unacknowledgedCount > 9 ? '9+' : unacknowledgedCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="pipeline-map"
        options={{
          title: 'PIPELINE MAP',
          tabBarLabel: 'Map',
          tabBarActiveTintColor: colors.teal,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sensors"
        options={{
          title: 'SENSORS',
          tabBarLabel: 'Sensors',
          tabBarActiveTintColor: colors.green,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse-outline" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'REPORTS',
          tabBarLabel: 'Reports',
          tabBarActiveTintColor: colors.amber,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size ?? 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 14,
  },
  connBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  connText: {
    fontFamily: 'monospace',
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '700',
  },
  themeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.25)',
    backgroundColor: 'rgba(0,229,255,0.06)',
  },
  themeBtnText: {
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});
