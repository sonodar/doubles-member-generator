import { Container } from "@chakra-ui/react";
import SharedPane from "./shared/SharedPane.tsx";

export default function Share({ sharedId }: { sharedId: string }) {
	return (
		<Container w="100%" maxW="480px" mx="auto" pb="env(safe-area-inset-bottom)">
			<SharedPane sharedId={sharedId} />
		</Container>
	);
}
