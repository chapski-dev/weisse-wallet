import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity } from 'react-native';

import { Box } from '@/components/ui/builders/Box';
import { Text } from '@/components/ui/builders/Text';
import { BottomSlideModal } from '@/components/ui/shared/BottomSlideModal';
import { RenameWalletModal } from '@/components/wallet/rename-wallet-modal';
import { useWallet } from '@/providers/wallet-provider';
import { MasterWallet } from '@/types/wallet';

interface WalletSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

const AVATAR_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

function WalletItem({
  wallet,
  index,
  isActive,
  onPress,
  onMorePress,
}: {
  wallet: MasterWallet;
  index: number;
  isActive: boolean;
  onPress: () => void;
  onMorePress: () => void;
}) {
  const ethAccount = wallet.accounts.find((a) => a.network === 'ethereum');
  const summary = ethAccount ? `${parseFloat(ethAccount.balance).toFixed(4)} ETH` : '—';
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Box
        row alignItems="center" h={72} borderRadius={16} px={16} gap={12} mb={4}
        backgroundColor={isActive ? '#1F2937' : '#161B22'}
        borderWidth={isActive ? 1 : 0}
        borderColor={isActive ? '#3B82F6' : undefined}
      >
        {/* Avatar */}
        <Box w={44} h={44} borderRadius={14} alignItems="center" justifyContent="center" backgroundColor={avatarColor}>
          <Text variant="h4" color="#fff">
            {wallet.name.charAt(0).toUpperCase()}
          </Text>
        </Box>

        {/* Info */}
        <Box flex gap={3}>
          <Text variant="p3-semibold" color="#fff">{wallet.name}</Text>
          <Text variant="caption" colorName="label">{summary}</Text>
        </Box>

        {/* Active check */}
        {isActive && (
          <Box w={24} h={24} borderRadius={12} alignItems="center" justifyContent="center" backgroundColor="#3B82F6">
            <Ionicons name="checkmark" size={14} color="#fff" />
          </Box>
        )}

        {/* More button */}
        <TouchableOpacity onPress={onMorePress} hitSlop={8}>
          <Box
            w={32} h={32} borderRadius={8}
            alignItems="center" justifyContent="center"
            backgroundColor={isActive ? '#374151' : '#1F2937'}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
          </Box>
        </TouchableOpacity>
      </Box>
    </TouchableOpacity>
  );
}

export function WalletSwitcherModal({ visible, onClose }: WalletSwitcherModalProps) {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { wallets, wallet: activeWallet, switchWallet } = useWallet();
  const [renameTarget, setRenameTarget] = useState<{ wallet: MasterWallet; index: number } | null>(null);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleSwitch = async (walletId: string) => {
    await switchWallet(walletId);
    onClose();
  };

  return (
    <>
    <BottomSlideModal ref={bottomSheetRef} onDismiss={onClose} maxDynamicContentSize={400} snapPoints={undefined} >
      <BottomSheetView>
        <Box pb={20}>
          {/* Header */}
          <Box row justifyContent="space-between" alignItems="center" px={20} h={52}>
            <Text variant="h5" color="#fff">Кошельки</Text>
            <TouchableOpacity onPress={onClose}>
              <Box w={32} h={32} borderRadius={16} alignItems="center" justifyContent="center" backgroundColor="#1F2937">
                <Ionicons name="close" size={16} color="#9CA3AF" />
              </Box>
            </TouchableOpacity>
          </Box>

          {/* Wallet list */}
          <Box px={16}>
            {wallets.map((w, i) => (
              <WalletItem
                key={w.id}
                wallet={w}
                index={i}
                isActive={w.id === activeWallet?.id}
                onPress={() => handleSwitch(w.id)}
                onMorePress={() => setRenameTarget({ wallet: w, index: i })}
              />
            ))}
          </Box>

          {/* Divider */}
          <Box h={1} backgroundColor="#1F2937" mx={16} my={8} />

          {/* Add wallet button */}
          <Box px={20} pb={16}>
            <TouchableOpacity
              onPress={() => { onClose(); router.push('/add-wallet'); }}
              activeOpacity={0.8}
            >
              <Box
                row alignItems="center" justifyContent="center" h={52} borderRadius={16}
                gap={10} backgroundColor="#0D1F3C" borderWidth={2} borderColor="#3B82F6"
              >
                <Ionicons name="add-circle-outline" size={20} color="#60A5FA" />
                <Text variant="p2-semibold" color="#60A5FA">Добавить кошелёк</Text>
              </Box>
            </TouchableOpacity>
          </Box>
        </Box>
      </BottomSheetView>
    </BottomSlideModal>

    <RenameWalletModal
      wallet={renameTarget?.wallet ?? null}
      walletIndex={renameTarget?.index ?? 0}
      visible={renameTarget !== null}
      onClose={() => setRenameTarget(null)}
    />
    </>
  );
}
