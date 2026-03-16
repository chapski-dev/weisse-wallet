import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import {
	Alert,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { walletService } from "@/services/wallet-service";

interface SeedPhraseInputProps {
	onValidPhrase: (mnemonic: string) => void;
}

export function SeedPhraseInput({ onValidPhrase }: SeedPhraseInputProps) {
	const [words, setWords] = useState<string[]>(Array(12).fill(""));
	const [wordCount, setWordCount] = useState<12 | 24>(12);

	const handleWordChange = (index: number, value: string) => {
		const newWords = [...words];
		newWords[index] = value.toLowerCase().trim();
		setWords(newWords);
	};

	const handlePaste = async () => {
		const text = await Clipboard.getStringAsync();
		const pastedWords = text.trim().split(/\s+/);

		if (pastedWords.length === 12 || pastedWords.length === 24) {
			setWordCount(pastedWords.length as 12 | 24);
			const newWords = Array(pastedWords.length).fill("");
			pastedWords.forEach((word, i) => {
				newWords[i] = word.toLowerCase();
			});
			setWords(newWords);
		} else {
			Alert.alert("Ошибка", "Seed фраза должна содержать 12 или 24 слова");
		}
	};

	const handleValidate = () => {
		const mnemonic = words.filter((w) => w).join(" ");

		if (walletService.validateMnemonic(mnemonic)) {
			onValidPhrase(mnemonic);
		} else {
			Alert.alert(
				"Ошибка",
				"Неверная seed фраза. Проверьте правильность слов.",
			);
		}
	};

	const toggleWordCount = () => {
		const newCount = wordCount === 12 ? 24 : 12;
		setWordCount(newCount);
		setWords(Array(newCount).fill(""));
	};

	const filledWords = words.filter((w) => w.length > 0).length;
	const isComplete = filledWords === wordCount;

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity style={styles.toggleButton} onPress={toggleWordCount}>
					<Text style={styles.toggleText}>{wordCount} слов</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.pasteButton} onPress={handlePaste}>
					<Text style={styles.pasteText}>📋 Вставить</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.wordsContainer}>
				{words.map((word, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: word inputs can be duplicate
					<View key={index} style={styles.wordInputContainer}>
						<Text style={styles.wordNumber}>{index + 1}</Text>
						<TextInput
							style={styles.wordInput}
							value={word}
							onChangeText={(text) => handleWordChange(index, text)}
							placeholder="слово"
							autoCapitalize="none"
							autoCorrect={false}
						/>
					</View>
				))}
			</View>

			<Text style={styles.progress}>
				Введено: {filledWords} / {wordCount}
			</Text>

			<TouchableOpacity
				style={[
					styles.validateButton,
					!isComplete && styles.validateButtonDisabled,
				]}
				onPress={handleValidate}
				disabled={!isComplete}
			>
				<Text style={styles.validateButtonText}>Проверить и продолжить</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	toggleButton: {
		backgroundColor: "#E3E3E3",
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 8,
	},
	toggleText: {
		fontWeight: "600",
	},
	pasteButton: {
		backgroundColor: "#007AFF",
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 8,
	},
	pasteText: {
		color: "white",
		fontWeight: "600",
	},
	wordsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
	},
	wordInputContainer: {
		width: "30%",
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 10,
		backgroundColor: "#F5F5F5",
		borderRadius: 8,
		padding: 8,
	},
	wordNumber: {
		fontSize: 12,
		color: "#888",
		marginRight: 4,
		minWidth: 16,
	},
	wordInput: {
		flex: 1,
		fontSize: 14,
		padding: 4,
	},
	progress: {
		textAlign: "center",
		marginVertical: 16,
		color: "#666",
	},
	validateButton: {
		backgroundColor: "#34C759",
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	validateButtonDisabled: {
		backgroundColor: "#CCC",
	},
	validateButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
	},
});
