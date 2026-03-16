import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity } from "react-native";

import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import { Button } from "@/components/ui/shared/Button";
import { useWalletConnect } from "@/providers/walletconnect-provider";
import { isPaymentLink } from "@/services/walletconnect-service";
import { useAppTheme } from "@/theme/theme";

type Mode = "scanner" | "paste";

export default function WCConnectScreen() {
	const router = useRouter();
	const { colors, insets } = useAppTheme();
	const { pair } = useWalletConnect();

	const [mode, setMode] = useState<Mode>("scanner");
	const [permission, requestPermission] = useCameraPermissions();
	const [uri, setUri] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const scanned = useRef(false);

	const processUri = async (raw: string) => {
		const trimmed = raw.trim();

		if (isPaymentLink(trimmed)) {
			router.replace({ pathname: "/wc-pay", params: { paymentLink: trimmed } });
			return;
		}

		if (!trimmed.startsWith("wc:")) {
			setError(
				'Неверный формат. URI должен начинаться с "wc:" или быть ссылкой WalletConnect Pay',
			);
			return;
		}

		setError("");
		setLoading(true);
		try {
			await pair(trimmed);
			router.back();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Ошибка подключения");
			scanned.current = false;
		} finally {
			setLoading(false);
		}
	};

	const handleBarCodeScanned = ({ data }: { data: string }) => {
		if (scanned.current) return;
		scanned.current = true;
		processUri(data);
	};

	const handlePaste = async () => {
		const text = await Clipboard.getStringAsync();
		if (text) setUri(text);
	};

	// ─── Scanner mode ────────────────────────────────────────────────────────────

	const renderScanner = () => {
		if (!permission) {
			return (
				<Box flex alignItems="center" justifyContent="center">
					<Text variant="p2" colorName="label">
						Загрузка...
					</Text>
				</Box>
			);
		}

		if (!permission.granted) {
			return (
				<Box flex alignItems="center" justifyContent="center" gap={16} px={32}>
					<Ionicons name="camera-outline" size={64} color={colors.label} />
					<Text variant="h4" center>
						Нужен доступ к камере
					</Text>
					<Text variant="p3" center colorName="label">
						Для сканирования QR-кода требуется разрешение на использование
						камеры
					</Text>
					<Button onPress={requestPermission}>Разрешить</Button>
				</Box>
			);
		}

		return (
			<Box flex>
				<CameraView
					style={StyleSheet.absoluteFillObject}
					facing="back"
					barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
					onBarcodeScanned={handleBarCodeScanned}
				/>

				{/* Затемнение + рамка */}
				<Box style={styles.overlay}>
					<Box style={[styles.frame, { borderColor: colors.primary }]}>
						{/* Уголки */}
						{(["tl", "tr", "bl", "br"] as const).map((pos) => (
							<Box
								key={pos}
								style={[
									styles.corner,
									styles[pos],
									{ borderColor: colors.primary },
								]}
							/>
						))}
					</Box>
					<Text variant="p3" color="#fff" center mt={24}>
						Наведите камеру на QR-код WalletConnect
					</Text>
				</Box>

				{loading && (
					<Box
						style={styles.loadingOverlay}
						alignItems="center"
						justifyContent="center"
					>
						<Box
							px={24}
							py={16}
							borderRadius={12}
							backgroundColor={colors.card}
						>
							<Text variant="p2" colorName="label">
								Подключение...
							</Text>
						</Box>
					</Box>
				)}

				{error ? (
					<Box
						style={styles.errorBanner}
						px={20}
						py={12}
						backgroundColor={colors.error}
					>
						<Text variant="p3" color="#fff" center>
							{error}
						</Text>
						<TouchableOpacity
							onPress={() => {
								setError("");
								scanned.current = false;
							}}
						>
							<Text variant="p3-semibold" color="#fff" center mt={4}>
								Попробовать снова
							</Text>
						</TouchableOpacity>
					</Box>
				) : null}
			</Box>
		);
	};

	// ─── Paste mode ──────────────────────────────────────────────────────────────

	const renderPaste = () => (
		<Box flex px={20} pt={8}>
			<Box
				borderRadius={12}
				style={{
					borderWidth: 1,
					borderColor: error ? colors.error : colors.border,
				}}
				mb={error ? 8 : 16}
				backgroundColor={colors.card}
			>
				<Box row alignItems="center" px={16} py={4}>
					<TextInput
						style={[styles.input, { color: colors.text, flex: 1 }]}
						placeholder="wc:... или https://pay.walletconnect.com/?pid=..."
						placeholderTextColor={colors.label}
						value={uri}
						onChangeText={(t) => {
							setUri(t);
							setError("");
						}}
						multiline
						numberOfLines={3}
						autoCapitalize="none"
						autoCorrect={false}
						autoFocus
					/>
					<TouchableOpacity onPress={handlePaste} style={styles.pasteBtn}>
						<Ionicons
							name="clipboard-outline"
							size={22}
							color={colors.primary}
						/>
					</TouchableOpacity>
				</Box>
			</Box>

			{error ? (
				<Text variant="p3" color={colors.error} mb={16}>
					{error}
				</Text>
			) : null}

			<Button
				onPress={() => processUri(uri)}
				disabled={!uri.trim() || loading}
				loading={loading}
			>
				Подключить
			</Button>
		</Box>
	);

	// ─── Layout ──────────────────────────────────────────────────────────────────

	return (
		<Box flex backgroundColor={colors.background}>
			{/* Header */}
			<Box
				row
				alignItems="center"
				justifyContent="space-between"
				px={20}
				pb={12}
				style={{ paddingTop: insets.top + 16 }}
			>
				<Box row alignItems="center" gap={12}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={[styles.iconBtn, { backgroundColor: colors.grey_200 }]}
					>
						<Ionicons name="arrow-back" size={20} color={colors.text} />
					</TouchableOpacity>
					<Text variant="h3">Подключить dApp</Text>
				</Box>

				{/* Переключатель режима */}
				<TouchableOpacity
					onPress={() => {
						setMode(mode === "scanner" ? "paste" : "scanner");
						setError("");
						scanned.current = false;
					}}
					style={[styles.iconBtn, { backgroundColor: colors.grey_200 }]}
				>
					<Ionicons
						name={mode === "scanner" ? "text-outline" : "qr-code-outline"}
						size={20}
						color={colors.text}
					/>
				</TouchableOpacity>
			</Box>

			{mode === "scanner" ? renderScanner() : renderPaste()}

			{/* Подсказка снизу в режиме сканера */}
			{mode === "scanner" && !loading && !error && (
				<Box px={20} pb={insets.bottom + 16} pt={12} alignItems="center">
					<TouchableOpacity onPress={() => setMode("paste")}>
						<Text variant="p3" colorName="label">
							Нет QR-кода?{" "}
							<Text variant="p3-semibold" color={colors.primary}>
								Вставить URI
							</Text>
						</Text>
					</TouchableOpacity>
				</Box>
			)}
		</Box>
	);
}

