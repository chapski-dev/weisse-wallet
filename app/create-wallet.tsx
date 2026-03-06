import { SeedPhraseDisplay } from '@/components/wallet/seed-phrase-display';
import { useWallet } from '@/providers/wallet-provider';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

type Step = 'generate' | 'backup' | 'verify' | 'creating';

export default function CreateWalletScreen() {
  const router = useRouter();
  const { generateNewMnemonic, createWallet, mnemonic } = useWallet();
  const [step, setStep] = useState<Step>('generate');
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string>('');
  const [hasBackedUp, setHasBackedUp] = useState(false);

  useEffect(() => {
    // Генерируем новую seed фразу при открытии экрана
    const newMnemonic = generateNewMnemonic();
    setGeneratedMnemonic(newMnemonic);
  }, []);

  const handleContinueToBackup = () => {
    setStep('backup');
  };

  const handleConfirmBackup = () => {
    const message = 'Вы уверены, что сохранили seed фразу в безопасном месте? Вы не сможете восстановить кошелек без неё!';
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(message);
      if (confirmed) {
        setHasBackedUp(true);
        handleCreateWallet();
      }
    } else {
      Alert.alert(
        'Подтверждение',
        message,
        [
          { text: 'Нет, вернуться', style: 'cancel' },
          {
            text: 'Да, я сохранил',
            onPress: () => {
              setHasBackedUp(true);
              handleCreateWallet();
            },
          },
        ]
      );
    }
  };

  const handleCreateWallet = async () => {
    setStep('creating');
    try {
      await createWallet(generatedMnemonic, 'Мой кошелек');
      if (Platform.OS === 'web') {
        window.alert('Кошелек успешно создан!');
        router.replace('/(tabs)/wallet');
      } else {
        Alert.alert('Готово!', 'Кошелек успешно создан', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/wallet') },
        ]);
      }
    } catch (error) {
      console.error(error)
      if (Platform.OS === 'web') {
        window.alert('Ошибка: Не удалось создать кошелек');
      } else {
        Alert.alert('Ошибка', 'Не удалось создать кошелек');
      }
      setStep('backup');
    }
  };

  if (step === 'creating') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Создаём кошелек...</Text>
        <Text style={styles.loadingSubtext}>
          Генерируем адреса для всех сетей
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

      {step === 'generate' && (
        <View style={styles.content}>
          <Text style={styles.title}>Создание кошелька</Text>
          <Text style={styles.description}>
            Мы сгенерировали уникальную seed фразу из 12 слов. Эта фраза — единственный способ восстановить доступ к вашим средствам.
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 Что такое seed фраза?</Text>
            <Text style={styles.infoText}>
              Seed фраза (мнемоническая фраза) — это набор слов, который используется для генерации всех ваших криптоадресов. Одна фраза = доступ ко всем сетям.
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleContinueToBackup}>
            <Text style={styles.primaryButtonText}>Показать seed фразу</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'backup' && (
        <View style={styles.content}>
          <Text style={styles.title}>Сохраните seed фразу</Text>
          <Text style={styles.description}>
            Запишите эти 12 слов в правильном порядке и храните в безопасном месте.
          </Text>

          <SeedPhraseDisplay mnemonic={generatedMnemonic} />

          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ Важно!</Text>
            <Text style={styles.warningText}>
              • Никогда не делитесь seed фразой{'\n'}
              • Не храните её в электронном виде{'\n'}
              • Запишите на бумаге и храните в сейфе{'\n'}
              • Потеря фразы = потеря доступа к средствам
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleConfirmBackup}>
            <Text style={styles.primaryButtonText}>Я сохранил фразу</Text>
          </TouchableOpacity>
        </View>
      )}
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
  warningBox: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#856404',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
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
