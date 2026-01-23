import logo from "@assets/logo.svg";
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
import HelpButton from "@components/common/HelpButton.tsx";
import { type Algorithm, Algorithms, COURT_CAPACITY, type CurrentSettings } from "@logic";
import { useState } from "react";
import { GiTennisCourt } from "react-icons/gi";
import { ImGithub } from "react-icons/im";
import { MdArrowForward } from "react-icons/md";
import { AlgorithmInput } from "./AlgorithmInput";
import { CourtCountInput } from "./CourtCountInput";
import { InitMemberCountInput } from "./InitMemberCountInput";

type Props = {
	previousSettings: CurrentSettings | null;
	onStart: (env: {
		courtCount: number;
		memberCount: number;
		algorithm: Algorithm;
	}) => void;
};

export default function InitialSettingPane({ previousSettings, onStart }: Props) {
	const [courtCount, setCourtCount] = useState(previousSettings?.courtCount || 2);
	const [memberCount, setMemberCount] = useState(previousSettings?.members.length || 2 * COURT_CAPACITY);
	const [algorithm, setAlgorithm] = useState<Algorithm>(previousSettings?.algorithm || Algorithms.DISCRETENESS);

	const onChangeCourtCount = (courtCount: number) => {
		setCourtCount(courtCount);
		if (memberCount < courtCount * COURT_CAPACITY) {
			setMemberCount(courtCount * COURT_CAPACITY);
		}
	};

	return (
		<Card.Root w="100%" height={"100dvh"} borderWidth={0} boxShadow="none">
			<Card.Body p={6}>
				<Center>
					<Stack gap={5} w="100%">
						<HStack>
							<Image src={logo} boxSize="24px" borderRadius={"md"} />
							<Heading as="h1" size="sm">
								ダブルスメンバー決めるくん
							</Heading>
						</HStack>
						<Heading as="h2" size="2xl">
							初期設定
						</Heading>
						<HStack gap={0}>
							<Heading as="h3" size="lg">
								コート数
							</Heading>
							<Text fontSize="md">（後から変更不可）</Text>
						</HStack>
						<CourtCountInput value={courtCount} onChange={onChangeCourtCount} />
						<Heading as="h3" size="lg">
							メンバー数
						</Heading>
						<InitMemberCountInput min={courtCount * COURT_CAPACITY} value={memberCount} onChange={setMemberCount} />
						<HStack>
							<Heading as="h3" size="lg">
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
								<IconButton aria-label={"github"} variant="ghost" bg="gray.100" color="gray.800">
									<ImGithub />
								</IconButton>
							</Link>
							<Spacer />
							<Button
								colorPalette={"brand"}
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
