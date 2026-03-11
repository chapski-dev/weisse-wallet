import { Ionicons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { Box, SectionListItemWithArrow, Text } from "@/components/ui";
import { modal } from "@/components/ui/layouts/ModalLayout";
import { RemoveWalletModal } from "../modals/remove-wallet-modal";

export const RemoveWalletWidget = () => {
	const onFinallyDeleteAccountPress = useCallback(() => {
		modal().setupModal?.({
			element: <RemoveWalletModal />,
			justifyContent: "center",
			marginHorizontal: 48,
		});
	}, []);

	return (
		<>
			<Text variant="p4-semibold" color="#EF4444" style={styles.sectionLabel}>
				ОПАСНАЯ ЗОНА
			</Text>
			<Box
				backgroundColor="#161B22"
				borderRadius={16}
				borderWidth={1}
				borderColor="#7F1D1D"
				mb={20}
				overflow="hidden"
			>
				<SectionListItemWithArrow
					onPress={onFinallyDeleteAccountPress}
					borderBottom={false}
					icon={
						<Box
							w={36}
							h={36}
							borderRadius={10}
							alignItems="center"
							justifyContent="center"
							backgroundColor="#450A0A"
						>
							<Ionicons name="trash-outline" size={18} color="#EF4444" />
						</Box>
					}
				>
					<Box gap={2}>
						<Text variant="p3-semibold" color="#EF4444">
							Удалить кошелек
						</Text>
						<Text variant="p4" color="#7F1D1D">
							Необратимое действие
						</Text>
					</Box>
				</SectionListItemWithArrow>
			</Box>
		</>
	);
};

const styles = StyleSheet.create({
	sectionLabel: { marginBottom: 8, marginTop: 8, letterSpacing: 0.5 },
});
