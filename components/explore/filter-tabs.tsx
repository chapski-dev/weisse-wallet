import { TouchableOpacity } from "react-native";

import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";

import { FILTER_TABS, type TxFilter } from "./tx-utils";

interface FilterTabsProps {
	value: TxFilter;
	onChange: (filter: TxFilter) => void;
}

export function FilterTabs({ value, onChange }: FilterTabsProps) {
	return (
		<Box row px={20} gap={8} mt={8} mb={12}>
			{FILTER_TABS.map((tab) => {
				const isActive = tab.id === value;
				return (
					<TouchableOpacity
						key={tab.id}
						onPress={() => onChange(tab.id)}
						activeOpacity={0.8}
					>
						<Box
							h={36}
							px={18}
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
								{tab.label}
							</Text>
						</Box>
					</TouchableOpacity>
				);
			})}
		</Box>
	);
}
