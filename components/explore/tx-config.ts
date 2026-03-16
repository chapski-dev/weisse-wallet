import { Network, type Transaction } from "@/types/wallet";

export const NET_PILL: Partial<Record<Network, { bg: string; color: string }>> =
	{
		[Network.ETHEREUM]: { bg: "#1E3A5F", color: "#3B82F6" },
		[Network.ETHEREUM_SEPOLIA]: { bg: "#1E3A5F", color: "#3B82F6" },
		[Network.SOLANA]: { bg: "#0A1A0A", color: "#10B981" },
		[Network.SOLANA_DEVNET]: { bg: "#0A1A0A", color: "#10B981" },
		[Network.POLYGON]: { bg: "#1A0A2A", color: "#A855F7" },
		[Network.POLYGON_AMOY]: { bg: "#1A0A2A", color: "#A855F7" },
		[Network.BSC]: { bg: "#1A1500", color: "#F59E0B" },
		[Network.BSC_TESTNET]: { bg: "#1A1500", color: "#F59E0B" },
	};

export function getNetPill(n: Network) {
	return NET_PILL[n] ?? { bg: "#1F2937", color: "#9CA3AF" };
}

export function getTxIconCfg(tx: Transaction): {
	icon: string;
	iconColor: string;
	bg: string;
} {
	if (tx.status === "failed")
		return { icon: "close-circle", iconColor: "#EF4444", bg: "#1A0505" };
	if (tx.status === "pending")
		return { icon: "time", iconColor: "#F59E0B", bg: "#1C1405" };
	if (tx.type === "incoming")
		return { icon: "arrow-down", iconColor: "#10B981", bg: "#052E16" };
	return { icon: "arrow-up", iconColor: "#EF4444", bg: "#1A0A0A" };
}

export const STATUS_CFG: Record<
	Transaction["status"],
	{ bg: string; color: string; label: string }
> = {
	confirmed: { bg: "#052E16", color: "#10B981", label: "Подтверждено" },
	pending: { bg: "#1C1405", color: "#F59E0B", label: "В ожидании" },
	failed: { bg: "#1A0505", color: "#EF4444", label: "Ошибка" },
};
