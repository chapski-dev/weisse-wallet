import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";

import { Button } from "@/components/ui";
import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import { useAppTheme } from "@/theme/theme";

export default function OnboardingScreen() {
	const router = useRouter();
	const { colors } = useAppTheme();

	return (
		<Box
			flex
			alignItems="center"
			justifyContent="center"
			px={32}
			backgroundColor={colors.background}
		>
			<Box
				w={200}
				h={200}
				borderRadius={100}
				backgroundColor={colors.primary_700_15}
				style={{ position: "absolute", top: "20%", left: "10%" }}
			/>
			<Box
				w={300}
				h={300}
				borderRadius={150}
				backgroundColor="#8B5CF615"
				style={{ position: "absolute", top: "35%", left: "20%" }}
			/>

			<Box
				w={100}
				h={100}
				borderRadius={50}
				alignItems="center"
				justifyContent="center"
				mb={24}
				backgroundColor={colors.primary}
				style={{
					shadowColor: "#3B82F6",
					shadowOpacity: 0.25,
					shadowRadius: 32,
					elevation: 10,
				}}
			>
				<Text variant="h1">W</Text>
			</Box>

			<Text variant="h1" center style={{ marginBottom: 12 }}>
				Weiss Wallet
			</Text>
			<Text
				variant="p2"
				center
				colorName="label"
				style={{ lineHeight: 24, textAlign: "center", marginBottom: 32 }}
			>
				{"Мультисетевой криптокошелек\nс одной seed фразой для всех сетей"}
			</Text>

			<Box row gap={12} mb={48}>
				{[
					{ icon: "⟠", label: "EVM сети" },
					{ icon: "◎", label: "Solana" },
					{ icon: "₿", label: "Bitcoin" },
				].map((f) => (
					<Box
						key={f.label}
						flex
						alignItems="center"
						py={12}
						px={8}
						borderRadius={12}
						gap={6}
						backgroundColor={colors.grey_200}
					>
						<Text style={styles.featIcon}>{f.icon}</Text>
						<Text variant="p4" colorName="label">
							{f.label}
						</Text>
					</Box>
				))}
			</Box>
			<Box gap={12} w="full">
				<Button
					children="Создать новый кошелек"
					onPress={() => router.push("/create-wallet")}
				/>
				<Button
					children="У меня есть seed фраза"
					onPress={() => router.push("/import-wallet")}
					backgroundColor="card"
					type="outline"
				/>
			</Box>
		</Box>
	);
}

const styles = StyleSheet.create({
	featIcon: { fontSize: 18, color: "#F9FAFB" },
});
