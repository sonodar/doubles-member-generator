import { MdHelpOutline } from "react-icons/md";
import {
	Button,
	CloseButton,
	Dialog,
	Heading,
	IconButton,
	Separator,
	Stack,
	Text,
	useDisclosure,
} from "@chakra-ui/react";
import { Fragment } from "react";

const Help = {
	algorithm: (
		<Stack gap={4}>
			<Heading as="span" size="md">
				ばらつき重視
			</Heading>
			<Text>
				なるべく似通った面子にならないようにメンバーを選出します。連続での休憩が発生しますが、何度も繰り返しているうちに平準化されていきます。
			</Text>
			<Heading as="span" size="md">
				均等性重視
			</Heading>
			<Text>
				なるべく均等な回数でコートに入れるようにメンバーを選出します。連続での休憩が発生しづらくなりますが、似通った面子になる傾向が強くなります。
			</Text>
		</Stack>
	),
};

type Props = { title?: string; items: (keyof typeof Help)[] };

export default function HelpButton({ title, items }: Props) {
	const { open, onOpen, onClose } = useDisclosure();

	return (
		<Fragment>
			<IconButton rounded="full" variant="ghost" aria-label="Help" size={"xs"} fontSize={"md"} onClick={onOpen}>
				<MdHelpOutline />
			</IconButton>
			<Dialog.Root onOpenChange={(e) => !e.open && onClose()} size={"full"} open={open} scrollBehavior={"inside"}>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content>
						<Dialog.Header>
							<Heading as="h3" size="md">
								{title || "ヘルプ"}
							</Heading>
						</Dialog.Header>
						<Dialog.CloseTrigger asChild>
							<CloseButton size="sm" />
						</Dialog.CloseTrigger>
						<Separator />
						<Dialog.Body mt={2}>
							{items.map((item) => (
								<Stack key={item} gap={4}>
									{Help[item]}
								</Stack>
							))}
						</Dialog.Body>
						<Dialog.Footer>
							<Button onClick={onClose}>閉じる</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Positioner>
			</Dialog.Root>
		</Fragment>
	);
}
