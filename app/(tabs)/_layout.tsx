import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";

import { useAppTheme } from "@/theme/theme";

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
	{ name: "wallet", label: "КОШЕЛЁК", icon: "wallet-outline" },
	{ name: "nft", label: "NFT", icon: "image-outline" },
	{ name: "explore", label: "ИСТОРИЯ", icon: "time-outline" },
	{ name: "earn", label: "EARN", icon: "trending-up-outline" },
] as const;

const SPRING_CONFIG = { damping: 20, stiffness: 200, mass: 0.8 };

// ─── Pill Tab Bar ─────────────────────────────────────────────────────────────

function PillTabBar({ state, navigation }: BottomTabBarProps) {
	const { colors, insets } = useAppTheme();
	const [pillWidth, setPillWidth] = useState(0);
	const offset = useSharedValue(0);

	// Filter out hidden tabs (index redirect)
	const visibleRoutes = state.routes.filter((r) =>
		TABS.some((t) => t.name === r.name),
	);
	const activeIndex = visibleRoutes.findIndex(
		(r) => state.routes.indexOf(r) === state.index,
	);
	const tabCount = visibleRoutes.length;
	const tabW = pillWidth > 0 ? pillWidth / tabCount : 0;

	const activeTab = TABS.find(
		(t) => t.name === visibleRoutes[activeIndex]?.name,
	);
	const activeColor = activeTab?.name === "earn" ? "#10B981" : "#3B82F6";

	if (pillWidth > 0) {
		offset.value = withSpring(activeIndex * tabW, SPRING_CONFIG);
	}

	const slidingStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: offset.value }],
	}));

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: colors.background,
					paddingBottom: insets.bottom + 8,
				},
			]}
		>
			<View
				style={styles.pill}
				onLayout={(e) => setPillWidth(e.nativeEvent.layout.width - 8)}
			>
				{/* Sliding active background */}
				{pillWidth > 0 && (
					<Animated.View
						style={[
							styles.slidingPill,
							{ width: tabW, backgroundColor: activeColor },
							slidingStyle,
						]}
					/>
				)}

				{visibleRoutes.map((route) => {
					const tab = TABS.find((t) => t.name === route.name)!;
					const routeIndex = state.routes.indexOf(route);
					const isActive = state.index === routeIndex;

					const onPress = () => {
						const event = navigation.emit({
							type: "tabPress",
							target: route.key,
							canPreventDefault: true,
						});
						if (!isActive && !event.defaultPrevented) {
							navigation.navigate(route.name);
						}
					};

					return (
						<TouchableOpacity
							key={route.key}
							style={styles.tabTouch}
							onPress={onPress}
							activeOpacity={1}
						>
							<View style={styles.tabInner}>
								<Ionicons
									name={tab.icon}
									size={18}
									color={isActive ? "#fff" : "#6B7280"}
								/>
								<Text
									style={[
										styles.tabLabel,
										{ color: isActive ? "#fff" : "#6B7280" },
									]}
								>
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
		<Tabs
			screenOptions={{ headerShown: false }}
			tabBar={(props) => <PillTabBar {...props} />}
		>
			<Tabs.Screen name="wallet" options={{ title: "Кошелёк" }} />
			<Tabs.Screen name="nft" options={{ title: "NFT" }} />
			<Tabs.Screen name="explore" options={{ title: "История" }} />
			<Tabs.Screen name="earn" options={{ title: "Earn" }} />
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
		backgroundColor: "#161B22",
		borderRadius: 36,
		borderWidth: 1,
		borderColor: "#30363D",
		padding: 4,
		flexDirection: "row",
		alignItems: "center",
	},
	tabTouch: {
		flex: 1,
		height: "100%",
	},
	tabInner: {
		flex: 1,
		borderRadius: 26,
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
	},
	slidingPill: {
		position: "absolute",
		top: 0,
		left: 0,
		bottom: 0,
		borderRadius: 26,
	},
	tabLabel: {
		fontSize: 10,
		fontWeight: "600",
		letterSpacing: 0.5,
	},
});
