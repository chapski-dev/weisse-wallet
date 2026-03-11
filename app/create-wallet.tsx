import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
	Alert,
	Platform,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";

import { Text } from "@/components/ui/builders/Text";
import { SeedPhraseDisplay } from "@/components/wallet/seed-phrase-display";
import { useWallet } from "@/providers/wallet-provider";
import { useAppTheme } from "@/theme/theme";

type Step = "backup" | "creating";

export default function CreateWalletScreen() {
	const router = useRouter();
	const { colors, insets } = useAppTheme();
	const { generateNewMnemonic, createWallet } = useWallet();
	const [step, setStep] = useState<Step>("backup");
	const [generatedMnemonic, setGeneratedMnemonic] = useState("");

	useEffect(() => {
		setGeneratedMnemonic(generateNewMnemonic());
	}, []);

	const handleConfirmBackup = () => {
		const message =
			"Вы уверены, что сохранили seed фразу? Без неё восстановление невозможно!";
		if (Platform.OS === "web") {
			if (window.confirm(message)) handleCreateWallet();
		} else {
			Alert.alert("Подтверждение", message, [
				{ text: "Отмена", style: "cancel" },
				{ text: "Да, сохранил", onPress: handleCreateWallet },
			]);
		}
	};

	const handleCreateWallet = async () => {
		setStep("creating");
		try {
			await createWallet(generatedMnemonic, "Мой кошелек");

			if (Platform.OS === "web") {
				window.alert("Кошелек успешно создан!");
				router.dismissAll();
			} else {
				// Перенаправляем на главный экран после успешного создания
				router.dismissAll();
			}
		} catch (error) {
			Alert.alert("Ошибка", "Не удалось создать кошелек");
			setStep("backup");
		}
	};

	if (step === "creating") {
		return (
			<View style={[styles.centered, { backgroundColor: colors.background }]}>
				<View
					style={[
						styles.loaderCircle,
						{ backgroundColor: colors.primary_700_15 },
					]}
				>
					<Ionicons name="wallet" size={40} color={colors.primary} />
				</View>
				<Text variant="h4" center style={{ marginTop: 24 }}>
					Создаём кошелек...
				</Text>
				<Text variant="p3" colorName="label" center style={{ marginTop: 8 }}>
					Генерируем адреса для всех сетей
				</Text>
			</View>
		);
	}

	return (
		<ScrollView
			style={[styles.screen, { backgroundColor: colors.background }]}
			contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
		>
			<View style={[styles.header, { paddingTop: insets.top + 8 }]}>
				<TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
					<Ionicons name="chevron-back" size={20} color={colors.primary} />
					<Text variant="p2" color={colors.primary}>
						Назад
					</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.content}>
				<View style={styles.stepsRow}>
					<View style={[styles.stepBar, { backgroundColor: colors.primary }]} />
					<View
						style={[styles.stepBar, { backgroundColor: colors.grey_200 }]}
					/>
				</View>
				<Text variant="p4" colorName="label" style={styles.stepLabel}>
					Шаг 1 из 2
				</Text>

				<Text variant="h3" style={styles.title}>
					Сохраните seed фразу
				</Text>
				<Text variant="p3" colorName="label" style={styles.description}>
					Запишите эти 12 слов в правильном порядке и храните в безопасном
					месте.
				</Text>

				<View
					style={[
						styles.seedCard,
						{ backgroundColor: colors.grey_50, borderColor: colors.border },
					]}
				>
					<SeedPhraseDisplay mnemonic={generatedMnemonic} />
				</View>

				<View
					style={[
						styles.warning,
						{ backgroundColor: "#1C1405", borderColor: "#78350F" },
					]}
				>
					<Ionicons
						name="warning"
						size={20}
						color="#F59E0B"
						style={styles.warningIcon}
					/>
					<View style={styles.warningBody}>
						<Text
							variant="p3-semibold"
							color="#F59E0B"
							style={{ marginBottom: 6 }}
						>
							Важно!
						</Text>
						<Text variant="p4" color="#D97706" style={{ lineHeight: 20 }}>
							{
								"• Никогда не делитесь seed фразой\n• Не храните её в электронном виде\n• Запишите на бумаге и храните в сейфе\n• Потеря фразы = потеря доступа к средствам"
							}
						</Text>
					</View>
				</View>

				<TouchableOpacity
					style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
					onPress={handleConfirmBackup}
				>
					<Text variant="p1-semibold" color="#fff">
						Я сохранил фразу
					</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1 },
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 32,
	},
	loaderCircle: {
		width: 88,
		height: 88,
		borderRadius: 44,
		alignItems: "center",
		justifyContent: "center",
	},
	header: {
		paddingHorizontal: 20,
		paddingBottom: 8,
	},
	backBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	content: {
		paddingHorizontal: 20,
	},
	stepsRow: {
		flexDirection: "row",
		gap: 6,
		marginBottom: 8,
	},
	stepBar: {
		flex: 1,
		height: 4,
		borderRadius: 2,
	},
	stepLabel: {
		marginBottom: 16,
	},
	title: {
		marginBottom: 8,
	},
	description: {
		lineHeight: 22,
		marginBottom: 24,
	},
	seedCard: {
		borderRadius: 16,
		borderWidth: 1,
		marginBottom: 16,
		overflow: "hidden",
	},
	warning: {
		flexDirection: "row",
		borderRadius: 12,
		borderWidth: 1,
		padding: 16,
		marginBottom: 24,
		gap: 12,
	},
	warningIcon: { marginTop: 2 },
	warningBody: { flex: 1 },
	btnPrimary: {
		height: 56,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#3B82F6",
		shadowOpacity: 0.4,
		shadowRadius: 20,
		elevation: 8,
	},
});
