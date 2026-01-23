import { AbsoluteCenter, Box, Button, Dialog, Spinner } from "@chakra-ui/react";
import { type ReactNode, useRef } from "react";
import { prettyFont } from "../theme.ts";

type Props = {
	open: boolean;
	onCancel: () => void;
	onOk: () => void;
	title: string;
	children: ReactNode;
	okButtonText?: string;
	okColorPalette?: string;
	cancelButtonText?: string;
	loading?: boolean;
} & Record<string, unknown>;

export default function ConfirmDialog({
	open,
	onCancel,
	onOk,
	title,
	children,
	cancelButtonText = "キャンセル",
	okButtonText = "OK",
	okColorPalette = "brand",
	loading = false,
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
				<Dialog.Content maxW="min(90dvw, 480px)" position="relative">
					{loading && (
						<Box position="absolute" inset={0} bg="whiteAlpha.800" zIndex={10} borderRadius="md">
							<AbsoluteCenter>
								<Spinner size="lg" color="brand.500" />
							</AbsoluteCenter>
						</Box>
					)}
					<Dialog.Header fontSize="lg" fontWeight="bold" {...prettyFont}>
						{title}
					</Dialog.Header>
					<Dialog.Body {...attrs}>{children}</Dialog.Body>
					<Dialog.Footer>
						<Button ref={cancel} onClick={onCancel} variant={"outline"} disabled={loading}>
							{cancelButtonText}
						</Button>
						<Button colorPalette={okColorPalette} onClick={onOk} ml={3} disabled={loading}>
							{okButtonText}
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	);
}
