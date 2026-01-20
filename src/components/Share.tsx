import { Container } from "@chakra-ui/react";
import SharedPane from "./shared/SharedPane.tsx";

export default function Share({ sharedId }: { sharedId: string }) {
	return (
		<Container maxW={"sm"} minW={"sm"}>
			<SharedPane sharedId={sharedId} />
		</Container>
	);
}
