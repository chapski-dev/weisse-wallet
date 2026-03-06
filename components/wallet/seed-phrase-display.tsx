import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui/builders/Text';
import { useAppTheme } from '@/theme/theme';

interface SeedPhraseDisplayProps {
  mnemonic: string;
  showCopyButton?: boolean;
}

export function SeedPhraseDisplay({ mnemonic, showCopyButton = true }: SeedPhraseDisplayProps) {
  const { colors } = useAppTheme();
  const [isRevealed, setIsRevealed] = useState(false);
  const words = mnemonic.split(' ');

  // Split into 3 columns
  const col1 = words.slice(0, 4);
  const col2 = words.slice(4, 8);
  const col3 = words.slice(8, 12);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(mnemonic);
    Alert.alert('Скопировано', 'Seed фраза скопирована. Храните её в безопасности!');
  };

  return (
    <View style={styles.container}>
      {/* Reveal toggle */}
      <TouchableOpacity
        style={[styles.revealBtn, { backgroundColor: colors.grey_200 }]}
        onPress={() => setIsRevealed((v) => !v)}
      >
        <Ionicons
          name={isRevealed ? 'eye-off' : 'eye'}
          size={18}
          color={colors.label}
        />
        <Text variant="p4-semibold" colorName="label">
          {isRevealed ? 'Скрыть фразу' : 'Показать фразу'}
        </Text>
      </TouchableOpacity>

      {/* 3-column grid */}
      <View style={styles.grid}>
        {[col1, col2, col3].map((col, colIdx) => (
          <View key={colIdx} style={styles.col}>
            {col.map((word, rowIdx) => {
              const index = colIdx * 4 + rowIdx + 1;
              return (
                <View
                  key={index}
                  style={[styles.wordCell, { backgroundColor: colors.grey_100 }]}
                >
                  <Text variant="p4" color="#6B7280" style={styles.wordNum}>
                    {index}.
                  </Text>
                  <Text
                    variant="p4-semibold"
                    color={isRevealed ? colors.text : 'transparent'}
                    style={[
                      styles.wordText,
                      !isRevealed && { textShadowColor: colors.label, textShadowRadius: 6 },
                    ]}
                  >
                    {isRevealed ? word : '••••••'}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* Copy button */}
      {showCopyButton && isRevealed && (
        <TouchableOpacity
          style={[styles.copyBtn, { borderColor: colors.border, borderWidth: 1 }]}
          onPress={handleCopy}
        >
          <Ionicons name="copy-outline" size={16} color={colors.label} />
          <Text variant="p4-semibold" colorName="label">Скопировать фразу</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  col: {
    flex: 1,
    gap: 8,
  },
  wordCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  wordNum: {
    minWidth: 18,
  },
  wordText: {
    flex: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
