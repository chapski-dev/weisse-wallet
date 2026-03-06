import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/builders/Text';
import { useAppTheme } from '@/theme/theme';

export default function HistoryScreen() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="h4" colorName="label">История транзакций</Text>
      <Text variant="p3" colorName="label" center mt={8}>Пока пусто</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
