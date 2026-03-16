import {
	type IWalletKit,
	isPaymentLink,
	WalletKit,
	type WalletKitTypes,
} from "@reown/walletkit";
import { Core } from "@walletconnect/core";
import { buildApprovedNamespaces, getSdkError } from "@walletconnect/utils";
import { createMMKV } from "react-native-mmkv";

export { isPaymentLink };

const PROJECT_ID = "2d184fa48f30ff78bee044b509c047ff";

const METADATA = {
	name: "Weiss Wallet",
	description: "Weiss — мультисетевой криптокошелёк",
	url: "https://weisswallet.app",
	icons: [],
};

const SUPPORTED_METHODS = [
	"eth_sendTransaction",
	"eth_signTransaction",
	"eth_sign",
	"personal_sign",
	"eth_signTypedData",
	"eth_signTypedData_v4",
];

const SUPPORTED_EVENTS = ["chainChanged", "accountsChanged"];

// MMKV как storage — без async-storage
const _mmkv = createMMKV({ id: "wc-storage" });
const mmkvStorage = {
	getItem: async <T = unknown>(key: string): Promise<T | undefined> => {
		const val = _mmkv.getString(key);
		if (val === undefined) return undefined;
		try {
			return JSON.parse(val) as T;
		} catch {
			return undefined;
		}
	},
	setItem: async <T = unknown>(key: string, value: T): Promise<void> => {
		_mmkv.set(key, typeof value === "string" ? value : JSON.stringify(value));
	},
	removeItem: async (key: string) => {
		_mmkv.remove(key);
	},
	getKeys: async () => _mmkv.getAllKeys() ?? [],
	getEntries: async <T = unknown>() => {
		const keys = _mmkv.getAllKeys() ?? [];
		return keys.map((key) => {
			const val = _mmkv.getString(key);
			let parsed: T | null = null;
			try {
				parsed = val ? (JSON.parse(val) as T) : null;
			} catch {
				/* ignore */
			}
			return [key, parsed] as [string, T];
		});
	},
};

class WalletConnectService {
	private walletKit: IWalletKit | null = null;
	private initialized = false;

	async init(): Promise<void> {
		if (this.initialized) return;

		const core = new Core({ projectId: PROJECT_ID, storage: mmkvStorage });

		this.walletKit = await WalletKit.init({
			core,
			metadata: METADATA,
		});

		this.initialized = true;
	}

	getClient(): IWalletKit {
		if (!this.walletKit) throw new Error("WalletKit не инициализирован");
		return this.walletKit;
	}

	async pair(uri: string): Promise<void> {
		await this.init();
		await this.walletKit?.pair({ uri });
	}

	async approveSession(
		proposal: WalletKitTypes.SessionProposal,
		address: string,
		chainIds: number[],
	): Promise<void> {
		const accounts = chainIds.map((id) => `eip155:${id}:${address}`);
		const chains = chainIds.map((id) => `eip155:${id}`);

		const namespaces = buildApprovedNamespaces({
			proposal: proposal.params,
			supportedNamespaces: {
				eip155: {
					chains,
					methods: SUPPORTED_METHODS,
					events: SUPPORTED_EVENTS,
					accounts,
				},
			},
		});

		await this.walletKit?.approveSession({ id: proposal.id, namespaces });
	}

	async rejectSession(proposal: WalletKitTypes.SessionProposal): Promise<void> {
		await this.walletKit?.rejectSession({
			id: proposal.id,
			reason: getSdkError("USER_REJECTED"),
		});
	}

	async respondSuccess(
		topic: string,
		id: number,
		result: unknown,
	): Promise<void> {
		await this.walletKit?.respondSessionRequest({
			topic,
			response: { id, result, jsonrpc: "2.0" },
		});
	}

	async respondError(topic: string, id: number): Promise<void> {
		await this.walletKit?.respondSessionRequest({
			topic,
			response: {
				id,
				jsonrpc: "2.0",
				error: getSdkError("USER_REJECTED"),
			},
		});
	}

	async disconnectSession(topic: string): Promise<void> {
		await this.walletKit?.disconnectSession({
			topic,
			reason: getSdkError("USER_DISCONNECTED"),
		});
	}

	getActiveSessions() {
		if (!this.walletKit) return {};
		return this.walletKit.getActiveSessions();
	}

	// ─── Pay ──────────────────────────────────────────────────────────────────────

	async getPaymentOptions(paymentLink: string, accounts: string[]) {
		await this.init();
		return this.walletKit?.pay.getPaymentOptions({
			paymentLink,
			accounts,
			includePaymentInfo: true,
		});
	}

	async getRequiredPaymentActions(paymentId: string, optionId: string) {
		return this.walletKit?.pay.getRequiredPaymentActions({
			paymentId,
			optionId,
		});
	}

	async confirmPayment(
		paymentId: string,
		optionId: string,
		signatures: string[],
	) {
		return this.walletKit?.pay.confirmPayment({
			paymentId,
			optionId,
			signatures,
		});
	}
}

export const walletConnectService = new WalletConnectService();
