import { Ionicons } from "@expo/vector-icons";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
	BottomSheetModalProvider,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	TextInput,
} from "react-native";

import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import { ScreenHeader } from "@/components/ui/layouts/ScreenHeader";
import { BottomSlideModal } from "@/components/ui/shared/BottomSlideModal";
import { Button } from "@/components/ui/shared/Button";
import { Input } from "@/components/ui/shared/Input";
import { NETWORKS } from "@/constants/networks";
import { useWallet } from "@/providers/wallet-provider";
import { walletService } from "@/services/wallet-service";
import { useAppTheme } from "@/theme/theme";
import { Network } from "@/types/wallet";

export default function SendScreen() {
	const router = useRouter();
	const { colors, insets } = useAppTheme();
	const { wallet, getActiveNetwork, refreshBalances } = useWallet();
	const { network: networkParam } = useLocalSearchParams<{
		network?: string;
	}>();
	const [recipient, setRecipient] = useState("");
	const [amount, setAmount] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [estimatedFeeEth, setEstimatedFeeEth] = useState<number>(0.0001);
	const [isEstimatingFee, setIsEstimatingFee] = useState(false);
	const previewRef = useRef<BottomSheetModal>(null);

	const activeNetwork = getActiveNetwork(
		(networkParam as Network) ?? Network.ETHEREUM,
	);
	const network = NETWORKS[activeNetwork];
	const account = wallet?.accounts.find((a) => a.network === activeNetwork);

	useEffect(() => {
		if (!account || !network.isEVM) return;
		if (!recipient || !amount || Number(amount) <= 0) return;
		if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) return;

		const timer = setTimeout(async () => {
			setIsEstimatingFee(true);
			try {
				const fee = await walletService.estimateEVMFee(
					activeNetwork,
					account.address,
					recipient,
					amount,
				);
				setEstimatedFeeEth(fee);
			} catch {
				// keep previous value
			} finally {
				setIsEstimatingFee(false);
			}
		}, 500);

		return () => clearTimeout(timer);
	}, [recipient, amount, account, activeNetwork, network.isEVM]);

	if (!account) {
		return (
			<Box
				flex
				alignItems="center"
				justifyContent="center"
				backgroundColor={colors.background}
			>
				<Text variant="p3" colorName="label">
					Аккаунт не найден
				</Text>
			</Box>
		);
	}

	const isEVMNetwork = network.isEVM;
	const isStellar =
		activeNetwork === Network.STELLAR ||
		activeNetwork === Network.STELLAR_TESTNET;
	const STELLAR_FEE = 0.00001; // 100 stroops
	const balance = parseFloat(account.balance);
	const canSend = !!recipient && !!amount;
	const feeDisplay = isEVMNetwork
		? isEstimatingFee
			? "..."
			: `~${estimatedFeeEth.toFixed(6)} ${network.symbol}`
		: isStellar
			? `${STELLAR_FEE} ${network.symbol}`
			: null;

	const validateAddress = (address: string) => {
		if (isEVMNetwork) return /^0x[a-fA-F0-9]{40}$/.test(address);
		if (isStellar) return /^G[A-Z2-7]{55}$/.test(address);
		return address.length > 20;
	};

	const handleSend = async () => {
		if (!validateAddress(recipient)) {
			Alert.alert("Ошибка", "Неверный адрес получателя");
			return;
		}
		const amountNum = Number(amount);
		if (Number.isNaN(amountNum) || amountNum <= 0) {
			Alert.alert("Ошибка", "Введите корректную сумму");
			return;
		}
		if (amountNum > balance) {
			Alert.alert("Ошибка", "Недостаточно средств");
			return;
		}

		if (isEVMNetwork && amountNum + estimatedFeeEth > balance) {
			Alert.alert(
				"Ошибка",
				`Недостаточно средств с учётом комиссии сети (~${estimatedFeeEth.toFixed(6)} ${network.symbol})`,
			);
			return;
		}

		previewRef.current?.present();
	};

	const executeSend = async () => {
		previewRef.current?.dismiss();

		if (isStellar) {
			setIsSending(true);
			try {
				const txHash = await walletService.sendStellarTransaction(
					activeNetwork,
					recipient,
					amount,
				);
				Alert.alert(
					"Успешно!",
					`Транзакция отправлена\nHash: ${txHash.slice(0, 16)}...`,
					[
						{
							text: "OK",
							onPress: () => {
								refreshBalances();
								router.back();
							},
						},
					],
				);
			} catch (error: unknown) {
				const msg = error instanceof Error ? error.message : "";
				const friendlyMessage = msg.includes("op_underfunded")
					? "Недостаточно XLM"
					: msg.includes("tx_bad_seq")
						? "Ошибка последовательности. Повторите попытку."
						: msg.includes("not found")
							? "Аккаунт не найден. Пополните баланс (минимум 1 XLM)."
							: "Не удалось отправить транзакцию";
				Alert.alert("Ошибка", friendlyMessage);
			} finally {
				setIsSending(false);
			}
			return;
		}

		if (!isEVMNetwork) {
			Alert.alert(
				"Ошибка",
				"Отправка пока поддерживается только для EVM сетей",
			);
			return;
		}
		setIsSending(true);
		try {
			const txHash = await walletService.sendEVMTransaction(
				activeNetwork,
				recipient,
				amount,
			);
			Alert.alert(
				"Успешно!",
				`Транзакция отправлена\nHash: ${txHash.slice(0, 16)}...`,
				[
					{
						text: "OK",
						onPress: () => {
							refreshBalances();
							router.back();
						},
					},
				],
			);
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : "";
			const friendlyMessage = msg.includes("insufficient funds")
				? "Недостаточно средств для оплаты транзакции с учётом комиссии"
				: msg.includes("rejected") || msg.includes("denied")
					? "Транзакция отклонена"
					: "Не удалось отправить транзакцию";
			Alert.alert("Ошибка", friendlyMessage);
		} finally {
			setIsSending(false);
		}
	};

	if (isSending) {
		return (
			<Box
				flex
				alignItems="center"
				justifyContent="center"
				backgroundColor={colors.background}
			>
				<Box
					w={80}
					h={80}
					borderRadius={40}
					alignItems="center"
					justifyContent="center"
					backgroundColor={colors.primary_700_15}
				>
					<Ionicons name="arrow-up" size={32} color={colors.primary} />
				</Box>
				<Text variant="h4" center color="#fff" mt={20}>
					Отправка...
				</Text>
				<Text variant="p3" colorName="label" center mt={8}>
					Транзакция обрабатывается
				</Text>
			</Box>
		);
	}

	const shortRecipient = recipient
		? `${recipient.slice(0, 8)}...${recipient.slice(-6)}`
		: "";

	return (
		<BottomSheetModalProvider>
			<KeyboardAvoidingView
				style={{ flex: 1, backgroundColor: colors.background }}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
				>
					<ScreenHeader title={`Отправить ${network.symbol}`} />

					{/* Available balance */}
					<Box row justifyContent="center" alignItems="center" my={24}>
						<Text variant="p3" color="#6B7280">
							Доступно:{" "}
						</Text>
						<Text variant="p3-semibold" color="#fff">
							{balance.toFixed(6)} {network.symbol}
						</Text>
					</Box>

					<Box px={20}>
						{/* Recipient */}
						<Box mb={20}>
							<Text variant="p4-semibold" color="#9CA3AF" mb={8}>
								Адрес получателя
							</Text>
							<Input
								value={recipient}
								onChangeText={setRecipient}
								placeholder={
								isEVMNetwork ? "0x..." : isStellar ? "G..." : "Введите адрес"
							}
								autoCapitalize="none"
								autoCorrect={false}
								icon={
									<Ionicons name="qr-code-outline" size={20} color="#6B7280" />
								}
							/>
						</Box>

						{/* Amount */}
						<Box mb={20}>
							<Box
								row
								justifyContent="space-between"
								alignItems="center"
								mb={8}
							>
								<Text variant="p4-semibold" color="#9CA3AF">
									Сумма
								</Text>
								<Box
									px={10}
									py={4}
									borderRadius={6}
									backgroundColor="#1E3A5F"
									onPress={() =>
										setAmount(
											String(
												isEVMNetwork
													? Math.max(0, balance - estimatedFeeEth)
													: isStellar
														? Math.max(0, balance - STELLAR_FEE)
														: balance,
											),
										)
									}
								>
									<Text fontSize={12} fontWeight="700" color={colors.primary}>
										MAX
									</Text>
								</Box>
							</Box>
							<Box
								row
								alignItems="center"
								h={64}
								backgroundColor="#161B22"
								borderRadius={14}
								borderWidth={1}
								borderColor="#30363D"
								overflow="hidden"
							>
								<TextInput
									style={styles.amtInput}
									value={amount}
									onChangeText={(t) => setAmount(t.replace(",", "."))}
									placeholder="0.0"
									placeholderTextColor="#4B5563"
									keyboardType="decimal-pad"
								/>
								<Box
									w={64}
									h="full"
									justifyContent="center"
									alignItems="center"
								>
									<Text variant="p3-semibold" color="#6B7280">
										{network.symbol}
									</Text>
								</Box>
							</Box>
						</Box>

						{/* Fee */}
						{(isEVMNetwork || isStellar) && (
							<Box
								row
								justifyContent="space-between"
								alignItems="center"
								backgroundColor="#0D1117"
								borderRadius={12}
								px={16}
								h={48}
								mb={24}
							>
								<Text variant="p3" color="#6B7280">
									Комиссия сети:
								</Text>
								<Text variant="p3-semibold" color="#9CA3AF">
									{feeDisplay}
								</Text>
							</Box>
						)}

						{/* Send button */}
						<Button
							onPress={handleSend}
							disabled={!canSend || isEstimatingFee}
							icon={
								<Ionicons
									name="send"
									size={20}
									color={canSend ? "#fff" : undefined}
								/>
							}
							buttonStyle={{ height: 56, borderRadius: 16 }}
						>
							Отправить
						</Button>

						{/* Non-EVM warning */}
						{!isEVMNetwork && !isStellar && (
							<Box
								row
								alignItems="center"
								gap={8}
								backgroundColor="#1C1405"
								borderRadius={12}
								borderWidth={1}
								borderColor="#78350F"
								p={12}
								mt={16}
							>
								<Ionicons name="warning" size={16} color="#F59E0B" />
								<Text variant="p4" color="#D97706" flex={1}>
									Отправка для {network.name} находится в разработке
								</Text>
							</Box>
						)}
					</Box>
				</ScrollView>
			</KeyboardAvoidingView>

			{/* Transaction preview bottom sheet */}
			<BottomSlideModal ref={previewRef} snapPoints={["50%"]}>
				<BottomSheetView style={styles.preview}>
					<Text variant="h4" center color="#fff" mb={24}>
						Подтверждение
					</Text>

					{/* Recipient row */}
					<Box row justifyContent="space-between" alignItems="center" mb={12}>
						<Text variant="p3" color="#6B7280">
							Получатель
						</Text>
						<Text variant="p3-semibold" color="#fff">
							{shortRecipient}
						</Text>
					</Box>

					{/* Amount row */}
					<Box row justifyContent="space-between" alignItems="center" mb={12}>
						<Text variant="p3" color="#6B7280">
							Сумма
						</Text>
						<Text variant="p3-semibold" color="#fff">
							{amount} {network.symbol}
						</Text>
					</Box>

					{/* Network row */}
					<Box row justifyContent="space-between" alignItems="center" mb={12}>
						<Text variant="p3" color="#6B7280">
							Сеть
						</Text>
						<Text variant="p3-semibold" color="#fff">
							{network.name}
						</Text>
					</Box>

					{/* Fee row */}
					{feeDisplay && (
						<Box row justifyContent="space-between" alignItems="center" mb={20}>
							<Text variant="p3" color="#6B7280">
								Комиссия
							</Text>
							<Text variant="p3-semibold" color="#9CA3AF">
								{feeDisplay}
							</Text>
						</Box>
					)}

					<Box h={1} backgroundColor="#30363D" mb={20} />

					<Button
						onPress={executeSend}
						icon={<Ionicons name="send" size={20} color="#fff" />}
						buttonStyle={{ height: 56, borderRadius: 16 }}
					>
						Подтвердить и отправить
					</Button>

					<Box
						mt={12}
						h={48}
						borderRadius={14}
						borderWidth={1}
						borderColor="#30363D"
						alignItems="center"
						justifyContent="center"
						onPress={() => previewRef.current?.dismiss()}
					>
						<Text variant="p3-semibold" color="#6B7280">
							Отмена
						</Text>
					</Box>
				</BottomSheetView>
			</BottomSlideModal>
		</BottomSheetModalProvider>
	);
}

const styles = StyleSheet.create({
	amtInput: {
		flex: 1,
		paddingHorizontal: 16,
		color: "#fff",
		fontSize: 28,
		fontWeight: "600",
	},
	preview: {
		paddingHorizontal: 24,
		paddingTop: 8,
		paddingBottom: 32,
	},
});
