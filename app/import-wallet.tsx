import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
	Alert,
	Platform,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";

import { Text } from "@/components/ui/builders/Text";
import { SeedPhraseInput } from "@/components/wallet/seed-phrase-input";
import { useWallet } from "@/providers/wallet-provider";
import { useAppTheme } from "@/theme/theme";

export default function ImportWalletScreen() {
	const router = useRouter();
	const { colors, insets } = useAppTheme();
	const { importWallet, wallets } = useWallet();
	const [isImporting, setIsImporting] = useState(false);

	const handleImport = async (mnemonic: string) => {
		setIsImporting(true);
		try {
			await importWallet(
				mnemonic,
				`Кошелек ${wallets.length ? wallets.length + 1 : 1}`,
			);

			if (Platform.OS === "web") {
				window.alert("Кошелек успешно импортирован!");
				router.dismissAll();
			} else {
				// Перенаправляем на главный экран после успешного импорта
				router.dismissAll();
			}
		} catch (_error) {
			Alert.alert("Ошибка", "Не удалось импортировать кошелек");
			setIsImporting(false);
		}
	};

	if (isImporting) {
		return (
			<View style={[styles.centered, { backgroundColor: colors.background }]}>
				<View
					style={[
						styles.loaderCircle,
						{ backgroundColor: colors.primary_700_15 },
					]}
				>
					<Ionicons name="wallet-outline" size={40} color={colors.primary} />
				</View>
				<Text variant="h4" center color="#fff" mt={24}>
					Импортируем...
				</Text>
				<Text variant="p3" colorName="label" center mt={8}>
					Восстанавливаем адреса для всех сетей
				</Text>
			</View>
		);
	}

	return (
		<ScrollView
			style={[styles.screen, { backgroundColor: colors.background }]}
			contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
		>
			{/* Header */}
			<View style={[styles.header, { paddingTop: insets.top + 8 }]}>
				<TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
					<Ionicons name="chevron-back" size={20} color={colors.primary} />
					<Text variant="p2" color={colors.primary}>
						Назад
					</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.content}>
				<Text variant="h3" color="#fff" mb={8}>
					Импорт кошелька
				</Text>
				<Text variant="p3" colorName="label" mb={24} style={{ lineHeight: 22 }}>
					Введите вашу seed фразу (12 или 24 слова), чтобы восстановить доступ к
					кошельку.
				</Text>

				{/* Security info */}
				<View
					style={[
						styles.infoBox,
						{ backgroundColor: colors.primary_700_15, borderColor: "#1E3A5F" },
					]}
				>
					<Ionicons name="lock-closed" size={18} color={colors.primary} />
					<View style={{ flex: 1, gap: 4 }}>
						<Text variant="p3-semibold" color={colors.primary}>
							Безопасность
						</Text>
						<Text variant="p4" color="#60A5FA" style={{ lineHeight: 18 }}>
							Ваша seed фраза хранится только на устройстве в зашифрованном
							виде. Мы никогда не отправляем её на сервера.
						</Text>
					</View>
				</View>

				<SeedPhraseInput onValidPhrase={handleImport} />
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
	header: { paddingHorizontal: 20, paddingBottom: 8 },
	backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
	content: { paddingHorizontal: 20 },
	infoBox: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 12,
		borderRadius: 12,
		borderWidth: 1,
		padding: 16,
		marginBottom: 24,
	},
});
