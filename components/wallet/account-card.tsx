import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";

import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import { Button } from "@/components/ui/shared/Button";
import { TokenIcon } from "@/components/wallet/token-icon";
import { NETWORKS } from "@/constants/networks";
import { getTokenPrice } from "@/services/price-service";
import type { WalletAccount } from "@/types/wallet";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtUsd(value: number): string {
	return value.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

// ─── Account Card ─────────────────────────────────────────────────────────────

interface AccountCardProps {
	accounts: WalletAccount[];
	selectedAccount: WalletAccount;
	onSend?: () => void;
	onReceive?: () => void;
}

export function AccountCard({ accounts, onSend, onReceive }: AccountCardProps) {
	const [totalUsd, setTotalUsd] = useState<number | null>(null);

	useEffect(() => {
		let cancelled = false;
		async function compute() {
			const values = await Promise.all(
				accounts.map(async (a) => {
					const info = await getTokenPrice(a.network);
					if (!info) return 0;
					return parseFloat(a.balance) * info.price;
				}),
			);
			if (!cancelled) setTotalUsd(values.reduce((s, v) => s + v, 0));
		}
		compute();
		return () => {
			cancelled = true;
		};
	}, [accounts]);

	return (
		<>
			<Box
				mx={20}
				mb={16}
				p={24}
				gap={8}
				borderRadius={24}
				backgroundColor="#1E3A5F"
				style={{
					shadowColor: "#000",
					shadowOpacity: 0.3,
					shadowRadius: 32,
					elevation: 10,
				}}
			>
				<Text variant="p2" color="#9CA3AF">
					Общий баланс
				</Text>
				{/* Total USD */}
				<Text variant="h1">
					{totalUsd !== null ? `$${fmtUsd(totalUsd)}` : "—"}
				</Text>
			</Box>

			{/* Actions */}
			<Box row gap={12} mt={8} mx={20}>
				<Button
					onPress={onSend}
					icon={<Ionicons name="arrow-up" size={18} color="#fff" />}
					wrapperStyle={{ flex: 1 }}
					buttonStyle={{ height: 52, borderRadius: 14 }}
				>
					Отправить
				</Button>
				<Button
					type="outline"
					backgroundColor="grey_200"
					textColor="label"
					onPress={onReceive}
					icon={<Ionicons name="arrow-down" size={18} color="#9CA3AF" />}
					wrapperStyle={{ flex: 1 }}
					buttonStyle={{ height: 52, borderRadius: 14 }}
				>
					Получить
				</Button>
			</Box>
		</>
	);
}

// ─── Account List Item ────────────────────────────────────────────────────────

interface AccountListItemProps {
	account: WalletAccount;
	onPress: () => void;
}

export function AccountListItem({ account, onPress }: AccountListItemProps) {
	const network = NETWORKS[account.network];
	const [usdValue, setUsdValue] = useState<number | null>(null);

	useEffect(() => {
		let cancelled = false;
		getTokenPrice(account.network).then((info) => {
			if (!cancelled && info)
				setUsdValue(parseFloat(account.balance) * info.price);
		});
		return () => {
			cancelled = true;
		};
	}, [account.network, account.balance]);

	return (
		<Box
			row
			alignItems="center"
			justifyContent="space-between"
			px={20}
			py={10}
			minHeight={60}
			onPress={onPress}
		>
			<Box row alignItems="center" gap={12}>
				<TokenIcon symbol={network.symbol} networkId={network.id} size={38} />
				<Box gap={2}>
					<Text variant="p3-semibold" color="#fff">
						{network.name}
					</Text>
					<Text variant="p4" color="#6B7280">
						{network.symbol} · {network.isTestnet ? "Testnet" : "Mainnet"}
					</Text>
				</Box>
			</Box>
			<Box alignItems="flex-end" gap={2}>
				<Text variant="p3-semibold" color="#fff">
					{parseFloat(account.balance).toFixed(4)} {network.symbol}
				</Text>
				<Text variant="caption" color="#6B7280">
					{usdValue !== null ? `$${fmtUsd(usdValue)}` : "—"}
				</Text>
			</Box>
		</Box>
	);
}
