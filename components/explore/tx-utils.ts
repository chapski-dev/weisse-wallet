import { NETWORKS } from "@/constants/networks";
import type { Transaction } from "@/types/wallet";

export type TxFilter = "all" | "incoming" | "outgoing";

export interface TxSection {
	title: string;
	data: Transaction[];
}

export const FILTER_TABS: { id: TxFilter; label: string }[] = [
	{ id: "all", label: "Все" },
	{ id: "incoming", label: "Входящие" },
	{ id: "outgoing", label: "Исходящие" },
];

export function formatValue(value: string, decimals = 5): string {
	const n = parseFloat(value);
	if (Number.isNaN(n) || n === 0) return "0";
	if (n < 0.000001) return "< 0.000001";
	return n.toFixed(decimals).replace(/\.?0+$/, "");
}

export function formatTime(timestamp: number): string {
	return new Date(timestamp).toLocaleTimeString("ru-RU", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function shortenAddress(addr: string): string {
	if (!addr || addr.length < 12) return addr;
	return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function getDateLabel(timestamp: number): string {
	const now = new Date();
	const d = new Date(timestamp);
	const today = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
	).getTime();
	const yesterday = today - 86_400_000;
	const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
	if (day === today) return "Сегодня";
	if (day === yesterday) return "Вчера";
	return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export function groupByDate(txs: Transaction[]): TxSection[] {
	const map = new Map<string, Transaction[]>();
	for (const tx of txs) {
		const label = getDateLabel(tx.timestamp);
		if (!map.has(label)) map.set(label, []);
		map.get(label)?.push(tx);
	}
	return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export function sumTransactionsBySymbol(
	txs: Transaction[],
): Record<string, number> {
	return txs.reduce<Record<string, number>>((acc, tx) => {
		const sym = NETWORKS[tx.network]?.symbol ?? "?";
		acc[sym] = (acc[sym] ?? 0) + parseFloat(tx.value || "0");
		return acc;
	}, {});
}
