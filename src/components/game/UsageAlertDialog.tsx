import { Alert, Button, Dialog, Link, Stack, Text } from "@chakra-ui/react";
import { MdOpenInNew, MdChevronRight } from "react-icons/md";
import { Algorithms, type Algorithm, isUnfair } from "@logic";
import { useSettings } from "@components/state";

type Props = {
	open: boolean;
	onClose: () => void;
	onDismiss: () => void;
};

const unfairMessages: Record<Algorithm, string> = {
	[Algorithms.DISCRETENESS]: "ばらつき重視の場合、連続で試合に入れないメンバーが出てくる可能性が高くなります。",
	[Algorithms.EVENNESS]:
		"均等性重視で、かつコートに入れない余剰メンバーの数が 5 人以上の場合、連続で試合に入れないメンバーが出てくる可能性があります。",
};

const link = `https://www.google.com/search?q=${encodeURIComponent("ダブルス 組み合わせ アプリ")}`;

export function UsageAlertDialog({ open, onClose, onDismiss }: Props) {
	const settings = useSettings();
	const unfair = isUnfair(settings);
	const unfairMessage = unfairMessages[settings.algorithm];

	const handleOk = () => {
		onClose();
	};

	const handleDismiss = () => {
		onDismiss();
		onClose();
	};

	return (
		<Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} size={"full"} scrollBehavior={"inside"}>
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content>
					<Dialog.Header maxH={"xs"} p={0}>
						<Alert.Root status="error">
							<Alert.Indicator />
							<Alert.Title color={"red.800"}>不適切な使い方です</Alert.Title>
						</Alert.Root>
					</Dialog.Header>
					<Dialog.Body pb={4}>
						<Stack w={"100%"}>
							<Text>
								前回の組み合わせを決定してからほとんど時間が経過していません。試合が終わる前に連続で組み合わせを決定しようとしていませんか？
							</Text>
							<Text>連続で試合を決定すると途中参加や途中離脱ができません。</Text>
							{unfair && (
								<Text fontSize={"lg"} color={"red.500"}>
									さらに、プレイ回数の公平性が保証できなくなるため、連続での組み合わせ決定はやらないことを強くお勧めします。
								</Text>
							)}
							{unfair && <Text>{unfairMessage}</Text>}
							<Text>もしどうしても連続で組み合わせを決定したい場合は、他のアプリの利用を検討してください。</Text>
							<Link href={link} target="_blank" rel="noopener noreferrer">
								検索 <MdChevronRight style={{ display: "inline", marginLeft: "2px", marginRight: "2px" }} /> ダブルス
								組み合わせ アプリ <MdOpenInNew style={{ display: "inline", marginLeft: "2px", marginRight: "2px" }} />
							</Link>
						</Stack>
					</Dialog.Body>
					<Dialog.Footer>
						<Stack w={"100%"} gap={10}>
							<Button colorPalette="primary" size={"lg"} onClick={handleOk}>
								組み合わせ決定をやめる
							</Button>
							<Button size={"xs"} fontSize={"xs"} variant={"ghost"} color={"gray.300"} onClick={handleDismiss}>
								テスト目的のためリスクを許容します
							</Button>
						</Stack>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	);
}
