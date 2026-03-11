import React, { type FC, type ReactElement } from "react";
import {
	Modal,
	StyleSheet,
	TouchableWithoutFeedback,
	View,
	type ViewStyle,
} from "react-native";

import { useAppTheme } from "@/theme/theme";

import { Box } from "../builders/Box";

interface IModalWrapperProps {
	visible: boolean;
	children: ReactElement | null;
	justifyContent: ViewStyle["justifyContent"];
	closeModal: () => void;
	marginHorizontal?: number;
	marginVertical?: number;
}

const styles = StyleSheet.create({
	modalOverlay: {
		backgroundColor: "rgba(0, 0, 0, 0.6)",
		bottom: 0,
		left: 0,
		position: "absolute",
		right: 0,
		top: 0,
	},
});

export const ModalWrapper: FC<IModalWrapperProps> = ({
	closeModal,
	visible,
	children,
	justifyContent,
	marginHorizontal,
	marginVertical,
}) => {
	const { colors } = useAppTheme();

	return (
		<Modal
			animationType="fade"
			supportedOrientations={["portrait"]}
			transparent={true}
			visible={visible}
			onRequestClose={closeModal}
		>
			<Box flex justifyContent={justifyContent}>
				<TouchableWithoutFeedback onPress={closeModal}>
					<View style={styles.modalOverlay} />
				</TouchableWithoutFeedback>
				<Box
					mt={marginVertical || 0}
					mb={marginVertical || 0}
					mr={marginHorizontal || 0}
					ml={marginHorizontal || 0}
					borderRadius={25}
					backgroundColor={colors.grey_800}
				>
					{children}
				</Box>
			</Box>
		</Modal>
	);
};
