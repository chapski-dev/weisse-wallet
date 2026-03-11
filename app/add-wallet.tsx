import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import { useAppTheme } from "@/theme/theme";

function OptionCard({
	icon,
	iconBg,
	title,
	subtitle,
	onPress,
}: {
	icon: string;
	iconBg: string;
	title: string;
	subtitle: string;
	onPress: () => void;
}) {
	return (
		<TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
			<Box
				w={52}
				h={52}
				borderRadius={26}
				alignItems="center"
				justifyContent="center"
				style={{ backgroundColor: iconBg }}
			>
				<Ionicons name={icon as any} size={24} color="#3B82F6" />
			</Box>
			<Box flex justifyContent="center" gap={4}>
				<Text variant="p2-semibold" color="#fff">
					{title}
				</Text>
				<Text variant="p4" colorName="label">
					{subtitle}
				</Text>
			</Box>
			<Ionicons name="chevron-forward" size={18} color="#374151" />
		</TouchableOpacity>
	);
}

export default function AddWalletScreen() {
	const router = useRouter();
	const { insets } = useAppTheme();

	return (
		<Box flex backgroundColor="#0A0F1E" style={{ paddingTop: insets.top }}>
			{/* Header */}
			<Box
				row
				justifyContent="space-between"
				alignItems="center"
				px={20}
				h={56}
			>
				<TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
					<Ionicons name="chevron-back" size={20} color="#3B82F6" />
					<Text variant="p2-semibold" color="#3B82F6">
						Кошельки
					</Text>
				</TouchableOpacity>
				<Text variant="p1-semibold" color="#fff">
					Новый кошелёк
				</Text>
				<Box w={72} />
			</Box>

			<Text variant="p4" colorName="label" center mt={16} mb={24}>
				Выберите способ добавления
			</Text>

			<Box px={20} gap={12}>
				<OptionCard
					icon="wallet-outline"
					iconBg="#1D2F4A"
					title="Создать новый кошелёк"
					subtitle="Сгенерировать новую seed фразу и создать кошелёк"
					onPress={() => router.push("/create-wallet")}
				/>
				<OptionCard
					icon="download-outline"
					iconBg="#1A2F1A"
					title="Импортировать кошелёк"
					subtitle="Ввести существующую seed фразу для восстановления"
					onPress={() => router.push("/import-wallet")}
				/>
			</Box>
		</Box>
	);
}

const styles = StyleSheet.create({
	backBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	card: {
		flexDirection: "row",
		alignItems: "center",
		height: 96,
		backgroundColor: "#111827",
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#3B82F640",
		paddingHorizontal: 20,
		gap: 16,
	},
});
