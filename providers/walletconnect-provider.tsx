import { WalletKitTypes } from '@reown/walletkit';
import { privateKeyToAccount } from 'viem/accounts';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { walletConnectService } from '@/services/walletconnect-service';
import { walletService } from '@/services/wallet-service';
import { Network } from '@/types/wallet';

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

const WalletConnectContext = createContext<WalletConnectContextType | null>(null);

export function useWalletConnect() {
  const ctx = useContext(WalletConnectContext);
  if (!ctx) throw new Error('useWalletConnect must be used inside WalletConnectProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WalletConnectProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [sessions, setSessions] = useState<WCSession[]>([]);
  const [pendingProposal, setPendingProposal] = useState<WalletKitTypes.SessionProposal | null>(null);
  const [pendingRequest, setPendingRequest] = useState<WCRequest | null>(null);

  const refreshSessions = useCallback(() => {
    const active = walletConnectService.getActiveSessions();
    setSessions(Object.values(active) as WCSession[]);
  }, []);

  // Инициализация WalletConnect
  useEffect(() => {
    let mounted = true;

    walletConnectService.init().then(() => {
      if (!mounted) return;

      const client = walletConnectService.getClient();

      // Новый запрос на подключение от dApp
      client.on('session_proposal', (proposal) => {
        setPendingProposal(proposal);
      });

      // Запрос на подпись / транзакцию от dApp
      client.on('session_request', (event) => {
        const session = walletConnectService.getActiveSessions()[event.topic];
        setPendingRequest({
          id: event.id,
          topic: event.topic,
          method: event.params.request.method,
          params: event.params.request.params,
          peerName: session?.peer?.metadata?.name ?? 'Unknown dApp',
          peerIcon: session?.peer?.metadata?.icons?.[0],
        });
      });

      client.on('session_delete', () => {
        refreshSessions();
      });

      refreshSessions();
      setIsReady(true);
    }).catch(console.error);

    return () => { mounted = false; };
  }, [refreshSessions]);

  // Подключить по URI
  const pair = useCallback(async (uri: string) => {
    await walletConnectService.pair(uri);
  }, []);

  // Одобрить подключение dApp
  const approveProposal = useCallback(async () => {
    if (!pendingProposal) return;
    const { privateKey } = await walletService.getEVMWallet(Network.ETHEREUM);
    const account = privateKeyToAccount(privateKey);
    // Одобряем для основных EVM сетей
    await walletConnectService.approveSession(pendingProposal, account.address, [1, 137, 56, 42161, 10, 8453]);
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

    const { privateKey } = await walletService.getEVMWallet(Network.ETHEREUM);
    const account = privateKeyToAccount(privateKey);

    let result: unknown;

    switch (pendingRequest.method) {
      case 'personal_sign': {
        const [message] = pendingRequest.params as [string, string];
        result = await account.signMessage({ message: { raw: message as `0x${string}` } });
        break;
      }
      case 'eth_sign': {
        const [, message] = pendingRequest.params as [string, string];
        result = await account.signMessage({ message: { raw: message as `0x${string}` } });
        break;
      }
      case 'eth_signTypedData':
      case 'eth_signTypedData_v4': {
        const [, typedDataJson] = pendingRequest.params as [string, string];
        const typedData = JSON.parse(typedDataJson);
        const { domain, types, primaryType, message } = typedData;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { EIP712Domain: _, ...filteredTypes } = types;
        result = await account.signTypedData({ domain, types: filteredTypes, primaryType, message });
        break;
      }
      case 'eth_sendTransaction':
      case 'eth_signTransaction': {
        // Для транзакций только подписываем — отправку делает dApp
        const [tx] = pendingRequest.params as [{ to: string; value?: string; data?: string; gas?: string }];
        result = await account.signTransaction({
          to: tx.to as `0x${string}`,
          value: tx.value ? BigInt(tx.value) : 0n,
          data: (tx.data as `0x${string}`) ?? '0x',
          gas: tx.gas ? BigInt(tx.gas) : undefined,
          type: 'legacy',
        });
        break;
      }
      default:
        await walletConnectService.respondError(pendingRequest.topic, pendingRequest.id);
        setPendingRequest(null);
        return;
    }

    await walletConnectService.respondSuccess(pendingRequest.topic, pendingRequest.id, result);
    setPendingRequest(null);
  }, [pendingRequest]);

  // Отклонить запрос
  const rejectRequest = useCallback(async () => {
    if (!pendingRequest) return;
    await walletConnectService.respondError(pendingRequest.topic, pendingRequest.id);
    setPendingRequest(null);
  }, [pendingRequest]);

  // Отключить сессию
  const disconnect = useCallback(async (topic: string) => {
    await walletConnectService.disconnectSession(topic);
    refreshSessions();
  }, [refreshSessions]);

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
