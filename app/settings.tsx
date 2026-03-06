import { NetworkModeToggle } from '@/components/ui/network-mode-toggle';
import { SeedPhraseDisplay } from '@/components/wallet/seed-phrase-display';
import { useWallet } from '@/providers/wallet-provider';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { wallet, deleteWallet, revealMnemonic } = useWallet();
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [mnemonic, setMnemonic] = useState<string | null>(null);

  const handleRevealSeedPhrase = async () => {
    const showSeed = async () => {
      const phrase = await revealMnemonic();
      if (phrase) {
        setMnemonic(phrase);
        setShowSeedPhrase(true);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Внимание!\n\nВы собираетесь показать seed фразу. Убедитесь, что никто не видит ваш экран.'
      );
      if (confirmed) {
        await showSeed();
      }
    } else {
      Alert.alert(
        'Внимание!',
        'Вы собираетесь показать seed фразу. Убедитесь, что никто не видит ваш экран.',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Показать',
            onPress: showSeed,
          },
        ]
      );
    }
  };

  const performDelete = async () => {
    await deleteWallet();
    router.replace('/(tabs)/wallet');
  };

  const handleDeleteWallet = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        '⚠️ Удалить кошелек?\n\nЭто действие необратимо! Убедитесь, что у вас есть резервная копия seed фразы.'
      );
      if (confirmed) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        '⚠️ Удалить кошелек?',
        'Это действие необратимо! Убедитесь, что у вас есть резервная копия seed фразы.',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Удалить',
            style: 'destructive',
            onPress: confirmDelete,
          },
        ]
      );
    }
  };

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Последнее предупреждение\n\nВы точно хотите удалить кошелек? Без seed фразы восстановление невозможно!'
      );
      if (confirmed) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Последнее предупреждение',
        'Вы точно хотите удалить кошелек? Без seed фразы восстановление невозможно!',
        [
          { text: 'Нет, оставить', style: 'cancel' },
          {
            text: 'Да, удалить',
            style: 'destructive',
            onPress: performDelete,
          },
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Настройки</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        {/* Информация о кошельке */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Кошелек</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Название</Text>
            <Text style={styles.infoValue}>{wallet?.name}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Создан</Text>
            <Text style={styles.infoValue}>
              {wallet?.createdAt
                ? new Date(wallet.createdAt).toLocaleDateString('ru-RU')
                : '-'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Сетей</Text>
            <Text style={styles.infoValue}>{wallet?.accounts.length || 0}</Text>
          </View>
        </View>

        {/* Сеть */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Сеть</Text>
          <View style={styles.networkModeContainer}>
            <View style={styles.networkModeInfo}>
              <Text style={styles.actionTitle}>Режим сети</Text>
              <Text style={styles.actionDescription}>
                Переключение между mainnet и testnet
              </Text>
            </View>
            <NetworkModeToggle />
          </View>
        </View>

        {/* Безопасность */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Безопасность</Text>

          {!showSeedPhrase ? (
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleRevealSeedPhrase}
            >
              <Text style={styles.actionIcon}>🔑</Text>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Показать seed фразу</Text>
                <Text style={styles.actionDescription}>
                  Получить доступ к резервной фразе
                </Text>
              </View>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.seedPhraseContainer}>
              <SeedPhraseDisplay mnemonic={mnemonic || ''} />
              <TouchableOpacity
                style={styles.hideSeedButton}
                onPress={() => {
                  setShowSeedPhrase(false);
                  setMnemonic(null);
                }}
              >
                <Text style={styles.hideSeedButtonText}>Скрыть seed фразу</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* О приложении */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>О приложении</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Версия</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Название</Text>
            <Text style={styles.infoValue}>Weiss Wallet</Text>
          </View>
        </View>

        {/* Опасная зона */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>
            Опасная зона
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteWallet}
          >
            <Text style={styles.deleteButtonText}>🗑️ Удалить кошелек</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 18,
    color: '#999',
  },
  seedPhraseContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  hideSeedButton: {
    backgroundColor: '#E0E0E0',
    padding: 12,
    alignItems: 'center',
  },
  hideSeedButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  dangerSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#FFE0E0',
  },
  dangerTitle: {
    color: '#D32F2F',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  deleteButtonText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: '600',
  },
  networkModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 12,
    paddingLeft: 16,
    borderRadius: 12,
  },
  networkModeInfo: {
    flex: 1,
  },
});
