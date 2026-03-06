import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/builders/Text';
import { useAppTheme } from '@/theme/theme';

export default function ModalScreen() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="h4">Modal</Text>
      <Link href="/" dismissTo style={styles.link}>
        <Text colorName="primary">На главную</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
