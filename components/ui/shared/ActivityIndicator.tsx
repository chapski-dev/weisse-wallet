import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import {
	Animated,
	Easing,
	StyleSheet,
	View,
	type ViewStyle,
} from "react-native";

export type ActivityIndicatorProps = {
	color?: string;
	size?: number;
	minScale?: number;
	maxScale?: number;
	style?: ViewStyle;
};

export const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
	color = "#C2C7CC",
	size = 40,
	minScale = 0.2,
	maxScale = 1.0,
	style,
}) => {
	const count = 5;
	const animationDuration = 1600;

	const renderComponent = useCallback(
		({
			index,
			count,
			progress,
		}: {
			index: number;
			count: number;
			progress: Animated.AnimatedValue;
		}) => {
			const frames = (60 * animationDuration) / 1000;
			const offset = index / (count - 1);
			const easingFn = Easing.bezier(0.5, offset, 0.5, 1.0);

			const inputRange = Array.from(
				{ length: frames },
				(_, i) => i / (frames - 1),
			);
			const outputRange = inputRange.map((t) => `${easingFn(t) * 360}deg`);

			const layerStyle = {
				transform: [
					{
						rotate: progress.interpolate({ inputRange, outputRange }),
					},
				],
			};

			const ballStyle = {
				backgroundColor: color,
				borderRadius: size / 10,
				height: size / 5,
				transform: [
					{
						scale: progress.interpolate({
							inputRange: [0, 1],
							outputRange: [
								maxScale - (maxScale - minScale) * offset,
								minScale + (maxScale - minScale) * offset,
							],
						}),
					},
				],
				width: size / 5,
			};

			return (
				<Animated.View style={[styles.layer, layerStyle]} key={index}>
					<Animated.View style={ballStyle} />
				</Animated.View>
			);
		},
		[color, size, minScale, maxScale],
	);

	return (
		<View style={[styles.container, style]}>
			<Indicator
				style={{ height: size, width: size }}
				renderComponent={renderComponent}
				count={count}
			/>
		</View>
	);
};

type IndicatorProps = {
	count?: number;
	animating?: boolean;
	animationDuration?: number;
	animationEasing?: (value: number) => number;
	interaction?: boolean;
	hideAnimationDuration?: number;
	style?: ViewStyle;
	renderComponent?: (args: {
		index: number;
		count: number;
		progress: Animated.AnimatedValue;
	}) => React.ReactNode;
};

const Indicator: React.FC<IndicatorProps> = ({
	count = 1,
	animating = true,
	animationDuration = 1200,
	hideAnimationDuration = 200,
	animationEasing = Easing.linear,
	interaction = true,
	style,
	renderComponent,
}) => {
	const progress = useRef(new Animated.Value(0)).current;
	const hideAnimation = useRef(new Animated.Value(animating ? 1 : 0)).current;
	const animationState = useRef<0 | 1 | -1>(0);
	const savedValue = useRef(0);

	const startAnimation = useCallback(() => {
		if (animationState.current !== 0) return;

		const animation = Animated.timing(progress, {
			duration: animationDuration,
			easing: animationEasing,
			isInteraction: interaction,
			toValue: 1,
			useNativeDriver: true,
		});

		Animated.loop(animation).start();
		animationState.current = 1;
	}, [animationDuration, animationEasing, interaction, progress]);

	const stopAnimation = useCallback(() => {
		if (animationState.current !== 1) return;

		const listener = progress.addListener(({ value }) => {
			progress.removeListener(listener);
			progress.stopAnimation(() => {
				savedValue.current = value;
				animationState.current = 0;
			});
		});

		animationState.current = -1;
	}, [progress]);

	const resumeAnimation = useCallback(() => {
		if (animationState.current !== 0) return;

		Animated.timing(progress, {
			duration: (1 - savedValue.current) * animationDuration,
			isInteraction: interaction,
			toValue: 1,
			useNativeDriver: true,
		}).start(({ finished }) => {
			if (finished) {
				progress.setValue(0);
				animationState.current = 0;
				startAnimation();
			}
		});

		savedValue.current = 0;
		animationState.current = 1;
	}, [animationDuration, interaction, progress, startAnimation]);

	useEffect(() => {
		if (animating) startAnimation();
		return stopAnimation;
	}, [animating, startAnimation, stopAnimation]);

	useEffect(() => {
		Animated.timing(hideAnimation, {
			duration: hideAnimationDuration,
			toValue: animating ? 1 : 0,
			useNativeDriver: true,
		}).start();

		if (animating && animationState.current !== 1) {
			resumeAnimation();
		} else if (!animating && animationState.current === 1) {
			stopAnimation();
		}
	}, [
		animating,
		hideAnimation,
		hideAnimationDuration,
		resumeAnimation,
		stopAnimation,
	]);

	return (
		<Animated.View style={[style, { opacity: hideAnimation }]}>
			{Array.from({ length: count }, (_, i) =>
				renderComponent ? renderComponent({ count, index: i, progress }) : null,
			)}
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		flex: 1,
		justifyContent: "center",
	},
	layer: {
		...StyleSheet.absoluteFillObject,
		alignItems: "center",
		justifyContent: "flex-start",
	},
});
