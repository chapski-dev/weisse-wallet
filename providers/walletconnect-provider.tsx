import type { WalletKitTypes } from "@reown/walletkit";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { walletConnectService } from "@/services/walletconnect-service";
import { WC_ADAPTERS } from "@/services/wc-namespace-adapters";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WCSession = {
	topic: string;
	peer: {
		metadata: {
			name: string;
			description: string;
			url: string;
			icons: string[];
		};
	};
};

export type WCRequest = {
	id: number;
	topic: string;
	method: string;
	params: unknown[];
	chainId: string;
	peerName: string;
	peerIcon?: string;
};

type WalletConnectContextType = {
	sessions: WCSession[];
	pendingProposal: WalletKitTypes.SessionProposal | null;
	pendingRequest: WCRequest | null;
	isReady: boolean;
	pair: (uri: string) => Promise<void>;
	approveProposal: () => Promise<void>;
	rejectProposal: () => Promise<void>;
	approveRequest: () => Promise<void>;
	rejectRequest: () => Promise<void>;
	disconnect: (topic: string) => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const WalletConnectContext = createContext<WalletConnectContextType | null>(
	null,
);

export function useWalletConnect() {
	const ctx = useContext(WalletConnectContext);
	if (!ctx)
		throw new Error(
			"useWalletConnect must be used inside WalletConnectProvider",
		);
	return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WalletConnectProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [isReady, setIsReady] = useState(false);
	const [sessions, setSessions] = useState<WCSession[]>([]);
	const [pendingProposal, setPendingProposal] =
		useState<WalletKitTypes.SessionProposal | null>(null);
	const [pendingRequest, setPendingRequest] = useState<WCRequest | null>(null);

	const refreshSessions = useCallback(() => {
		const active = walletConnectService.getActiveSessions();
		setSessions(Object.values(active) as WCSession[]);
	}, []);

	// Инициализация WalletConnect
	useEffect(() => {
		let mounted = true;

		walletConnectService
			.init()
			.then(() => {
				if (!mounted) return;

				const client = walletConnectService.getClient();

				// Новый запрос на подключение от dApp
				client.on("session_proposal", (proposal) => {
					setPendingProposal(proposal);
				});

				// Запрос на подпись / транзакцию от dApp
				client.on("session_request", (event) => {
					const session = walletConnectService.getActiveSessions()[event.topic];
					setPendingRequest({
						id: event.id,
						topic: event.topic,
						method: event.params.request.method,
						params: event.params.request.params,
						chainId: event.params.chainId,
						peerName: session?.peer?.metadata?.name ?? "Unknown dApp",
						peerIcon: session?.peer?.metadata?.icons?.[0],
					});
				});

				client.on("session_delete", () => {
					refreshSessions();
				});

				refreshSessions();
				setIsReady(true);
			})
			.catch(console.error);

		return () => {
			mounted = false;
		};
	}, [refreshSessions]);

	// Подключить по URI
	const pair = useCallback(async (uri: string) => {
		await walletConnectService.pair(uri);
	}, []);

	// Одобрить подключение dApp
	const approveProposal = useCallback(async () => {
		if (!pendingProposal) return;

		const requiredNS = pendingProposal.params.requiredNamespaces ?? {};
		const optionalNS = pendingProposal.params.optionalNamespaces ?? {};
		const requestedNS = new Set([
			...Object.keys(requiredNS),
			...Object.keys(optionalNS),
		]);

		const supportedNamespaces: Record<
			string,
			{ chains: string[]; methods: string[]; events: string[]; accounts: string[] }
		> = {};

		for (const adapter of WC_ADAPTERS) {
			if (requestedNS.has(adapter.namespace)) {
				const accounts = await adapter.getAccounts();

				// Include all methods/events the dApp requests so buildApprovedNamespaces
				// always finds an overlap, regardless of what names the dApp uses.
				const proposalMethods = [
					...(requiredNS[adapter.namespace]?.methods ?? []),
					...(optionalNS[adapter.namespace]?.methods ?? []),
				];
				const proposalEvents = [
					...(requiredNS[adapter.namespace]?.events ?? []),
					...(optionalNS[adapter.namespace]?.events ?? []),
				];

				supportedNamespaces[adapter.namespace] = {
					chains: adapter.chains,
					methods: [...new Set([...adapter.methods, ...proposalMethods])],
					events: [...new Set([...adapter.events, ...proposalEvents])],
					accounts,
				};
			}
		}

		await walletConnectService.approveSession(pendingProposal, supportedNamespaces);
		setPendingProposal(null);
		refreshSessions();
	}, [pendingProposal, refreshSessions]);

	// Отклонить подключение dApp
	const rejectProposal = useCallback(async () => {
		if (!pendingProposal) return;
		await walletConnectService.rejectSession(pendingProposal);
		setPendingProposal(null);
	}, [pendingProposal]);

	// Одобрить запрос на подпись
	const approveRequest = useCallback(async () => {
		if (!pendingRequest) return;

		const namespace = pendingRequest.chainId.split(":")[0];
		const adapter = WC_ADAPTERS.find((a) => a.namespace === namespace);

		if (!adapter) {
			await walletConnectService.respondError(
				pendingRequest.topic,
				pendingRequest.id,
			);
			setPendingRequest(null);
			return;
		}

		try {
			const result = await adapter.handleRequest(
				pendingRequest.method,
				pendingRequest.params,
			);
			await walletConnectService.respondSuccess(
				pendingRequest.topic,
				pendingRequest.id,
				result,
			);
		} catch {
			await walletConnectService.respondError(
				pendingRequest.topic,
				pendingRequest.id,
			);
		}

		setPendingRequest(null);
	}, [pendingRequest]);

	// Отклонить запрос
	const rejectRequest = useCallback(async () => {
		if (!pendingRequest) return;
		await walletConnectService.respondError(
			pendingRequest.topic,
			pendingRequest.id,
		);
		setPendingRequest(null);
	}, [pendingRequest]);

	// Отключить сессию
	const disconnect = useCallback(
		async (topic: string) => {
			await walletConnectService.disconnectSession(topic);
			refreshSessions();
		},
		[refreshSessions],
	);

	return (
		<WalletConnectContext.Provider
			value={{
				sessions,
				pendingProposal,
				pendingRequest,
				isReady,
				pair,
				approveProposal,
				rejectProposal,
				approveRequest,
				rejectRequest,
				disconnect,
			}}
		>
			{children}
		</WalletConnectContext.Provider>
	);
}
