import { Container } from "@chakra-ui/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { settingsAtom, previousSettingsAtom, useResetAll } from "./state/index.ts";
import { array, type Algorithm } from "@logic";
import GamePane from "@components/game/GamePane";
import InitialSettingPane from "@components/setting/InitialSettingPane";

export default function Main() {
	const [settings, setSettings] = useAtom(settingsAtom);
	const previousSettings = useAtomValue(previousSettingsAtom);
	const setPreviousSettings = useSetAtom(previousSettingsAtom);

	const onStart = ({
		courtCount,
		memberCount,
		algorithm,
	}: {
		courtCount: number;
		memberCount: number;
		algorithm: Algorithm;
	}) => {
		const members = array.generate(memberCount);
		const settings = {
			courtCount,
			members,
			histories: [],
			gameCounts: {},
			algorithm,
		};
		setSettings(settings);
		setPreviousSettings(settings);
	};

	const onReset = useResetAll();

	return (
		<Container w="100%" maxW="480px" mx="auto" p={0} centerContent pb="env(safe-area-inset-bottom)">
			{settings.courtCount === 0 && <InitialSettingPane previousSettings={previousSettings} onStart={onStart} />}
			{settings.courtCount !== 0 && <GamePane onReset={onReset} />}
		</Container>
	);
}
