import { Ionicons } from "@expo/vector-icons";
import type React from "react";
import type { FC } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
	type SharedValue,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";

import { useAppTheme } from "@/theme/theme";

type AccordionProps = {
	label: string;
	children: React.ReactNode;
	onPress?: (val: boolean) => void;
	open?: boolean;
};

export const Accordion: FC<AccordionProps> = ({
	label = "Press me",
	children = "Some info",
	onPress,
	open = false,
}) => {
	const isOpen = useSharedValue(open);
	const { colors } = useAppTheme();

	const _onPress = () => {
		isOpen.value = !isOpen.value;
		onPress && onPress(!open);
	};

	const arrowStyle = useAnimatedStyle(() => ({
		transform: [
			{
				rotate: withTiming(isOpen.value ? "180deg" : "0deg", { duration: 300 }),
			},
		],
	}));

	return (
		<View>
			<TouchableOpacity
				style={{ ...styles.button, backgroundColor: colors.white }}
				activeOpacity={0.5}
				onPress={_onPress}
			>
				<Text
					children={label}
					style={[styles.buttonLabel, { color: colors.grey_800 }]}
				/>
				<Animated.View style={arrowStyle}>
					<Ionicons name="chevron-down" size={20} color={colors.grey_600} />
				</Animated.View>
			</TouchableOpacity>

			<AccordionContent isExpanded={isOpen} viewKey="Accordion">
				{typeof children === "string" ? (
					<Text children={children} style={{ color: colors.grey_800 }} />
				) : (
					children
				)}
			</AccordionContent>
		</View>
	);
};

type AccordionContentProps = {
	isExpanded: SharedValue<boolean>;
	children: React.ReactNode;
	viewKey: string;
	duration?: number;
};

const AccordionContent: FC<AccordionContentProps> = ({
	isExpanded,
	children,
	viewKey,
	duration = 300,
}) => {
	const height = useSharedValue(0);

	const derivedHeight = useDerivedValue(() =>
		withTiming(height.value * Number(isExpanded.value), { duration }),
	);
	const bodyStyle = useAnimatedStyle(() => ({
		height: derivedHeight.value,
		marginVertical: 12 * Number(isExpanded.value),
	}));

	return (
		<Animated.View
			key={`accordionContent_${viewKey}`}
			style={[styles.animatedView, bodyStyle]}
		>
			<View
				onLayout={(e) => {
					height.value = e.nativeEvent.layout.height;
				}}
				style={styles.wrapper}
			>
				{children}
			</View>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	animatedView: {
		overflow: "hidden",
		width: "100%",
	},
	button: {
		alignItems: "center",
		flexDirection: "row",
		gap: 15,
		justifyContent: "space-between",
		minHeight: 40,
		paddingHorizontal: 12,
		width: "100%",
	},
	buttonLabel: { flex: 1, fontSize: 16, fontWeight: "600" },
	wrapper: {
		paddingHorizontal: 12,
		position: "absolute",
		width: "100%",
	},
});
