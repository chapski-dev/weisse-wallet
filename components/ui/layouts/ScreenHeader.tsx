import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import { useAppTheme } from "@/theme/theme";

interface ScreenHeaderProps {
	/** Лейбл кнопки "назад". Default: 'Назад' */
	backLabel?: string;
	/** Центральный заголовок. Если не передан — заголовка нет (push-стиль) */
	title?: string;
	/** Слот для правого действия (иконка, кнопка и т.д.) */
	right?: React.ReactNode;
	/** Переопределить обработчик кнопки "назад" */
	onBack?: () => void;
}

export function ScreenHeader({
	backLabel = "Назад",
	title,
	right,
	onBack,
}: ScreenHeaderProps) {
	const router = useRouter();
	const { colors, insets } = useAppTheme();

	const handleBack = onBack ?? (() => router.back());

	return (
		<Box
			row
			justifyContent="space-between"
			alignItems="center"
			px={20}
			pb={8}
			style={{ paddingTop: insets.top + 8 }}
		>
			<TouchableOpacity
				onPress={handleBack}
				activeOpacity={0.7}
				style={styles.backBtn}
			>
				<Ionicons name="chevron-back" size={20} color={colors.primary} />
				<Text variant="p2" color={colors.primary}>
					{backLabel}
				</Text>
			</TouchableOpacity>

			{title ? (
				<Text variant="h5" color="#fff">
					{title}
				</Text>
			) : (
				<Box />
			)}

			{right ? (
				<Box minWidth={60} alignItems="flex-end">
					{right}
				</Box>
			) : (
				<Box w={60} />
			)}
		</Box>
	);
}

const styles = StyleSheet.create({
	backBtn: { flexDirection: "row", alignItems: "center", gap: 4, minWidth: 60 },
});
