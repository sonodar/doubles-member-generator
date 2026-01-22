import { Button, Dialog } from "@chakra-ui/react";
import { useRef, type ReactNode } from "react";
import { prettyFont } from "../theme.ts";

type Props = {
	open: boolean;
	onCancel: () => void;
	onOk: () => void;
	title: string;
	children: ReactNode;
	okButtonText?: string;
	okColorScheme?: string;
	cancelButtonText?: string;
} & Record<string, unknown>;

export default function ConfirmDialog({
	open,
	onCancel,
	onOk,
	title,
	children,
	cancelButtonText = "キャンセル",
	okButtonText = "OK",
	okColorScheme = "brand",
	...attrs
}: Props) {
	const cancel = useRef<HTMLButtonElement | null>(null);
	return (
		<Dialog.Root
			open={open}
			onOpenChange={(e) => !e.open && onCancel()}
			initialFocusEl={() => cancel.current}
			role="alertdialog"
		>
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content maxW={"350px"}>
					<Dialog.Header fontSize="lg" fontWeight="bold" {...prettyFont}>
						{title}
					</Dialog.Header>
					<Dialog.Body {...attrs}>{children}</Dialog.Body>
					<Dialog.Footer>
						<Button ref={cancel} onClick={onCancel} variant={"outline"}>
							{cancelButtonText}
						</Button>
						<Button colorScheme={okColorScheme} onClick={onOk} ml={3}>
							{okButtonText}
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	);
}
