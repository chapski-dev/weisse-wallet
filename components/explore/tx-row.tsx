import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet } from "react-native";

import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import { NETWORKS } from "@/constants/networks";
import type { Transaction } from "@/types/wallet";

import { getNetPill, getTxIconCfg, STATUS_CFG } from "./tx-config";
import { formatValue, formatTime, shortenAddress } from "./tx-utils";

interface TxRowProps {
	tx: Transaction;
	isLast: boolean;
}

export function TxRow({ tx, isLast }: TxRowProps) {
	const net = NETWORKS[tx.network];
	const netPill = getNetPill(tx.network);
	const iconCfg = getTxIconCfg(tx);
	const statusCfg = STATUS_CFG[tx.status];

	const amountColor =
		tx.status === "failed"
			? "#6B7280"
			: tx.type === "incoming"
				? "#10B981"
				: "#EF4444";
	const titleColor = tx.status === "failed" ? "#9CA3AF" : "#F9FAFB";
	const prefix = tx.type === "incoming" ? "+" : "-";
	const displaySymbol = tx.token ?? net?.symbol ?? "";
	const title =
		tx.type === "incoming"
			? `Получение ${displaySymbol}`
			: `Отправка ${displaySymbol}`;
	const addr = tx.type === "incoming" ? tx.from : tx.to;

	const handlePress = () => {
		router.push({
			pathname: "/transaction-detail",
			params: {
				hash: tx.hash,
				from: tx.from,
				to: tx.to,
				value: tx.value,
				network: tx.network,
				timestamp: String(tx.timestamp),
				status: tx.status,
				type: tx.type,
				fee: tx.fee ?? "",
			},
		});
	};

	return (
		<Box onPress={handlePress}>
			<Box row alignItems="center" gap={12} px={20} py={12}>
				<Box
					w={44}
					h={44}
					borderRadius={12}
					alignItems="center"
					justifyContent="center"
					backgroundColor={iconCfg.bg}
				>
					<Ionicons
						name={iconCfg.icon as keyof typeof Ionicons.glyphMap}
						size={20}
						color={iconCfg.iconColor}
					/>
				</Box>

				<Box flex gap={5}>
					<Box row justifyContent="space-between" alignItems="center">
						<Text variant="p4-semibold" color={titleColor}>
							{title}
						</Text>
						<Text variant="p4-semibold" color={amountColor}>
							{prefix}
							{formatValue(tx.value)} {displaySymbol}
						</Text>
					</Box>

					<Box row justifyContent="space-between" alignItems="center">
						<Box row alignItems="center" gap={6}>
							<Text variant="caption" color="#6B7280">
								{shortenAddress(addr)}
							</Text>
							<Box px={6} py={2} borderRadius={4} backgroundColor={netPill.bg}>
								<Text variant="label" fontWeight="600" color={netPill.color}>
									{net?.icon} {net?.symbol}
								</Text>
							</Box>
						</Box>

						<Box row alignItems="center" gap={6}>
							<Box
								row
								alignItems="center"
								gap={4}
								px={6}
								py={2}
								borderRadius={4}
								backgroundColor={statusCfg.bg}
							>
								<Box
									w={6}
									h={6}
									borderRadius={3}
									backgroundColor={statusCfg.color}
								/>
								<Text variant="label" fontWeight="600" color={statusCfg.color}>
									{statusCfg.label}
								</Text>
							</Box>
							<Text variant="label" color="#4B5563">
								{formatTime(tx.timestamp)}
							</Text>
						</Box>
					</Box>
				</Box>
			</Box>

			{!isLast && (
				<Box
					h={StyleSheet.hairlineWidth}
					ml={76}
					mr={20}
					backgroundColor="#1F2937"
				/>
			)}
		</Box>
	);
}
