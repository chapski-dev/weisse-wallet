import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useEffect, useRef, useState } from 'react';
import { TextInput, TouchableOpacity } from 'react-native';

import { Box } from '@/components/ui/builders/Box';
import { Text } from '@/components/ui/builders/Text';
import { BottomSlideModal } from '@/components/ui/shared/BottomSlideModal';
import { Button } from '@/components/ui/shared/Button';
import { useWallet } from '@/providers/wallet-provider';
import { MasterWallet } from '@/types/wallet';

const AVATAR_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const MAX_NAME_LENGTH = 30;

interface RenameWalletModalProps {
  wallet: MasterWallet | null;
  walletIndex: number;
  visible: boolean;
  onClose: () => void;
}

export function RenameWalletModal({ wallet, walletIndex, visible, onClose }: RenameWalletModalProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { renameWallet } = useWallet();
  const [name, setName] = useState('');

  useEffect(() => {
    if (visible) {
      setName(wallet?.name ?? '');
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, wallet]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!wallet || !trimmed) return;
    await renameWallet(wallet.id, trimmed);
    onClose();
  };

  const avatarColor = AVATAR_COLORS[walletIndex % AVATAR_COLORS.length];

  return (
    <BottomSlideModal ref={bottomSheetRef} onDismiss={onClose} enableDynamicSizing={false}>
      <BottomSheetView>
        <Box pb={20}>
          {/* Header */}
          <Box row justifyContent="space-between" alignItems="center" px={20} h={52}>
            <Text variant="h5" color="#fff">Переименовать</Text>
            <TouchableOpacity onPress={onClose}>
              <Box w={32} h={32} borderRadius={16} alignItems="center" justifyContent="center" backgroundColor="#1F2937">
                <Ionicons name="close" size={16} color="#9CA3AF" />
              </Box>
            </TouchableOpacity>
          </Box>

          {/* Wallet preview */}
          <Box row alignItems="center" px={20} py={8} gap={12}>
            <Box w={44} h={44} borderRadius={14} alignItems="center" justifyContent="center" backgroundColor={avatarColor}>
              <Text variant="h4" color="#fff">
                {wallet?.name.charAt(0).toUpperCase()}
              </Text>
            </Box>
            <Box gap={2}>
              <Text variant="caption-medium" colorName="label">Текущее имя</Text>
              <Text variant="p4-semibold" colorName="label">{wallet?.name}</Text>
            </Box>
          </Box>

          {/* Input section */}
          <Box px={20} gap={8} mt={4}>
            <Box row justifyContent="space-between" alignItems="center">
              <Text variant="p4-semibold" colorName="label">Новое название</Text>
              <Text variant="caption" color="#4B5563">{name.length} / {MAX_NAME_LENGTH}</Text>
            </Box>

            <Box
              h={56} borderRadius={14} px={16}
              backgroundColor="#161B22"
              borderWidth={2} borderColor="#3B82F6"
              row alignItems="center" gap={8}
            >
              <TextInput
                style={{ flex: 1, fontSize: 16, fontWeight: '500', color: '#fff' }}
                value={name}
                onChangeText={(t) => setName(t.slice(0, MAX_NAME_LENGTH))}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSave}
                placeholderTextColor="#4B5563"
                selectionColor="#3B82F6"
              />
            </Box>

            <Text variant="caption" color="#4B5563">
              Используйте понятное имя — оно видно только вам
            </Text>
          </Box>

          {/* Buttons */}
          <Box row px={20} pt={12} gap={12}>
            <Button type="outline" backgroundColor="grey_200" wrapperStyle={{ flex: 1 }} onPress={onClose}>Отмена</Button>
            <Button type="filled" wrapperStyle={{ flex: 1 }} onPress={handleSave}>Сохранить</Button>
          </Box>
        </Box>
      </BottomSheetView>
    </BottomSlideModal>
  );
}
