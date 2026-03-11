import { useRouter } from "expo-router";
import React from "react";
import { Alert } from "react-native";
import { Box, Button, Text } from "@/components/ui";
import { modal } from "@/components/ui/layouts/ModalLayout";
import { useWallet } from "@/providers/wallet-provider";
import { useAppTheme } from "@/theme/theme";

export const RemoveWalletModal = () => {
	const router = useRouter();
	const { colors } = useAppTheme();
	const { deleteWallet } = useWallet();

	const performDelete = async () => {
		await deleteWallet();
		router.dismissAll();
	};

	const handleRemoveAccount = async () => {
		Alert.alert(
			"Последнее предупреждение",
			"Вы точно хотите удалить кошелек? Без seed фразы восстановление невозможно!",
			[
				{ text: "Нет, оставить", style: "cancel" },
				{ text: "Да, удалить", style: "destructive", onPress: performDelete },
			],
		);
	};
	const closeModal = () => modal()?.closeModal?.();

	return (
		<Box borderRadius={16} backgroundColor={colors.background} p={16} gap={16}>
			<Box gap={8}>
				<Text variant="p1-semibold" children={"⚠️ Удалить кошелек?"} mb={2} />
				<Text
					children={
						"Это действие необратимо! Убедитесь, что у вас есть резервная копия seed фразы."
					}
					variant="p4-semibold"
				/>
			</Box>
			<Button
				onPress={handleRemoveAccount}
				children={"Удалить"}
				textColor="error_500"
				backgroundColor="error_500_15"
			/>
			<Button onPress={closeModal} children={"Отмена"} />
		</Box>
	);
};
