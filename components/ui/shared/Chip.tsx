import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import { useAppTheme } from "@/theme/theme";

import { Box } from "../builders/Box";
import { Text } from "../builders/Text";

export const Chip = ({
	children,
	style,
}: PropsWithChildren & { style?: StyleProp<ViewStyle> }) => {
	const { colors } = useAppTheme();

	return (
		<Box
			backgroundColor={colors.grey_50}
			px={10}
			borderRadius={5}
			style={style}
		>
			<Text children={children} colorName="grey_700" />
		</Box>
	);
};
