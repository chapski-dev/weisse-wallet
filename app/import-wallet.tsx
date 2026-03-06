import { SeedPhraseInput } from '@/components/wallet/seed-phrase-input';
import { useWallet } from '@/providers/wallet-provider';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ImportWalletScreen() {
  const router = useRouter();
  const { importWallet } = useWallet();
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async (mnemonic: string) => {
    setIsImporting(true);
    try {
      await importWallet(mnemonic, 'Импортированный кошелек');
      if (Platform.OS === 'web') {
        window.alert('Кошелек успешно импортирован!');
        router.replace('/(tabs)/wallet');
      } else {
        Alert.alert('Готово!', 'Кошелек успешно импортирован', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/wallet') },
        ]);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось импортировать кошелек');
    } finally {
      setIsImporting(false);
    }
  };

  if (isImporting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Импортируем кошелек...</Text>
        <Text style={styles.loadingSubtext}>
          Восстанавливаем адреса для всех сетей
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Назад</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Импорт кошелька</Text>
        <Text style={styles.description}>
          Введите вашу seed фразу (12 или 24 слова), чтобы восстановить доступ к кошельку.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🔒 Безопасность</Text>
          <Text style={styles.infoText}>
            Ваша seed фраза хранится только на устройстве в зашифрованном виде. Мы никогда не отправляем её на сервера.
          </Text>
        </View>

        <SeedPhraseInput onValidPhrase={handleImport} />
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
    padding: 16,
    paddingTop: 60,
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1A1A2E',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: '#E8F4FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#007AFF',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    color: '#333',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});
