import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Platform, StyleSheet } from "react-native";

import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import { SectionListItemWithArrow } from "@/components/ui/shared/SectionListItemWithArrow";
import { SeedPhraseDisplay } from "@/components/wallet/seed-phrase-display";
import { useWallet } from "@/providers/wallet-provider";
import { useAppTheme } from "@/theme/theme";

export const SeedPhraseWidget = () => {
	const { colors } = useAppTheme();
	const { revealMnemonic } = useWallet();
	const [showSeedPhrase, setShowSeedPhrase] = useState(false);
	const [mnemonic, setMnemonic] = useState<string | null>(null);

	const handleRevealSeedPhrase = async () => {
		const showSeed = async () => {
			const phrase = await revealMnemonic();
			if (phrase) {
				setMnemonic(phrase);
				setShowSeedPhrase(true);
			}
		};
		if (Platform.OS === "web") {
			if (
				window.confirm(
					"Вы собираетесь показать seed фразу. Убедитесь, что никто не видит ваш экран.",
				)
			)
				await showSeed();
		} else {
			Alert.alert(
				"Внимание!",
				"Вы собираетесь показать seed фразу. Убедитесь, что никто не видит ваш экран.",
				[
					{ text: "Отмена", style: "cancel" },
					{ text: "Показать", onPress: showSeed },
				],
			);
		}
	};

	return (
		<>
			<Text variant="p4-semibold" color="#6B7280" style={styles.sectionLabel}>
				БЕЗОПАСНОСТЬ
			</Text>
			<Box
				backgroundColor="#161B22"
				borderRadius={16}
				borderWidth={1}
				borderColor={colors.border}
				mb={20}
				overflow="hidden"
			>
				{!showSeedPhrase ? (
					<SectionListItemWithArrow
						onPress={handleRevealSeedPhrase}
						borderBottom={false}
						icon={
							<Box
								w={36}
								h={36}
								borderRadius={10}
								alignItems="center"
								justifyContent="center"
								backgroundColor={colors.primary_700_15}
							>
								<Ionicons name="key-outline" size={18} color={colors.primary} />
							</Box>
						}
					>
						<Box gap={2}>
							<Text variant="p3-semibold" color="#fff">
								Показать seed фразу
							</Text>
							<Text variant="p4" color="#6B7280">
								Получить доступ к резервной фразе
							</Text>
						</Box>
					</SectionListItemWithArrow>
				) : (
					<Box>
						<SeedPhraseDisplay mnemonic={mnemonic ?? ""} />
						<Box
							row
							alignItems="center"
							justifyContent="center"
							gap={6}
							py={12}
							borderColor={colors.border}
							onPress={() => {
								setShowSeedPhrase(false);
								setMnemonic(null);
							}}
						>
							<Ionicons name="eye-off-outline" size={16} color="#6B7280" />
							<Text variant="p4-semibold" color="#6B7280">
								Скрыть seed фразу
							</Text>
						</Box>
					</Box>
				)}
			</Box>
		</>
	);
};

const styles = StyleSheet.create({
	sectionLabel: { marginBottom: 8, marginTop: 8, letterSpacing: 0.5 },
});
