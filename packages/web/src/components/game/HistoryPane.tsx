import React from "react";
import { Box, Divider, Heading, Stack } from "@chakra-ui/react";
import CourtMembersPane from "@components/game/CourtMembersPane";
import { useSettings } from "@components/state";

export default function HistoryPane() {
  const settings = useSettings();

  const histories = settings.histories
    .map((history, index) => ({ index, history }))
    .reverse();

  return (
    <Stack spacing={3} divider={<Divider />}>
      {histories.map(({ history, index }, i) => (
        <Box key={history.members.flat().join(",")} px={2}>
          <Heading as={"label"} size={"sm"} color={"gray.600"}>
            {i > 1 && `${index + 1} 回目`}
            {i === 0 && " 現在 "}
            {i === 1 && " 前回 "}
          </Heading>
          <CourtMembersPane members={history.members} single={false} />
        </Box>
      ))}
    </Stack>
  );
}
