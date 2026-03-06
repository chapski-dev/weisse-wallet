import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';

interface SeedPhraseDisplayProps {
  mnemonic: string;
  showCopyButton?: boolean;
}

export function SeedPhraseDisplay({ mnemonic, showCopyButton = true }: SeedPhraseDisplayProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const words = mnemonic.split(' ');

  const handleCopy = async () => {
    await Clipboard.setStringAsync(mnemonic);
    Alert.alert('Скопировано', 'Seed фраза скопирована в буфер обмена. Храните её в безопасности!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.warning}>
        ⚠️ Никогда не делитесь этой фразой! Любой, кто её знает, может получить доступ к вашим средствам.
      </Text>

      <TouchableOpacity
        style={styles.revealButton}
        onPress={() => setIsRevealed(!isRevealed)}
      >
        <Text style={styles.revealButtonText}>
          {isRevealed ? '🙈 Скрыть фразу' : '👁️ Показать фразу'}
        </Text>
      </TouchableOpacity>

      <View style={styles.wordsContainer}>
        {words.map((word, index) => (
          <View key={index} style={styles.wordBox}>
            <Text style={styles.wordNumber}>{index + 1}</Text>
            <Text style={[styles.word, !isRevealed && styles.hidden]}>
              {isRevealed ? word : '••••••'}
            </Text>
          </View>
        ))}
      </View>

      {showCopyButton && isRevealed && (
        <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
          <Text style={styles.copyButtonText}>📋 Скопировать фразу</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  warning: {
    backgroundColor: '#FFF3CD',
    color: '#856404',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  revealButton: {
    backgroundColor: '#E3E3E3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  revealButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  wordBox: {
    width: '30%',
    backgroundColor: '#F5F5F5',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordNumber: {
    fontSize: 12,
    color: '#888',
    marginRight: 8,
    minWidth: 16,
  },
  word: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  hidden: {
    color: '#CCC',
  },
  copyButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
