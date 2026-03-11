/* eslint-disable react-native/no-inline-styles */
import { memo } from "react";
import type { ViewStyle } from "react-native";

import { View } from "@/theme/themed";

type Spacing = number;

interface GapProps {
	x?: Spacing;
	y?: Spacing;
	flex?: true;
	style?: ViewStyle;
}

export const Gap = memo(({ x, y, flex }: GapProps) => {
	return (
		<View
			style={{
				flex: flex ? 1 : undefined,
				width: x,
				height: y,
			}}
		/>
	);
});
