import '@/polyfills';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { WCRequestModal } from '@/components/wallet/wc-request-modal';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WalletProvider } from '@/providers/wallet-provider';
import { WalletConnectProvider } from '@/providers/walletconnect-provider';
import { AppDarkTheme, AppLightTheme } from '@/theme/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? AppDarkTheme : AppLightTheme}>
        <WalletProvider>
          <WalletConnectProvider>
            <BottomSheetModalProvider>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "" }} />
                <Stack.Screen name="create-wallet" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="import-wallet" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="send" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="receive" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="add-wallet" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="wc-connect" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="wc-pay" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="earn-detail" options={{ headerShown: false }} />
                <Stack.Screen name="token-detail" options={{ headerShown: false }} />
                <Stack.Screen name="transaction-detail" options={{ headerShown: false }} />
                <Stack.Screen name="nft-detail" options={{ headerShown: false }} />
                <Stack.Screen name="send-nft" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
              <WCRequestModal />
              <StatusBar style="auto" />
            </BottomSheetModalProvider>
          </WalletConnectProvider>
        </WalletProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
