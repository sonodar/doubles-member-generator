import type { CurrentSettings } from "@doubles-member-generator/manager";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Center,
  useDisclosure,
  ModalCloseButton,
} from "@chakra-ui/react";
import React from "react";
import { COURT_CAPACITY } from "@doubles-member-generator/manager";
import { TbUsers } from "react-icons/tb";
import HistoryPane from "@components/common/HistoryPane.tsx";
import MemberCountPane from "@components/common/MemberCountPane.tsx";

export function StatisticsPane({ settings }: { settings: CurrentSettings }) {
  const histories = settings.histories.slice(settings.histories.length - 2);
  const showStatistics =
    settings.members.length > settings.courtCount * COURT_CAPACITY;
  const { onOpen, onClose, isOpen } = useDisclosure();

  return (
    <Stack spacing={3}>
      <HistoryPane histories={histories} />
      {showStatistics && (
        <Center mt={4}>
          <Button
            w={"80%"}
            size={"sm"}
            variant={"outline"}
            leftIcon={<TbUsers />}
            color={"gray.600"}
            onClick={onOpen}
          >
            プレイ回数を確認
          </Button>
          <Modal
            onClose={onClose}
            isOpen={isOpen}
            scrollBehavior={"inside"}
            isCentered
          >
            <ModalOverlay />
            <ModalContent w={"300px"}>
              <ModalHeader maxH={"xs"} fontSize={"sm"}>
                プレイ回数 (連続休憩回数)
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <MemberCountPane settings={settings} small={true} />
              </ModalBody>
            </ModalContent>
          </Modal>
        </Center>
      )}
    </Stack>
  );
}
