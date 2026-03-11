import React, { useCallback } from "react";
import Animated, { useAnimatedKeyboard } from "react-native-reanimated";

import { useMemoizedAnimatedStyle } from "@/hooks/useMemoizedAnimatedStyle";
import { isIOS } from "@/misc/platform";
import { useAppTheme } from "@/theme/theme";

export const FakeView = ({
	calcWithInsets,
	additionalOffset,
}: {
	calcWithInsets?: boolean;
	additionalOffset?: number;
}) => {
	const { height } = useAnimatedKeyboard();
	const { insets } = useAppTheme();

	const fakeView = useMemoizedAnimatedStyle(
		useCallback(() => {
			"worklet";
			return {
				height: calcWithInsets
					? Math.abs(height.value ? height.value + insets.bottom : 0)
					: Math.abs(height.value) + (additionalOffset || 0),
			};
		}, [calcWithInsets, height, additionalOffset]),
	);

	return isIOS ? <Animated.View style={fakeView} /> : null;
};
