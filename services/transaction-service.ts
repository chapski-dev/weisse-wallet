import { formatEther } from "viem";

import { Network, type Transaction } from "@/types/wallet";

const HORIZON_URLS: Partial<Record<Network, string>> = {
	[Network.STELLAR]: "https://horizon.stellar.org",
	[Network.STELLAR_TESTNET]: "https://horizon-testnet.stellar.org",
};

const BLOCKSCOUT_URLS: Partial<Record<Network, string>> = {
	// Mainnets
	[Network.ETHEREUM]: "https://eth.blockscout.com",
	[Network.POLYGON]: "https://polygon.blockscout.com",
	[Network.BSC]: "https://bsc.blockscout.com",
	[Network.ARBITRUM]: "https://arbitrum.blockscout.com",
	[Network.OPTIMISM]: "https://optimism.blockscout.com",
	[Network.BASE]: "https://base.blockscout.com",
	// Testnets
	[Network.ETHEREUM_SEPOLIA]: "https://eth-sepolia.blockscout.com",
	[Network.POLYGON_AMOY]: "https://polygon-amoy.blockscout.com",
	[Network.BSC_TESTNET]: "https://bsc-testnet.blockscout.com",
	[Network.ARBITRUM_SEPOLIA]: "https://arbitrum-sepolia.blockscout.com",
	[Network.OPTIMISM_SEPOLIA]: "https://optimism-sepolia.blockscout.com",
	[Network.BASE_SEPOLIA]: "https://base-sepolia.blockscout.com",
};

export function supportsTransactionHistory(network: Network): boolean {
	return network in BLOCKSCOUT_URLS || network in HORIZON_URLS;
}

interface BlockscoutItem {
	hash: string;
	from?: { hash: string };
	to?: { hash: string };
	value?: string;
	fee?: { value: string };
	status?: string;
	timestamp?: string;
}

interface HorizonPaymentRecord {
	type: string;
	transaction_hash: string;
	created_at: string;
	from?: string;
	to?: string;
	funder?: string;
	account?: string;
	amount?: string;
	starting_balance?: string;
	asset_type?: string;
	transaction_successful: boolean;
}

async function getStellarHistory(
	network: Network,
	address: string,
	limit: number,
): Promise<Transaction[]> {
	const baseUrl = HORIZON_URLS[network] ?? "";
	if (!baseUrl) return [];
	const url = `${baseUrl}/accounts/${address}/payments?order=desc&limit=${limit}`;

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15000);

	let res: Response;
	try {
		res = await fetch(url, {
			headers: { Accept: "application/json" },
			signal: controller.signal,
		});
	} finally {
		clearTimeout(timeout);
	}

	if (res.status === 404) return [];
	if (!res.ok) throw new Error(`Horizon ${res.status}`);

	const json = await res.json();
	const records: HorizonPaymentRecord[] = json._embedded?.records ?? [];
	const lowerAddress = address.toLowerCase();

	return records
		.filter((r) => r.asset_type === "native" || r.type === "create_account")
		.map((r): Transaction => {
			const from: string = r.from ?? r.funder ?? "";
			const to: string = r.to ?? r.account ?? address;
			const value: string = r.amount ?? r.starting_balance ?? "0";
			return {
				hash: r.transaction_hash,
				from,
				to,
				value,
				network,
				timestamp: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
				status: r.transaction_successful ? "confirmed" : "failed",
				type: from.toLowerCase() === lowerAddress ? "outgoing" : "incoming",
			};
		});
}

export async function getTransactionHistory(
	network: Network,
	address: string,
	limit = 25,
): Promise<Transaction[]> {
	if (network in HORIZON_URLS) {
		return getStellarHistory(network, address, limit);
	}

	const baseUrl = BLOCKSCOUT_URLS[network];
	if (!baseUrl) return [];

	const url = `${baseUrl}/api/v2/addresses/${address}/transactions`;

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15000);

	let res: Response;
	try {
		res = await fetch(url, {
			headers: { Accept: "application/json" },
			signal: controller.signal,
		});
	} finally {
		clearTimeout(timeout);
	}

	if (!res.ok) {
		const body = await res.text().catch(() => "");
		throw new Error(`Blockscout ${res.status}: ${body.slice(0, 120)}`);
	}

	const json = await res.json();
	const items: BlockscoutItem[] = (json.items ?? []).slice(0, limit);
	const lowerAddress = address.toLowerCase();

	return items.map((item): Transaction => {
		const fromHash: string = item.from?.hash ?? "";
		const toHash: string = item.to?.hash ?? "";

		let value = "0";
		try {
			value = formatEther(BigInt(item.value ?? "0"));
		} catch {}

		let fee: string | undefined;
		try {
			if (item.fee?.value) {
				fee = formatEther(BigInt(item.fee.value));
			}
		} catch {}

		const rawStatus: string = item.status ?? "";
		const status: Transaction["status"] =
			rawStatus === "ok"
				? "confirmed"
				: rawStatus === "error"
					? "failed"
					: "pending";

		return {
			hash: item.hash,
			from: fromHash,
			to: toHash,
			value,
			fee,
			network,
			timestamp: item.timestamp
				? new Date(item.timestamp).getTime()
				: Date.now(),
			status,
			type: fromHash.toLowerCase() === lowerAddress ? "outgoing" : "incoming",
		};
	});
}
