import { Alert, Button, HStack } from "@chakra-ui/react";
import type { PushSubscriptionStatus } from "../../hooks";

interface NotificationBannerProps {
	status: PushSubscriptionStatus;
	isSubscribing: boolean;
	onSubscribe: () => Promise<void>;
	onDismiss: () => void;
}

export function NotificationBanner({ status, isSubscribing, onSubscribe, onDismiss }: NotificationBannerProps) {
	// 表示条件: permission-needed または ready の場合のみ表示
	if (status !== "permission-needed" && status !== "ready") {
		return null;
	}

	return (
		<Alert.Root status="info" mb={2} data-testid="notification-banner">
			<Alert.Indicator />
			<Alert.Content flex={1}>
				<Alert.Title>組み合わせが決定したら通知を受け取れます</Alert.Title>
			</Alert.Content>
			<HStack gap={2}>
				<Button size="sm" variant="outline" onClick={onDismiss} disabled={isSubscribing}>
					後で
				</Button>
				<Button size="sm" colorPalette="brand" onClick={onSubscribe} disabled={isSubscribing}>
					通知を受け取る
				</Button>
			</HStack>
		</Alert.Root>
	);
}