const FRAME_SIZE = 240;
const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
	iconBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "#00000088",
		alignItems: "center",
		justifyContent: "center",
	},
	frame: {
		width: FRAME_SIZE,
		height: FRAME_SIZE,
		borderRadius: 16,
		backgroundColor: "transparent",
	},
	corner: {
		position: "absolute",
		width: CORNER_SIZE,
		height: CORNER_SIZE,
		borderWidth: CORNER_WIDTH,
	},
	tl: {
		top: 0,
		left: 0,
		borderRightWidth: 0,
		borderBottomWidth: 0,
		borderTopLeftRadius: 16,
	},
	tr: {
		top: 0,
		right: 0,
		borderLeftWidth: 0,
		borderBottomWidth: 0,
		borderTopRightRadius: 16,
	},
	bl: {
		bottom: 0,
		left: 0,
		borderRightWidth: 0,
		borderTopWidth: 0,
		borderBottomLeftRadius: 16,
	},
	br: {
		bottom: 0,
		right: 0,
		borderLeftWidth: 0,
		borderTopWidth: 0,
		borderBottomRightRadius: 16,
	},
	loadingOverlay: {
		...StyleSheet.absoluteFillObject,
	},
	errorBanner: {
		position: "absolute",
		bottom: 80,
		left: 20,
		right: 20,
		borderRadius: 12,
	},
	input: {
		fontSize: 13,
		fontFamily: "monospace",
		paddingVertical: 12,
		minHeight: 70,
		textAlignVertical: "top",
	},
	pasteBtn: {
		padding: 8,
		marginLeft: 4,
	},
});
