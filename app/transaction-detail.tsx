import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams } from "expo-router";
import type React from "react";
import {
	Linking,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
} from "react-native";

import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import { ScreenHeader } from "@/components/ui/layouts/ScreenHeader";
import { NETWORKS } from "@/constants/networks";
import { useAppTheme } from "@/theme/theme";
import type { Network } from "@/types/wallet";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatValue(value: string, decimals = 5): string {
	const n = parseFloat(value);
	if (Number.isNaN(n) || n === 0) return "0";
	if (n < 0.000001) return "< 0.000001";
	return n.toFixed(decimals).replace(/\.?0+$/, "");
}

function shortenAddress(addr: string, head = 8, tail = 6): string {
	if (!addr || addr.length < head + tail + 3) return addr;
	return `${addr.slice(0, head)}...${addr.slice(-tail)}`;
}

function shortenHash(hash: string): string {
	if (!hash || hash.length < 16) return hash;
	return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function formatDateTime(timestamp: number): string {
	const d = new Date(timestamp);
	return d.toLocaleString("ru-RU", {
		day: "numeric",
		month: "long",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const STATUS_CFG = {
	confirmed: {
		bg: "#052E16",
		color: "#10B981",
		label: "Подтверждено",
		icon: "checkmark-circle" as const,
	},
	pending: {
		bg: "#1C1405",
		color: "#F59E0B",
		label: "В ожидании",
		icon: "time" as const,
	},
	failed: {
		bg: "#1A0505",
		color: "#EF4444",
		label: "Ошибка",
		icon: "close-circle" as const,
	},
};

// ─── Detail Row ───────────────────────────────────────────────────────────────

function DetailRow({
	label,
	children,
	noDivider,
}: {
	label: string;
	children: React.ReactNode;
	noDivider?: boolean;
}) {
	return (
		<>
			<Box
				row
				alignItems="center"
				justifyContent="space-between"
				px={20}
				h={52}
			>
				<Text style={styles.rowLabel}>{label}</Text>
				<Box row alignItems="center" gap={6}>
					{children}
				</Box>
			</Box>
			{!noDivider && (
				<Box h={StyleSheet.hairlineWidth} backgroundColor="#1F2937" mx={20} />
			)}
		</>
	);
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyBtn({ value }: { value: string }) {
	return (
		<TouchableOpacity
			onPress={() => Clipboard.setStringAsync(value)}
			activeOpacity={0.6}
		>
			<Ionicons name="copy-outline" size={14} color="#6B7280" />
		</TouchableOpacity>
	);
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TransactionDetailScreen() {
	const { colors, insets } = useAppTheme();
	const params = useLocalSearchParams<{
		hash: string;
		from: string;
		to: string;
		value: string;
		network: Network;
		timestamp: string;
		status: "pending" | "confirmed" | "failed";
		type: "incoming" | "outgoing";
		fee?: string;
	}>();

	const net = NETWORKS[params.network];
	const isOutgoing = params.type === "outgoing";
	const statusCfg = STATUS_CFG[params.status] ?? STATUS_CFG.confirmed;

	const heroColor =
		params.status === "failed" ? "#6B7280" : isOutgoing ? "#EF4444" : "#10B981";
	const heroBg =
		params.status === "failed" ? "#111827" : isOutgoing ? "#1A0A0A" : "#052E16";
	const heroBorder =
		params.status === "failed"
			? "#37415140"
			: isOutgoing
				? "#EF444440"
				: "#10B98140";
	const heroGlow =
		params.status === "failed"
			? "#37415125"
			: isOutgoing
				? "#EF444425"
				: "#10B98125";
	const heroIcon = isOutgoing ? "arrow-up-outline" : "arrow-down-outline";
	const amountPrefix = isOutgoing ? "-" : "+";

	const explorerTx = net ? `${net.explorerUrl}/tx/${params.hash}` : null;

	return (
		<Box flex backgroundColor={colors.background}>
			<ScreenHeader
				backLabel="История"
				right={
					<TouchableOpacity
						style={styles.shareBtn}
						activeOpacity={0.7}
						onPress={() => explorerTx && Linking.openURL(explorerTx)}
					>
						<Ionicons name="share-outline" size={18} color="#9CA3AF" />
					</TouchableOpacity>
				}
			/>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
			>
				{/* Hero */}
				<Box alignItems="center" pt={24} pb={16}>
					{/* Glow */}
					<Box style={[styles.glow, { backgroundColor: heroGlow }]} />

					{/* Icon circle */}
					<Box
						w={72}
						h={72}
						borderRadius={36}
						alignItems="center"
						justifyContent="center"
						backgroundColor={heroBg}
						style={[
							styles.iconCircle,
							{ borderColor: heroBorder, shadowColor: heroColor },
						]}
					>
						<Ionicons name={heroIcon as any} size={32} color={heroColor} />
					</Box>

					{/* Amount */}
					<Text style={[{ color: heroColor }]} variant="h2" mt={20}>
						{amountPrefix}
						{formatValue(params.value)} {net?.symbol ?? ""}
					</Text>

					{/* Status badge */}
					<Box
						row
						alignItems="center"
						gap={6}
						px={14}
						py={6}
						borderRadius={20}
						backgroundColor={statusCfg.bg}
						mt={12}
					>
						<Ionicons name={statusCfg.icon} size={14} color={statusCfg.color} />
						<Text variant="p4-semibold" color={statusCfg.color}>
							{statusCfg.label}
						</Text>
					</Box>

					{/* Date */}
					<Text variant="p4" color="#6B7280" mt={8}>
						{formatDateTime(parseInt(params.timestamp, 10))}
					</Text>
				</Box>

				{/* Detail Card */}
				<Box
					mx={20}
					borderRadius={20}
					backgroundColor="#111827"
					borderWidth={1}
					borderColor="#1F2937"
					overflow="hidden"
					mt={8}
				>
					{/* Тип */}
					<DetailRow label="Тип">
						<Ionicons name={heroIcon as any} size={14} color={heroColor} />
						<Text variant="p3" color="#fff" fontWeight="500">
							{isOutgoing ? "Отправка" : "Получение"}
						</Text>
					</DetailRow>

					{/* Сеть */}
					<DetailRow label="Сеть">
						<Text variant="p3" color={net ? "#4B8EF5" : "#9CA3AF"}>
							{net?.icon ?? ""}
						</Text>
						<Text variant="p3" color="#fff" fontWeight="500">
							{net?.name ?? params.network}
						</Text>
					</DetailRow>

					{/* Токен */}
					<DetailRow label="Токен">
						<Text variant="p3" color="#fff" fontWeight="500">
							{net?.symbol ?? ""}
						</Text>
					</DetailRow>

					{/* От */}
					<DetailRow label="От">
						<Text style={styles.addrText}>{shortenAddress(params.from)}</Text>
						<CopyBtn value={params.from} />
					</DetailRow>

					{/* Кому */}
					<DetailRow label="Кому">
						<Text style={styles.addrText}>{shortenAddress(params.to)}</Text>
						<CopyBtn value={params.to} />
					</DetailRow>

					{/* Комиссия */}
					<DetailRow label="Комиссия">
						<Text variant="p3" color="#fff" fontWeight="500">
							{params.fee
								? `${formatValue(params.fee, 6)} ${net?.symbol ?? ""}`
								: "—"}
						</Text>
					</DetailRow>

					{/* Хэш */}
					<DetailRow label="Хэш" noDivider>
						<TouchableOpacity
							onPress={() => explorerTx && Linking.openURL(explorerTx)}
							activeOpacity={0.7}
						>
							<Box row alignItems="center" gap={6}>
								<Text style={styles.hashText}>{shortenHash(params.hash)}</Text>
								<Ionicons name="open-outline" size={14} color="#3B82F6" />
							</Box>
						</TouchableOpacity>
					</DetailRow>
				</Box>

				{/* Explorer button */}
				{explorerTx && (
					<TouchableOpacity
						style={styles.explorerBtn}
						activeOpacity={0.8}
						onPress={() => Linking.openURL(explorerTx)}
					>
						<Box
							row
							alignItems="center"
							justifyContent="center"
							gap={8}
							mx={20}
							mt={12}
							h={52}
							borderRadius={14}
							backgroundColor="#0D1829"
							borderWidth={1}
							borderColor="#1E3A5F"
						>
							<Ionicons name="open-outline" size={16} color="#3B82F6" />
							<Text variant="p3" color="#3B82F6" fontWeight="500">
								Открыть в {net?.name ?? "Explorer"}
							</Text>
						</Box>
					</TouchableOpacity>
				)}
			</ScrollView>
		</Box>
	);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	shareBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#1F2937",
		alignItems: "center",
		justifyContent: "center",
	},
	glow: {
		position: "absolute",
		top: 0,
		width: 200,
		height: 200,
		borderRadius: 100,
		alignSelf: "center",
	},
	iconCircle: {
		borderWidth: 1,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.5,
		shadowRadius: 16,
		elevation: 12,
	},
	amount: {
		fontSize: 32,
		fontWeight: "700",
		letterSpacing: -0.5,
	},
	rowLabel: {
		fontSize: 14,
		color: "#6B7280",
	},
	addrText: {
		fontSize: 13,
		color: "#9CA3AF",
	},
	hashText: {
		fontSize: 13,
		color: "#3B82F6",
	},
	explorerBtn: {
		// wraps the Box above
	},
});
