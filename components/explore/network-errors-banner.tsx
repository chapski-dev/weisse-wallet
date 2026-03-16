import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";

interface NetworkError {
	name: string;
	message: string;
}

interface NetworkErrorsBannerProps {
	errors: NetworkError[];
	onRetry: () => void;
}

export function NetworkErrorsBanner({ errors, onRetry }: NetworkErrorsBannerProps) {
	if (!errors.length) return null;

	return (
		<Box
			mx={20}
			mb={12}
			p={12}
			borderRadius={12}
			backgroundColor="#1A0A0A"
			borderWidth={1}
			borderColor="#7F1D1D"
			gap={6}
		>
			<Box row alignItems="center" gap={6}>
				<Ionicons name="warning-outline" size={14} color="#EF4444" />
				<Text variant="caption-medium" color="#EF4444">
					Не удалось загрузить данные
				</Text>
			</Box>
			{errors.map((e) => (
				<Text key={e.name} variant="caption" color="#9CA3AF">
					{e.name}: {e.message}
				</Text>
			))}
			<TouchableOpacity onPress={onRetry} activeOpacity={0.8}>
				<Text variant="caption-medium" color="#3B82F6">
					Повторить
				</Text>
			</TouchableOpacity>
		</Box>
	);
}
