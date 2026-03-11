import { StyleSheet, Switch, View } from "react-native";

import { Text } from "@/components/ui/builders/Text";
import { useWallet } from "@/providers/wallet-provider";
import { useAppTheme } from "@/theme/theme";

export function NetworkModeToggle() {
	const { colors } = useAppTheme();
	const { networkMode, toggleNetworkMode } = useWallet();
	const isTestnet = networkMode === "testnet";

	const activeColor = isTestnet ? "#F59E0B" : "#34C759";
	const activeLabel = isTestnet ? "Testnet" : "Mainnet";
	const nextLabel = isTestnet ? "Mainnet" : "Testnet";

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: "#161B22", borderColor: colors.border },
			]}
		>
			<View
				style={[
					styles.iconBox,
					{ backgroundColor: isTestnet ? "#451A03" : "#052E16" },
				]}
			>
				<Text fontSize={18}>{isTestnet ? "🧪" : "🌐"}</Text>
			</View>

			<View style={styles.textBlock}>
				<View style={styles.titleRow}>
					<Text variant="p3-semibold" color="#fff">
						Режим сети:{" "}
					</Text>
					<Text variant="p3-semibold" color={activeColor}>
						{activeLabel}
					</Text>
				</View>
				<Text variant="p4" color="#6B7280" mt={2}>
					{"Переключиться на "}
					<Text variant="p4-semibold" color="#9CA3AF">
						{nextLabel}
					</Text>
				</Text>
			</View>

			<Switch
				value={isTestnet}
				onValueChange={toggleNetworkMode}
				trackColor={{ false: "#30363D", true: "#F59E0B" }}
				thumbColor="#fff"
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		borderRadius: 16,
		borderWidth: 1,
		paddingHorizontal: 16,
		paddingVertical: 14,
		marginBottom: 20,
	},
	iconBox: {
		width: 36,
		height: 36,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
	},
	textBlock: { flex: 1 },
	titleRow: { flexDirection: "row", alignItems: "center" },
});
