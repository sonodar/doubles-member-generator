import {
  Badge,
  Box,
  Card,
  CardBody,
  CardFooter,
  Center,
  Divider,
  Spacer,
  Stack,
  useToast,
} from "@chakra-ui/react";
import {
  getLatestMembers,
  type CurrentSettings,
  type Algorithm,
} from "@doubles-member-generator/manager";
import React, { useEffect, useRef, useState } from "react";
import {
  createEnvironment,
  eventEmitter,
  finishEnvironment,
} from "@doubles-member-generator/api";
import storage from "../../util/settingsStorage";
import { ShareButton } from "./ShareButton";
import CourtMembersPane from "@components/game/CourtMembersPane";
import { CurrentMemberCountInput } from "@components/game/CurrentMemberCountInput";
import { HistoryButton } from "@components/common/HistoryButton.tsx";
import { MemberButton } from "@components/common/MemberButton.tsx";
import { ResetButton } from "@components/game/ResetButton";
import { useSettings, useSettingsDispatcher } from "@components/state";
import { GenerateButton } from "@components/game/GenerateButton.tsx";

type Props = {
  onReset: () => void;
  shareId?: string | null;
};

const badgeLabels: Record<Algorithm, string> = {
  DISCRETENESS: "ばらつき重視",
  EVENNESS: "均等性重視",
};

export default function GamePane({ onReset, shareId }: Props) {
  const settings = useSettings();
  const dispatcher = useSettingsDispatcher();

  const [environmentId, setEnvironmentId] = useState(shareId || undefined);
  const [progress, setProgress] = useState(false);

  const latestMembers = getLatestMembers(settings) || [];
  const badgeLabel = badgeLabels[settings.algorithm!];

  const openProgress = () => setProgress(true);
  const closeProgress = () => setProgress(false);

  const issueShareLink = async () => {
    openProgress();
    const { id } = await createEnvironment();
    window.localStorage.setItem("shareId", id);
    setEnvironmentId(id);
    await eventEmitter(id).initialize(settings);
    closeProgress();
  };

  useEffect(() => {
    storage.save({ ...settings });
  }, [settings]);

  const handleJoin = () => {
    dispatcher.join();
    if (environmentId) {
      eventEmitter(environmentId).join();
    }
  };

  const handleGenerate = (newSettings: CurrentSettings) => {
    const members = getLatestMembers(newSettings)!;
    dispatcher.generate(members);
    if (environmentId) {
      eventEmitter(environmentId).generate(members);
    }
  };

  const toast = useToast();
  const toastRef = useRef<string | number>();

  const handleLeave = (id: number) => {
    dispatcher.leave(id);
    if (environmentId) {
      eventEmitter(environmentId).leave(id);
    }
    toastRef.current = toast({
      title: `メンバー ${id} が離脱しました`,
      status: "warning",
      duration: 2000,
      isClosable: true,
      colorScheme: "brand",
      variant: "subtle",
    });
  };

  const clear = () => {
    storage.clear();
    window.localStorage.removeItem("shareId");
    if (environmentId) {
      eventEmitter(environmentId).finish();
      finishEnvironment(environmentId);
    }
    onReset();
  };

  return (
    <Card m={0} p={0} height={"100dvh"}>
      <CardBody p={0} pt={3}>
        <Center>
          <Stack spacing={2}>
            <CurrentMemberCountInput
              onIncrement={handleJoin}
              onDecrement={handleLeave}
              isDisabled={progress}
            />
            {badgeLabel && (
              <Center>
                <Badge
                  borderRadius={"md"}
                  w={"80%"}
                  variant="subtle"
                  colorScheme={"brand"}
                >
                  <Center>{badgeLabel}</Center>
                </Badge>
              </Center>
            )}
            <GenerateButton
              settings={settings}
              onGenerate={handleGenerate}
              isDisabled={progress}
            />
            {latestMembers.length > 0 && (
              <Box pt={4}>
                <CourtMembersPane members={latestMembers} />
              </Box>
            )}
          </Stack>
        </Center>
      </CardBody>
      <Divider color={"gray.300"} />
      <CardFooter px={10} py={2}>
        <HistoryButton isDisabled={progress} />
        <Spacer />
        <MemberButton isDisabled={progress} />
        <Spacer />
        <ShareButton
          sharedId={environmentId}
          onIssue={issueShareLink}
          isDisabled={progress}
        />
        <Spacer />
        <ResetButton onReset={clear} isDisabled={progress} />
      </CardFooter>
    </Card>
  );
}
