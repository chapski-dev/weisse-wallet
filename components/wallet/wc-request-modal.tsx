import { Ionicons } from "@expo/vector-icons";
import type { WalletKitTypes } from "@reown/walletkit";
import React from "react";
import {
	Image,
	Modal,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
} from "react-native";
import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import { Button } from "@/components/ui/shared/Button";
import {
	useWalletConnect,
	type WCRequest,
} from "@/providers/walletconnect-provider";
import { useAppTheme } from "@/theme/theme";

// ─── Session Proposal Modal ───────────────────────────────────────────────────

function ProposalModal({
	proposal,
}: {
	proposal: WalletKitTypes.SessionProposal;
}) {
	const { colors } = useAppTheme();
	const { approveProposal, rejectProposal } = useWalletConnect();

	const { name, description, url, icons } = proposal.params.proposer.metadata;

	return (
		<Box flex backgroundColor={colors.background} px={20} py={32}>
			<Box alignItems="center" mb={24}>
				{icons[0] ? (
					<Image source={{ uri: icons[0] }} style={styles.dappIcon} />
				) : (
					<Box
						w={64}
						h={64}
						borderRadius={32}
						alignItems="center"
						justifyContent="center"
						backgroundColor={colors.grey_200}
					>
						<Ionicons name="globe-outline" size={32} color={colors.label} />
					</Box>
				)}
				<Text variant="h3" center mt={12}>
					{name}
				</Text>
				<Text variant="p3" colorName="label" center mt={4}>
					{url}
				</Text>
				{description ? (
					<Text
						variant="p3"
						colorName="label"
						center
						mt={8}
						style={{ lineHeight: 20 }}
					>
						{description}
					</Text>
				) : null}
			</Box>

			<Box
				borderRadius={12}
				p={16}
				mb={24}
				backgroundColor={colors.grey_100}
				style={{ borderWidth: 1, borderColor: colors.border }}
			>
				<Text variant="p3-semibold" mb={8}>
					Разрешения
				</Text>
				{[
					"Просматривать адрес кошелька",
					"Запрашивать подпись транзакций",
					"Запрашивать подпись сообщений",
				].map((p) => (
					<Box key={p} row gap={8} alignItems="center" mb={6}>
						<Ionicons
							name="checkmark-circle"
							size={16}
							color={colors.success}
						/>
						<Text variant="p3" colorName="label">
							{p}
						</Text>
					</Box>
				))}
			</Box>

			<Box gap={12}>
				<Button onPress={approveProposal}>Подключить</Button>
				<Button type="outline" onPress={rejectProposal}>
					Отклонить
				</Button>
			</Box>
		</Box>
	);
}

// ─── Session Request Modal ────────────────────────────────────────────────────

function RequestModal({ request }: { request: WCRequest }) {
	const { colors } = useAppTheme();
	const { approveRequest, rejectRequest } = useWalletConnect();

	const getMethodLabel = (method: string) => {
		switch (method) {
			case "personal_sign":
			case "eth_sign":
				return "Подписать сообщение";
			case "eth_signTypedData":
			case "eth_signTypedData_v4":
				return "Подписать данные";
			case "eth_sendTransaction":
				return "Отправить транзакцию";
			case "eth_signTransaction":
				return "Подписать транзакцию";
			default:
				return method;
		}
	};

	const getParamsPreview = () => {
		try {
			if (request.method === "personal_sign" || request.method === "eth_sign") {
				const raw = request.params[0] as string;
				// hex → читаемая строка если возможно
				if (raw.startsWith("0x")) {
					try {
						return Buffer.from(raw.slice(2), "hex").toString("utf8");
					} catch {
						return raw;
					}
				}
				return raw;
			}
			return JSON.stringify(request.params, null, 2);
		} catch {
			return String(request.params);
		}
	};

	return (
		<Box flex backgroundColor={colors.background} px={20} py={32}>
			<Box alignItems="center" mb={24}>
				<Box
					w={64}
					h={64}
					borderRadius={32}
					alignItems="center"
					justifyContent="center"
					backgroundColor={colors.primary_700_15}
					mb={12}
				>
					<Ionicons
						name={request.method === "eth_sendTransaction" ? "send" : "pencil"}
						size={28}
						color={colors.primary}
					/>
				</Box>
				<Text variant="h3" center>
					{getMethodLabel(request.method)}
				</Text>
				<Text variant="p3" colorName="label" center mt={4}>
					{request.peerName}
				</Text>
			</Box>

			<Box
				borderRadius={12}
				p={16}
				mb={24}
				backgroundColor={colors.grey_100}
				style={{ borderWidth: 1, borderColor: colors.border, maxHeight: 200 }}
			>
				<Text variant="p3-semibold" mb={8}>
					Данные запроса
				</Text>
				<ScrollView>
					<Text
						variant="p4"
						colorName="label"
						style={{ fontFamily: "monospace", lineHeight: 18 }}
					>
						{getParamsPreview()}
					</Text>
				</ScrollView>
			</Box>

			<Box gap={12}>
				<Button onPress={approveRequest}>Подтвердить</Button>
				<Button type="outline" onPress={rejectRequest}>
					Отклонить
				</Button>
			</Box>
		</Box>
	);
}

// ─── Root Modal ───────────────────────────────────────────────────────────────

export function WCRequestModal() {
	const { pendingProposal, pendingRequest, rejectProposal, rejectRequest } =
		useWalletConnect();

	const visible = !!(pendingProposal || pendingRequest);

	const handleClose = () => {
		if (pendingProposal) rejectProposal();
		else if (pendingRequest) rejectRequest();
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={handleClose}
		>
			{pendingProposal && <ProposalModal proposal={pendingProposal} />}
			{pendingRequest && <RequestModal request={pendingRequest} />}
		</Modal>
	);
}

const styles = StyleSheet.create({
	dappIcon: {
		width: 64,
		height: 64,
		borderRadius: 16,
	},
});
