import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/builders/Text';
import { useAppTheme } from '@/theme/theme';

export default function ExploreScreen() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="h4">Обзор</Text>
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
