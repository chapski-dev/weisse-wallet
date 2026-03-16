import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import type { Transaction } from "@/types/wallet";

import { formatValue, sumTransactionsBySymbol } from "./tx-utils";

interface SummaryCardProps {
	txs: Transaction[];
}

export function SummaryCard({ txs }: SummaryCardProps) {
	const received = txs.filter(
		(t) => t.type === "incoming" && t.status !== "failed",
	);
	const sent = txs.filter(
		(t) => t.type === "outgoing" && t.status !== "failed",
	);

	const recvStr =
		Object.entries(sumTransactionsBySymbol(received))
			.map(([s, v]) => `+${formatValue(String(v))} ${s}`)
			.join("\n") || "—";
	const sentStr =
		Object.entries(sumTransactionsBySymbol(sent))
			.map(([s, v]) => `-${formatValue(String(v))} ${s}`)
			.join("\n") || "—";

	return (
		<Box
			row
			mx={20}
			mb={16}
			h={80}
			borderRadius={16}
			borderWidth={1}
			borderColor="#1F2937"
			backgroundColor="#111827"
			px={4}
		>
			<Box flex alignItems="center" justifyContent="center" gap={3}>
				<Text variant="p2-semibold" color="#fff">
					{txs.length}
				</Text>
				<Text variant="caption" color="#6B7280">
					Всего
				</Text>
			</Box>
			<Box w={1} h={40} alignSelf="center" backgroundColor="#1F2937" />
			<Box flex alignItems="center" justifyContent="center" gap={3}>
				<Text variant="p4-semibold" fontWeight="700" center color="#10B981">
					{recvStr}
				</Text>
				<Text variant="caption" color="#6B7280">
					Получено
				</Text>
			</Box>
			<Box w={1} h={40} alignSelf="center" backgroundColor="#1F2937" />
			<Box flex alignItems="center" justifyContent="center" gap={3}>
				<Text variant="p4-semibold" fontWeight="700" center color="#EF4444">
					{sentStr}
				</Text>
				<Text variant="caption" color="#6B7280">
					Отправлено
				</Text>
			</Box>
		</Box>
	);
}
