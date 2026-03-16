import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Image,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
} from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { privateKeyToAccount } from "viem/accounts";

import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import { Button } from "@/components/ui/shared/Button";
import { walletService } from "@/services/wallet-service";
import { walletConnectService } from "@/services/walletconnect-service";
import { useAppTheme } from "@/theme/theme";
import { Network } from "@/types/wallet";

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentOption = {
	id: string;
	amount: {
		unit: string;
		value: string;
		display: {
			assetSymbol: string;
			assetName: string;
			decimals: number;
			iconUrl?: string;
			networkName?: string;
		};
	};
	etaS: number;
	actions: Array<{
		walletRpc?: {
			chainId: string;
			method: string;
			params: string;
		};
	}>;
	collectData?: { url: string; schema?: string };
};

type PaymentInfo = {
	merchant?: { name?: string; iconUrl?: string };
};

type PaymentOptionsResponse = {
	paymentId: string;
	options: PaymentOption[];
	info?: PaymentInfo;
	resultInfo?: { txId: string };
};

type Step =
	| "loading"
	| "confirm"
	| "webview"
	| "confirming"
	| "success"
	| "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(option: PaymentOption): string {
	const { value, display } = option.amount;
	const { decimals, assetSymbol } = display;
	try {
		const num = BigInt(value);
		const divisor = BigInt(10 ** decimals);
		const int = num / divisor;
		const frac = num % divisor;
		if (frac === 0n) return `${int} ${assetSymbol}`;
		const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
		return `${int}.${fracStr} ${assetSymbol}`;
	} catch {
		return `${value} ${assetSymbol}`;
	}
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WCPayScreen() {
	const router = useRouter();
	const { colors, insets } = useAppTheme();
	const { paymentLink } = useLocalSearchParams<{ paymentLink: string }>();

	const [step, setStep] = useState<Step>("loading");
	const [errorMessage, setErrorMessage] = useState("");
	const [paymentData, setPaymentData] = useState<PaymentOptionsResponse | null>(
		null,
	);
	const [selectedOption, setSelectedOption] = useState<PaymentOption | null>(
		null,
	);
	const [webViewUrl, setWebViewUrl] = useState("");

	// Загружаем варианты оплаты
	useEffect(() => {
		if (!paymentLink) return;

		(async () => {
			try {
				const { privateKey } = await walletService.getEVMWallet(
					Network.ETHEREUM,
				);
				const account = privateKeyToAccount(privateKey);
				// Base (8453) — основная цепь для Pay
				const accounts = [`eip155:8453:${account.address}`];

				const data = (await walletConnectService.getPaymentOptions(
					paymentLink,
					accounts,
				)) as PaymentOptionsResponse;

				// Если оплата уже завершена
				if (data.resultInfo) {
					setStep("success");
					return;
				}

				setPaymentData(data);
				setSelectedOption(data.options[0] ?? null);
				setStep("confirm");
			} catch (e: unknown) {
				setErrorMessage(
					e instanceof Error ? e.message : "Ошибка загрузки вариантов оплаты",
				);
				setStep("error");
			}
		})();
	}, [paymentLink]);

	const executePayment = useCallback(async () => {
		if (!paymentData || !selectedOption) return;
		setStep("confirming");

		try {
			const { privateKey } = await walletService.getEVMWallet(Network.ETHEREUM);
			const account = privateKeyToAccount(privateKey);
			const signatures: string[] = [];

			const actions = (await walletConnectService.getRequiredPaymentActions(
				paymentData.paymentId,
				selectedOption.id,
			)) as typeof selectedOption.actions;

			for (const action of actions) {
				if (!action.walletRpc) continue;
				const { method, params } = action.walletRpc;
				const parsedParams = JSON.parse(params);

				if (
					method === "eth_signTypedData_v4" ||
					method === "eth_signTypedData_v3" ||
					method === "eth_signTypedData"
				) {
					const typedDataString = parsedParams[1] as string;
					const typedData = JSON.parse(typedDataString);
					const { domain, types, primaryType, message } = typedData;

					// chainId может быть hex строкой
					if (domain.chainId && typeof domain.chainId === "string") {
						domain.chainId = parseInt(domain.chainId, 16);
					}

					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { EIP712Domain: _, ...filteredTypes } = types;

					const sig = await account.signTypedData({
						domain,
						types: filteredTypes,
						primaryType,
						message,
					});
					signatures.push(sig);
				}
			}

			await walletConnectService.confirmPayment(
				paymentData.paymentId,
				selectedOption.id,
				signatures,
			);

			setStep("success");
		} catch (e: unknown) {
			setErrorMessage(
				e instanceof Error ? e.message : "Ошибка при подтверждении оплаты",
			);
			setStep("error");
		}
	}, [paymentData, selectedOption]);

	// Подтвердить оплату
	const handleConfirm = useCallback(async () => {
		if (!paymentData || !selectedOption) return;

		// Если нужно собрать данные через WebView — показываем его
		if (selectedOption.collectData?.url) {
			setWebViewUrl(selectedOption.collectData.url);
			setStep("webview");
			return;
		}

		await executePayment();
	}, [paymentData, selectedOption, executePayment]);

	// WebView сообщение о завершении сбора данных
	const handleWebViewMessage = useCallback(
		(event: WebViewMessageEvent) => {
			try {
				const data = JSON.parse(event.nativeEvent.data);
				if (data.type === "IC_COMPLETE") {
					setStep("confirming");
					executePayment();
				} else if (data.type === "IC_ERROR") {
					setErrorMessage(data.error ?? "Ошибка формы");
					setStep("error");
				}
			} catch {
				// ignore non-JSON
			}
		},
		[executePayment],
	);

	const merchant = paymentData?.info?.merchant;

	// ─── UI ───────────────────────────────────────────────────────────────────

	const renderContent = () => {
		switch (step) {
			case "loading":
				return (
					<Box flex alignItems="center" justifyContent="center" gap={16}>
						<ActivityIndicator size="large" color={colors.primary} />
						<Text variant="p2" colorName="label">
							Загружаем варианты оплаты...
						</Text>
					</Box>
				);

			case "confirm":
				return (
					<ScrollView showsVerticalScrollIndicator={false}>
						{/* Merchant */}
						<Box alignItems="center" mb={24}>
							{merchant?.iconUrl ? (
								<Image
									source={{ uri: merchant.iconUrl }}
									style={styles.merchantIcon}
								/>
							) : (
								<Box
									w={64}
									h={64}
									borderRadius={32}
									alignItems="center"
									justifyContent="center"
									backgroundColor={colors.grey_200}
									mb={12}
								>
									<Ionicons
										name="storefront-outline"
										size={32}
										color={colors.label}
									/>
								</Box>
							)}
							<Text variant="h3" center mt={8}>
								{merchant?.name ?? "Оплата"}
							</Text>
						</Box>

						{/* Варианты оплаты */}
						<Text variant="p3-semibold" mb={8}>
							Выберите вариант оплаты
						</Text>
						{paymentData?.options.map((option) => {
							const isSelected = selectedOption?.id === option.id;
							return (
								<TouchableOpacity
									key={option.id}
									onPress={() => setSelectedOption(option)}
									style={[
										styles.optionRow,
										{
											backgroundColor: isSelected
												? colors.primary_700_15
												: colors.card,
											borderColor: isSelected ? colors.primary : colors.border,
										},
									]}
								>
									{option.amount.display.iconUrl ? (
										<Image
											source={{ uri: option.amount.display.iconUrl }}
											style={styles.tokenIcon}
										/>
									) : (
										<Box
											w={36}
											h={36}
											borderRadius={18}
											backgroundColor={colors.grey_200}
											alignItems="center"
											justifyContent="center"
										>
											<Text variant="p3">
												{option.amount.display.assetSymbol[0]}
											</Text>
										</Box>
									)}
									<Box flex ml={12} gap={2}>
										<Text variant="p2-semibold">{formatAmount(option)}</Text>
										<Text variant="p4" colorName="label">
											{option.amount.display.networkName ??
												option.amount.display.assetName}
											{option.etaS ? ` · ~${Math.ceil(option.etaS)}с` : ""}
										</Text>
									</Box>
									{option.collectData && (
										<Box
											px={6}
											py={2}
											borderRadius={6}
											backgroundColor={colors.warning_500}
										>
											<Text variant="p4-semibold" color="#fff">
												Данные
											</Text>
										</Box>
									)}
									{isSelected && (
										<Ionicons
											name="checkmark-circle"
											size={20}
											color={colors.primary}
											style={{ marginLeft: 8 }}
										/>
									)}
								</TouchableOpacity>
							);
						})}

						<Box mt={24} gap={12}>
							<Button onPress={handleConfirm} disabled={!selectedOption}>
								Оплатить
							</Button>
							<Button type="outline" onPress={() => router.back()}>
								Отмена
							</Button>
						</Box>
					</ScrollView>
				);

			case "webview":
				return (
					<Box flex>
						<Text variant="p3" colorName="label" mb={8}>
							Заполните необходимые данные
						</Text>
						<WebView
							source={{ uri: webViewUrl }}
							onMessage={handleWebViewMessage}
							javaScriptEnabled
							domStorageEnabled
							style={{ flex: 1, borderRadius: 12 }}
						/>
						<Button
							type="outline"
							onPress={() => router.back()}
							wrapperStyle={{ marginTop: 12 }}
						>
							Отмена
						</Button>
					</Box>
				);

			case "confirming":
				return (
					<Box flex alignItems="center" justifyContent="center" gap={16}>
						<ActivityIndicator size="large" color={colors.primary} />
						<Text variant="p2" colorName="label">
							Подтверждаем оплату...
						</Text>
					</Box>
				);

			case "success":
				return (
					<Box flex alignItems="center" justifyContent="center" gap={16}>
						<Box
							w={80}
							h={80}
							borderRadius={40}
							alignItems="center"
							justifyContent="center"
							backgroundColor="#10B98120"
						>
							<Ionicons name="checkmark-circle" size={48} color="#10B981" />
						</Box>
						<Text variant="h3" center>
							Оплата прошла!
						</Text>
						<Text variant="p2" center colorName="label">
							Транзакция успешно подтверждена
						</Text>
						<Button
							onPress={() => router.back()}
							wrapperStyle={{ marginTop: 8 }}
						>
							Готово
						</Button>
					</Box>
				);

			case "error":
				return (
					<Box flex alignItems="center" justifyContent="center" gap={16}>
						<Box
							w={80}
							h={80}
							borderRadius={40}
							alignItems="center"
							justifyContent="center"
							backgroundColor="#EF444420"
						>
							<Ionicons name="close-circle" size={48} color="#EF4444" />
						</Box>
						<Text variant="h3" center>
							Ошибка оплаты
						</Text>
						<Text variant="p2" center colorName="label">
							{errorMessage}
						</Text>
						<Box row gap={12} mt={8}>
							<Box flex>
								<Button type="outline" onPress={() => router.back()}>
									Закрыть
								</Button>
							</Box>
							<Box flex>
								<Button
									onPress={() => {
										setStep("loading");
										setErrorMessage("");
									}}
								>
									Повторить
								</Button>
							</Box>
						</Box>
					</Box>
				);
		}
	};

	return (
		<Box
			flex
			backgroundColor={colors.background}
			px={20}
			pt={insets.top + 16}
			pb={insets.bottom + 24}
		>
			{/* Header */}
			{step !== "confirming" && step !== "success" && (
				<Box row alignItems="center" mb={24} gap={12}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={[styles.backBtn, { backgroundColor: colors.grey_200 }]}
					>
						<Ionicons name="arrow-back" size={20} color={colors.text} />
					</TouchableOpacity>
					<Text variant="h3">WalletConnect Pay</Text>
				</Box>
			)}

			{renderContent()}
		</Box>
	);
}

const styles = StyleSheet.create({
	backBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	merchantIcon: {
		width: 64,
		height: 64,
		borderRadius: 16,
		marginBottom: 12,
	},
	tokenIcon: {
		width: 36,
		height: 36,
		borderRadius: 18,
	},
	optionRow: {
		flexDirection: "row",
		alignItems: "center",
		padding: 14,
		borderRadius: 12,
		borderWidth: 1,
		marginBottom: 8,
	},
});
