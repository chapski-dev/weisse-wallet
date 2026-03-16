import { useState } from "react";
import { Image } from "react-native";

import { Box } from "@/components/ui/builders/Box";
import { Text } from "@/components/ui/builders/Text";
import { getNetworkIconUrl, getTokenIconUrl } from "@/constants/tokens";
import type { Network } from "@/types/wallet";

interface TokenIconProps {
	symbol: string;
	networkId?: Network;
	size?: number;
}

export function TokenIcon({ symbol, networkId, size = 36 }: TokenIconProps) {
	const [failed, setFailed] = useState(false);
	const iconUrl =
		(networkId ? getNetworkIconUrl(networkId) : undefined) ??
		getTokenIconUrl(symbol);

	const radius = size / 2;

	if (!iconUrl || failed) {
		return (
			<Box
				w={size}
				h={size}
				borderRadius={radius}
				backgroundColor="#1F2937"
				alignItems="center"
				justifyContent="center"
			>
				<Text color="#9CA3AF" fontSize={size * 0.3} fontWeight="600">
					{symbol.slice(0, 3).toUpperCase()}
				</Text>
			</Box>
		);
	}

	return (
		<Image
			source={{ uri: iconUrl }}
			style={{ width: size, height: size, borderRadius: radius }}
			onError={() => setFailed(true)}
		/>
	);
}
