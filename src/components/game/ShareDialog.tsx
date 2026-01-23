import { Button, Center, CloseButton, Dialog, Heading, Input, Spacer, Stack } from "@chakra-ui/react";
import { MdContentCopy } from "react-icons/md";
import LineShareButton from "../common/LineShareButton.tsx";
import { toaster } from "../theme.ts";

type Props = {
	open: boolean;
	onClose: () => void;
	value?: string;
};

export function ShareDialog({ open, onClose, value }: Props) {
	const handleCopy = () => {
		if (value) {
			navigator.clipboard.writeText(value);
			toaster.create({
				title: "コピーしました",
				type: "info",
				duration: 2000,
			});
			onClose();
		}
	};

	return (
		<Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} scrollBehavior={"inside"}>
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content maxW="min(90dvw, 480px)">
					<Dialog.Header maxH={"xs"}>
						<Heading as={"label"} size={"md"}>
							リアルタイム共有
						</Heading>
					</Dialog.Header>
					<Dialog.CloseTrigger asChild>
						<CloseButton size="sm" />
					</Dialog.CloseTrigger>
					<Dialog.Body pb={4}>
						<Center>
							<Stack w={"100%"}>
								<Input px={1} value={value} readOnly={true} />
								<Center>
									<LineShareButton url={value} />
									<Spacer />
									<Button size={"xs"} w={"7rem"} onClick={handleCopy}>
										<MdContentCopy />
										URLコピー
									</Button>
								</Center>
							</Stack>
						</Center>
					</Dialog.Body>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	);
}
