import { ScrollView } from "react-native";

import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import type { Network, NetworkInfo } from "@/types/wallet";

interface NetworkFilterProps {
	networks: NetworkInfo[];
	value: Network | "all";
	onChange: (network: Network | "all") => void;
}

export function NetworkFilter({ networks, value, onChange }: NetworkFilterProps) {
	if (networks.length <= 1) return null;

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginBottom: 40 }}
		>
			{[null, ...networks].map((net) => {
				const id = net?.id ?? "all";
				const isActive = value === id;
				const label = net ? `${net.icon} ${net.name}` : "Все сети";
				return (
					<Box
						key={id}
						onPress={() => onChange(id as Network | "all")}
						activeOpacity={0.8}
					>
						<Box
							h={32}
							px={14}
							borderRadius={20}
							alignItems="center"
							justifyContent="center"
							backgroundColor={isActive ? "#3B82F6" : "#161B22"}
							borderWidth={isActive ? 0 : 1}
							borderColor={isActive ? "transparent" : "#30363D"}
						>
							<Text
								variant="p4-semibold"
								color={isActive ? "#fff" : "#9CA3AF"}
							>
								{label}
							</Text>
						</Box>
					</Box>
				);
			})}
		</ScrollView>
	);
}
