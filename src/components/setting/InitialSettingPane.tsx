import { MdArrowForward } from "react-icons/md";
import {
	Button,
	Card,
	Center,
	Flex,
	HStack,
	Heading,
	IconButton,
	Image,
	Link,
	Separator,
	Spacer,
	Stack,
	Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { GiTennisCourt } from "react-icons/gi";
import { ImGithub } from "react-icons/im";
import { AlgorithmInput } from "./AlgorithmInput";
import { InitMemberCountInput } from "./InitMemberCountInput";
import { CourtCountInput } from "./CourtCountInput";
import { COURT_CAPACITY, type Algorithm, Algorithms } from "@logic";
import logo from "@assets/logo.svg";
import HelpButton from "@components/common/HelpButton.tsx";
import { getPreviousSettings } from "@components/state";

type Props = {
	onStart: (env: {
		courtCount: number;
		memberCount: number;
		algorithm: Algorithm;
	}) => void;
};

export default function InitialSettingPane({ onStart }: Props) {
	const initialSettings = getPreviousSettings();

	const [courtCount, setCourtCount] = useState(2);
	const [memberCount, setMemberCount] = useState(2 * COURT_CAPACITY);
	const [algorithm, setAlgorithm] = useState<Algorithm>(Algorithms.DISCRETENESS);

	useEffect(() => {
		setCourtCount(initialSettings?.courtCount || 2);
		setMemberCount(initialSettings?.members.length || 2 * COURT_CAPACITY);
		setAlgorithm(initialSettings?.algorithm || Algorithms.DISCRETENESS);
	}, [initialSettings]);

	const onChangeCourtCount = (courtCount: number) => {
		setCourtCount(courtCount);
		if (memberCount < courtCount * COURT_CAPACITY) {
			setMemberCount(courtCount * COURT_CAPACITY);
		}
	};

	return (
		<Card.Root m={0} p={0} height={"100dvh"}>
			<Card.Body p={0} pt={6}>
				<Center>
					<Stack gap={6}>
						<HStack>
							<Image src={logo} boxSize="24px" borderRadius={"md"} />
							<Heading as="h1" size="sm">
								ダブルスメンバー決めるくん
							</Heading>
						</HStack>
						<Heading as="h2" size="lg">
							初期設定
						</Heading>
						<HStack gap={0}>
							<Heading as="h3" size="md">
								コート数
							</Heading>
							<Text fontSize="md">（後から変更不可）</Text>
						</HStack>
						<CourtCountInput value={courtCount} onChange={onChangeCourtCount} />
						<Heading as="h3" size="md">
							メンバー数
						</Heading>
						<InitMemberCountInput min={courtCount * COURT_CAPACITY} value={memberCount} onChange={setMemberCount} />
						<HStack>
							<Heading as="h3" size="md">
								アルゴリズム
							</Heading>
							<HelpButton title={"アルゴリズム"} items={["algorithm"]} />
						</HStack>
						<AlgorithmInput value={algorithm} onChange={setAlgorithm} />
						<Separator />
						<Flex>
							<Link
								target="_blank"
								rel="noopener noreferrer"
								href={"https://github.com/sonodar/doubles-member-generator"}
							>
								<IconButton aria-label={"github"}>
									<ImGithub />
								</IconButton>
							</Link>
							<Spacer />
							<Button
								colorScheme={"brand"}
								variant="outline"
								onClick={() =>
									onStart({
										courtCount,
										memberCount,
										algorithm,
									})
								}
							>
								<GiTennisCourt />
								開始
								<MdArrowForward />
							</Button>
						</Flex>
					</Stack>
				</Center>
			</Card.Body>
		</Card.Root>
	);
}
