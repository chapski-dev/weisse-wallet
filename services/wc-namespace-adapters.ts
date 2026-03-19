import {
	Keypair as StellarKeypair,
	Networks as StellarNetworks,
	TransactionBuilder,
	authorizeEntry,
	hash,
	xdr,
} from "@stellar/stellar-base";
import { privateKeyToAccount } from "viem/accounts";
import { walletService } from "@/services/wallet-service";
import { Network } from "@/types/wallet";

// ─── Type ─────────────────────────────────────────────────────────────────────

export type WCNamespaceAdapter = {
	/** WalletConnect namespace identifier, e.g. "eip155", "stellar", "near" */
	namespace: string;
	/** Full chain identifiers, e.g. ["eip155:1", "eip155:137"] */
	chains: string[];
	methods: string[];
	events: string[];
	/** Returns the full "namespace:chain:address" account strings */
	getAccounts: () => Promise<string[]>;
	/** Signs / processes a request and returns the result */
	handleRequest: (method: string, params: unknown[]) => Promise<unknown>;
};

// ─── EVM Adapter ──────────────────────────────────────────────────────────────

const EVM_CHAINS = [
	"eip155:1",     // Ethereum
	"eip155:137",   // Polygon
	"eip155:56",    // BSC
	"eip155:42161", // Arbitrum
	"eip155:10",    // Optimism
	"eip155:8453",  // Base
];

const evmAdapter: WCNamespaceAdapter = {
	namespace: "eip155",
	chains: EVM_CHAINS,
	methods: [
		"eth_sendTransaction",
		"eth_signTransaction",
		"eth_sign",
		"personal_sign",
		"eth_signTypedData",
		"eth_signTypedData_v4",
	],
	events: ["chainChanged", "accountsChanged"],

	async getAccounts() {
		const { address } = await walletService.getEVMWallet(Network.ETHEREUM);
		return EVM_CHAINS.map((chain) => `${chain}:${address}`);
	},

	async handleRequest(method, params) {
		const { privateKey } = await walletService.getEVMWallet(Network.ETHEREUM);
		const account = privateKeyToAccount(privateKey);

		switch (method) {
			case "personal_sign": {
				const [message] = params as [string, string];
				return account.signMessage({
					message: { raw: message as `0x${string}` },
				});
			}
			case "eth_sign": {
				const [, message] = params as [string, string];
				return account.signMessage({
					message: { raw: message as `0x${string}` },
				});
			}
			case "eth_signTypedData":
			case "eth_signTypedData_v4": {
				const [, typedDataJson] = params as [string, string];
				const typedData = JSON.parse(typedDataJson);
				const { domain, types, primaryType, message } = typedData;
				// biome-ignore lint/correctness/noUnusedVariables: EIP712Domain must be excluded
				const { EIP712Domain: _, ...filteredTypes } = types;
				return account.signTypedData({
					domain,
					types: filteredTypes,
					primaryType,
					message,
				});
			}
			case "eth_sendTransaction":
			case "eth_signTransaction": {
				const [tx] = params as [
					{ to: string; value?: string; data?: string; gas?: string },
				];
				return account.signTransaction({
					to: tx.to as `0x${string}`,
					value: tx.value ? BigInt(tx.value) : 0n,
					data: (tx.data as `0x${string}`) ?? "0x",
					gas: tx.gas ? BigInt(tx.gas) : undefined,
					type: "legacy",
				});
			}
			default:
				throw new Error(`Unsupported EVM method: ${method}`);
		}
	},
};

// ─── Stellar Adapter ──────────────────────────────────────────────────────────

const stellarAdapter: WCNamespaceAdapter = {
	namespace: "stellar",
	chains: ["stellar:pubnet"],
	methods: [
		"stellar_signTransaction",
		"stellar_signAndSubmitTransaction",
		"stellar_signAuthEntry",
		"stellar_signMessage",
	],
	events: [],

	async getAccounts() {
		const { address } = await walletService.getStellarWallet();
		return [`stellar:pubnet:${address}`];
	},

	async handleRequest(method, params) {
		const { secretKey } = await walletService.getStellarWallet();

		switch (method) {
			case "stellar_signTransaction": {
				const [{ xdr }] = params as [{ xdr: string }];
				const tx = TransactionBuilder.fromXDR(xdr, StellarNetworks.PUBLIC);
				tx.sign(StellarKeypair.fromSecret(secretKey));
				return { signedXDR: tx.toEnvelope().toXDR("base64") };
			}
			case "stellar_signAndSubmitTransaction": {
				const [{ xdr }] = params as [{ xdr: string }];
				const tx = TransactionBuilder.fromXDR(xdr, StellarNetworks.PUBLIC);
				tx.sign(StellarKeypair.fromSecret(secretKey));
				const signedXdr = tx.toEnvelope().toXDR("base64");
				const submitRes = await fetch(
					"https://horizon.stellar.org/transactions",
					{
						method: "POST",
						headers: { "Content-Type": "application/x-www-form-urlencoded" },
						body: `tx=${encodeURIComponent(signedXdr)}`,
					},
				);
				const submitResult = await submitRes.json();
				if (!submitRes.ok) {
					const code =
						submitResult?.extras?.result_codes?.transaction;
					throw new Error(
						code ?? submitResult?.detail ?? "Transaction failed",
					);
				}
				return { hash: submitResult.hash as string };
			}
			case "stellar_signAuthEntry": {
				const [{ xdr: authXdr, networkPassphrase: passphrase }] =
					params as [{ xdr: string; address?: string; networkPassphrase?: string }];
				const keypair = StellarKeypair.fromSecret(secretKey);
				const entry = xdr.SorobanAuthorizationEntry.fromXDR(authXdr, "base64");
				const expirationLedger = entry
					.credentials()
					.address()
					.signatureExpirationLedger();
				const signedEntry = await authorizeEntry(
					entry,
					keypair,
					expirationLedger,
					passphrase ?? StellarNetworks.PUBLIC,
				);
				return { signedAuthEntry: signedEntry.toXDR("base64") };
			}
			case "stellar_signMessage": {
				const [{ message }] = params as [{ message: string; address?: string }];
				const keypair = StellarKeypair.fromSecret(secretKey);
				const msgHash = hash(Buffer.from(message, "utf-8"));
				const signature = keypair.sign(msgHash);
				return { signature: Buffer.from(signature).toString("base64") };
			}
			default:
				throw new Error(`Unsupported Stellar method: ${method}`);
		}
	},
};

// ─── Registry ─────────────────────────────────────────────────────────────────
// To add a new chain family (e.g. NEAR, Sui):
//   1. Implement the wallet method in wallet-service.ts
//   2. Add an adapter object above
//   3. Add it to WC_ADAPTERS — nothing else needs to change

export const WC_ADAPTERS: WCNamespaceAdapter[] = [
	evmAdapter,
	stellarAdapter,
	// nearAdapter,
	// suiAdapter,
	// solanaAdapter,
];
