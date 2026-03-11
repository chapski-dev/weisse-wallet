import { type ComponentProps, forwardRef, useMemo } from "react";
import { Dimensions, StyleSheet, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

import { View } from "@/theme/themed";

const dimensions = Dimensions.get("screen");

type Spacing = number;

type BoxSpacers = Pick<
	ViewStyle,
	| "justifyContent"
	| "alignItems"
	| "top"
	| "left"
	| "right"
	| "bottom"
	| "alignSelf"
	| "borderWidth"
	| "borderBottomWidth"
	| "borderColor"
	| "borderRadius"
	| "zIndex"
	| "overflow"
	| "minWidth"
	| "minHeight"
	| "maxWidth"
	| "maxHeight"
	| "flexWrap"
	| "flexGrow"
	| "flexShrink"
	| "flexBasis"
	| "gap"
	| "backgroundColor"
> & {
	h?: number | "auto" | "full" | "screen";
	w?: number | "auto" | "full" | "screen";
	m?: Spacing;
	mx?: Spacing;
	my?: Spacing;
	mt?: Spacing;
	mr?: Spacing;
	mb?: Spacing;
	ml?: Spacing;
	p?: Spacing;
	px?: Spacing;
	py?: Spacing;
	pt?: Spacing;
	pr?: Spacing;
	pb?: Spacing;
	pl?: Spacing;
	xGap?: Spacing;
	yGap?: Spacing;
	row?: boolean;
	flex?: true | number;
};

const getStyles = (spacers: BoxSpacers) => {
	const styles = StyleSheet.create({
		root: {
			columnGap: spacers.xGap,
			flexDirection: spacers.row ? "row" : undefined,
			height:
				spacers.h === "screen"
					? dimensions.height
					: spacers.h === "full"
						? "100%"
						: spacers.h,
			margin: spacers.m,
			marginBottom: spacers.mb,
			marginHorizontal: spacers.mx,
			marginLeft: spacers.ml,
			marginRight: spacers.mr,
			marginTop: spacers.mt,
			marginVertical: spacers.my,
			padding: spacers.p,
			paddingBottom: spacers.pb,
			paddingHorizontal: spacers.px,
			paddingLeft: spacers.pl,
			paddingRight: spacers.pr,
			paddingTop: spacers.pt,
			paddingVertical: spacers.py,
			rowGap: spacers.yGap,
			width:
				spacers.w === "screen"
					? dimensions.width
					: spacers.w === "full"
						? "100%"
						: spacers.w,
			...spacers,
			flex: spacers.flex ? 1 : spacers.flex,
		},
	});

	return styles;
};

function divideSpacers<T extends BoxSpacers>(
	spacers: T,
): { spacers: BoxSpacers; rest: Omit<T, keyof BoxSpacers> } {
	const {
		h,
		w,
		m,
		mx,
		my,
		mt,
		mr,
		mb,
		ml,
		p,
		px,
		py,
		pt,
		pr,
		pb,
		pl,
		xGap,
		yGap,
		row,
		flex,
		justifyContent,
		alignItems,
		top,
		left,
		right,
		bottom,
		alignSelf,
		borderWidth,
		borderBottomWidth,
		borderColor,
		borderRadius,
		zIndex,
		overflow,
		minWidth,
		minHeight,
		maxWidth,
		maxHeight,
		flexWrap,
		flexGrow,
		flexShrink,
		flexBasis,
		backgroundColor,
		gap,

		...rest
	} = spacers;
	return {
		rest,
		spacers: {
			alignItems,
			alignSelf,
			backgroundColor,
			borderBottomWidth,
			borderColor,
			borderRadius,
			borderWidth,
			bottom,
			flex,
			flexBasis,
			flexGrow,
			flexShrink,
			flexWrap,
			gap,
			h,
			justifyContent,
			left,
			m,
			maxHeight,
			maxWidth,
			mb,
			minHeight,
			minWidth,
			ml,
			mr,
			mt,
			mx,
			my,
			overflow,
			p,
			pb,
			pl,
			pr,
			pt,
			px,
			py,
			right,
			row,
			top,
			w,
			xGap,
			yGap,
			zIndex,
		},
	};
}

export const useBox = (spacers: Readonly<BoxSpacers>) => {
	const styles = useMemo(
		() => getStyles(spacers),

		[spacers],
		// __DEV__ ? undefined : [appThemeKey],
	);
	return styles.root;
};

export interface BoxProps
	extends Readonly<BoxSpacers>,
		ComponentProps<typeof View> {
	activeOpacity?: number;
	underlayColor?: string;
	height?: number | string;
	disabled?: boolean;
	display?: ViewStyle["display"];
}

export type Box = View;
export const Box = forwardRef<View, BoxProps>(
	({ style, children, ...props }, ref) => {
		const { spacers, rest } = divideSpacers(props);

		const boxStyles = useBox(spacers);

		return (
			<View ref={ref} style={[boxStyles, style]} {...rest}>
				{children}
			</View>
		);
	},
);

export const AnimatedBox = Animated.createAnimatedComponent(Box);
