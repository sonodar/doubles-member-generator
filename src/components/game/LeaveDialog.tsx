import { Button, Dialog, HStack, NativeSelect } from "@chakra-ui/react";
import type React from "react";
import { useState } from "react";

type Props = {
	members: number[];
	open: boolean;
	onClose: () => void;
	onLeave(id: number): void;
};

export function LeaveDialog({ members, open, onClose, onLeave }: Props) {
	const [value, setValue] = useState<number>(0);

	const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setValue(parseInt(e.target.options[e.target.selectedIndex].value, 10));
	};

	const handleLeave = () => {
		if (value !== 0) onLeave(value);
		onClose();
	};

	return (
		<Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} size={"xs"}>
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content maxW="min(80dvw, 480px)">
					<Dialog.Body py={4}>
						<HStack>
							<NativeSelect.Root>
								<NativeSelect.Field placeholder="離脱する番号" onChange={handleSelect}>
									{members.map((id) => (
										<option key={id} value={id}>
											{id}
										</option>
									))}
								</NativeSelect.Field>
							</NativeSelect.Root>
							<Button colorPalette={"brand"} variant={"outline"} size={"sm"} onClick={handleLeave}>
								離脱
							</Button>
						</HStack>
					</Dialog.Body>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	);
}
