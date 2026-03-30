import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const isReconnecting = connectionState === 'reconnecting';
  const color = isConnected ? colors.green : colors.red;
  // Shorten label so it never overlaps the title on narrow screens
  const label = isConnected ? 'LIVE' : isReconnecting ? 'SYNC' : 'OFF';

  return (
    <View style={[styles.connBadge, { borderColor: color + '40', backgroundColor: color + '12' }]}>
      <LiveIndicator color={color} size={6} />
      <Text style={[styles.connText, { color }]}>{label}</Text>
    </View>
  );
}

function HeaderLeft({ title, colors }: { title: string; colors: any }) {
  const isDashboard = title === 'DASHBOARD';
  return (
    <View style={styles.headerLeft}>
      <Image
        source={require('../../assets/image.png')}
        style={styles.logoImg}
        resizeMode="contain"
      />
      <View style={styles.headerTitleBlock}>
        <Text style={[styles.headerAppName, { color: colors.cyan }]}>ECOGUARD</Text>
        {!isDashboard && (
          <Text style={[styles.headerPageName, { color: colors.textMuted }]}>{title}</Text>
        )}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { colors, resolved } = useTheme();
  const { unacknowledgedCount } = useAlerts();
  const insets = useSafeAreaInsets();

  // On iOS the home indicator area needs extra bottom space.
  // We compute this once here so tabBarStyle can use the value.
  const tabBarBottomPad = Platform.OS === 'web' ? 6 : Math.max(insets.bottom, 4);
  const tabBarHeight    = Platform.OS === 'web' ? 56 : 50 + tabBarBottomPad;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.headerBg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
        } as any,
        // Hide the default centered title — we render our own in headerLeft
        headerTitle: () => null,
        headerLeft: () => (
          <HeaderLeft
            title={route.name.replace(/-/g, ' ').toUpperCase()}
            colors={colors}
          />
        ),
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
          height: tabBarHeight,
          paddingBottom: tabBarBottomPad,
          paddingTop: 6,
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
      })}
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
  // ── Header left: logo + app/page name ──────────────────────────────
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 14,
  },
  logoImg: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  headerTitleBlock: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  headerAppName: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2.5,
    lineHeight: 14,
  },
  headerPageName: {
    fontFamily: 'monospace',
    fontSize: 8,
    letterSpacing: 1.5,
    lineHeight: 11,
    marginTop: 1,
  },

  // ── Header right ───────────────────────────────────────────────────
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 12,
  },
  connBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  connText: {
    fontFamily: 'monospace',
    fontSize: 8,
    letterSpacing: 0.8,
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
