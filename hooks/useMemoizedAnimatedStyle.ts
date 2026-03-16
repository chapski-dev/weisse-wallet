import { useMemo } from "react";
import type { ViewStyle } from "react-native";
import { useAnimatedStyle } from "react-native-reanimated";

export const useMemoizedAnimatedStyle = (cb: () => ViewStyle) => {
	const style = useAnimatedStyle(cb);

	return useMemo(() => style, [style]);
};
