import '@/polyfills';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { WalletProvider } from '@/providers/wallet-provider';
import { AppDarkTheme, AppLightTheme } from '@/theme/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? AppDarkTheme : AppLightTheme}>
        <WalletProvider>
          <BottomSheetModalProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="create-wallet" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="import-wallet" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="send" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="receive" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="add-wallet" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="auto" />
          </BottomSheetModalProvider>
        </WalletProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
