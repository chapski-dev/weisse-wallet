import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '@/theme/theme';

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { name: 'wallet',   label: 'КОШЕЛЁК',   icon: 'wallet-outline'   },
  { name: 'explore',  label: 'ИСТОРИЯ',    icon: 'time-outline'     },
] as const;

// ─── Pill Tab Bar ─────────────────────────────────────────────────────────────

function PillTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, insets } = useAppTheme();

  // Filter out hidden tabs (index redirect)
  const visibleRoutes = state.routes.filter((r) => TABS.some((t) => t.name === r.name));

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.pill}>
        {visibleRoutes.map((route) => {
          const tab = TABS.find((t) => t.name === route.name)!;
          const routeIndex = state.routes.indexOf(route);
          const isActive = state.index === routeIndex;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isActive && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity key={route.key} style={styles.tabTouch} onPress={onPress} activeOpacity={1}>
              <View style={[styles.tabInner, isActive && styles.tabActive]}>
                <Ionicons name={tab.icon} size={18} color={isActive ? '#fff' : '#6B7280'} />
                <Text style={[styles.tabLabel, { color: isActive ? '#fff' : '#6B7280' }]}>
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <PillTabBar {...props} />}>
      <Tabs.Screen name="wallet" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingHorizontal: 21,
  },
  pill: {
    height: 62,
    backgroundColor: '#161B22',
    borderRadius: 36,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabTouch: {
    flex: 1,
    height: '100%',
  },
  tabInner: {
    flex: 1,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabActive: {
    backgroundColor: '#3B82F6',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
