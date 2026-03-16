import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	Alert,
	ScrollView,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { Text } from "@/components/ui/builders/Text";
import { SeedPhraseDisplay } from "@/components/wallet/seed-phrase-display";
import { useWallet } from "@/providers/wallet-provider";
import { useAppTheme } from "@/theme/theme";

type Step = "backup" | "verify" | "creating";

function pickVerifyIndices(words: string[]): number[] {
	const indices: number[] = [];
	while (indices.length < 3) {
		const i = Math.floor(Math.random() * words.length);
		if (!indices.includes(i)) indices.push(i);
	}
	return indices.sort((a, b) => a - b);
}

export default function CreateWalletScreen() {
	const router = useRouter();
	const { colors, insets } = useAppTheme();
	const { generateNewMnemonic, createWallet } = useWallet();
	const [step, setStep] = useState<Step>("backup");
	const [generatedMnemonic, setGeneratedMnemonic] = useState("");
	const [verifyIndices, setVerifyIndices] = useState<number[]>([]);
	const [verifyInputs, setVerifyInputs] = useState(["", "", ""]);
	const [verifyError, setVerifyError] = useState(false);

	useEffect(() => {
		setGeneratedMnemonic(generateNewMnemonic());
	}, [generateNewMnemonic]);

	const handleConfirmBackup = () => {
		const words = generatedMnemonic.trim().split(/\s+/);
		setVerifyIndices(pickVerifyIndices(words));
		setVerifyInputs(["", "", ""]);
		setVerifyError(false);
		setStep("verify");
	};

	const handleVerify = () => {
		const words = generatedMnemonic.trim().split(/\s+/);
		const allCorrect = verifyIndices.every(
			(wordIdx, i) =>
				verifyInputs[i].trim().toLowerCase() === words[wordIdx].toLowerCase(),
		);
		if (!allCorrect) {
			setVerifyError(true);
			return;
		}
		handleCreateWallet();
	};

	const handleCreateWallet = async () => {
		setStep("creating");
		try {
			await createWallet(generatedMnemonic, "Мой кошелек");
			router.dismissAll();
		} catch (_error) {
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

	if (step === "verify") {
		return (
			<ScrollView
				style={[styles.screen, { backgroundColor: colors.background }]}
				contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
			>
				<View style={[styles.header, { paddingTop: insets.top + 8 }]}>
					<TouchableOpacity
						style={styles.backBtn}
						onPress={() => setStep("backup")}
					>
						<Ionicons name="chevron-back" size={20} color={colors.primary} />
						<Text variant="p2" color={colors.primary}>
							Назад
						</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.content}>
					<View style={styles.stepsRow}>
						<View
							style={[styles.stepBar, { backgroundColor: colors.primary }]}
						/>
						<View
							style={[styles.stepBar, { backgroundColor: colors.primary }]}
						/>
					</View>
					<Text variant="p4" colorName="label" style={styles.stepLabel}>
						Шаг 2 из 2
					</Text>

					<Text variant="h3" style={styles.title}>
						Проверка фразы
					</Text>
					<Text variant="p3" colorName="label" style={styles.description}>
						Введите слова с указанными позициями, чтобы подтвердить, что вы
						записали фразу.
					</Text>

					{verifyIndices.map((wordIdx, i) => (
						<View key={wordIdx} style={styles.verifyField}>
							<Text
								variant="p4-semibold"
								color="#9CA3AF"
								style={styles.verifyLabel}
							>
								Слово #{wordIdx + 1}
							</Text>
							<View
								style={[
									styles.verifyInput,
									{
										backgroundColor: colors.grey_50,
										borderColor: verifyError ? "#EF4444" : colors.border,
									},
								]}
							>
								<TextInput
									style={[styles.verifyTextInput, { color: colors.text }]}
									value={verifyInputs[i]}
									onChangeText={(v) => {
										const next = [...verifyInputs];
										next[i] = v;
										setVerifyInputs(next);
										setVerifyError(false);
									}}
									placeholder={`Слово #${wordIdx + 1}`}
									placeholderTextColor={colors.label}
									autoCapitalize="none"
									autoCorrect={false}
								/>
							</View>
						</View>
					))}

					{verifyError && (
						<View
							style={[
								styles.errorBox,
								{ backgroundColor: "#1C0A0A", borderColor: "#7F1D1D" },
							]}
						>
							<Ionicons name="close-circle" size={16} color="#EF4444" />
							<Text variant="p4" color="#EF4444" style={{ flex: 1 }}>
								Неверные слова. Проверьте фразу и попробуйте снова.
							</Text>
						</View>
					)}

					<TouchableOpacity
						style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
						onPress={handleVerify}
					>
						<Text variant="p1-semibold" color="#fff">
							Подтвердить
						</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
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
	verifyField: {
		marginBottom: 16,
	},
	verifyLabel: {
		marginBottom: 8,
	},
	verifyInput: {
		borderRadius: 14,
		borderWidth: 1,
		height: 52,
		paddingHorizontal: 16,
		justifyContent: "center",
	},
	verifyTextInput: {
		fontSize: 16,
		fontFamily: "Inter",
		padding: 0,
	},
	errorBox: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		borderRadius: 12,
		borderWidth: 1,
		padding: 12,
		marginBottom: 16,
	},
});
