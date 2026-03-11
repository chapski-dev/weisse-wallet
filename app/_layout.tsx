import "@/polyfills";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider } from "@react-navigation/native";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { Box, ModalLayout } from "@/components/ui";
import { WCRequestModal } from "@/components/wallet/wc-request-modal";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useWallet, WalletProvider } from "@/providers/wallet-provider";
import { WalletConnectProvider } from "@/providers/walletconnect-provider";
import { AppDarkTheme, AppLightTheme, useAppTheme } from "@/theme/theme";

function RootNavigator() {
	const { colors } = useAppTheme();
	const { isInitializing, isInitialized } = useWallet();

	// Показываем загрузку при начальной проверке кошелька
	if (isInitializing) {
		return (
			<Box flex alignItems="center" justifyContent="center">
				<ActivityIndicator size="large" color={colors.primary} />
			</Box>
		);
	}

	// Основная навигация приложения
	return (
		<WalletConnectProvider>
			<Stack>
				<Stack.Screen name="onboarding" options={{ headerShown: false }} />
				<Stack.Screen
					name="(tabs)"
					options={{ headerShown: false, title: "" }}
				/>
				<Stack.Screen
					name="create-wallet"
					options={{ headerShown: false, presentation: "modal" }}
				/>
				<Stack.Screen
					name="import-wallet"
					options={{ headerShown: false, presentation: "modal" }}
				/>
				<Stack.Screen
					name="send"
					options={{ headerShown: false, presentation: "modal" }}
				/>
				<Stack.Screen
					name="receive"
					options={{ headerShown: false, presentation: "modal" }}
				/>
				<Stack.Screen name="settings" options={{ headerShown: false }} />
				<Stack.Screen
					name="add-wallet"
					options={{ headerShown: false, presentation: "modal" }}
				/>
				<Stack.Screen
					name="wc-connect"
					options={{ headerShown: false, presentation: "modal" }}
				/>
				<Stack.Screen
					name="wc-pay"
					options={{ headerShown: false, presentation: "modal" }}
				/>
				<Stack.Screen name="earn-detail" options={{ headerShown: false }} />
				<Stack.Screen name="token-detail" options={{ headerShown: false }} />
				<Stack.Screen
					name="transaction-detail"
					options={{ headerShown: false }}
				/>
				<Stack.Screen name="nft-detail" options={{ headerShown: false }} />
				<Stack.Screen name="send-nft" options={{ headerShown: false }} />
				<Stack.Screen name="select-asset" options={{ headerShown: false }} />
				<Stack.Screen name="select-network" options={{ headerShown: false }} />
			</Stack>
			{isInitialized ? (
				<Redirect href="/(tabs)" />
			) : (
				<Redirect href="/onboarding" />
			)}
			<WCRequestModal />
		</WalletConnectProvider>
	);
}

export default function RootLayout() {
	const colorScheme = useColorScheme();

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<ThemeProvider
				value={colorScheme === "dark" ? AppDarkTheme : AppLightTheme}
			>
				<BottomSheetModalProvider>
					<WalletProvider>
						<RootNavigator />
						<ModalLayout />
						<StatusBar style="auto" />
					</WalletProvider>
				</BottomSheetModalProvider>
			</ThemeProvider>
		</GestureHandlerRootView>
	);
}
