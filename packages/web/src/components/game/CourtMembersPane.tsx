import {
  Card,
  Center,
  Divider,
  HStack,
  Heading,
  SimpleGrid,
  Stack,
} from "@chakra-ui/react";
import type {
  CourtMembers,
  GameMembers,
} from "@doubles-member-generator/manager";
import { array } from "@doubles-member-generator/manager";
import React from "react";

type ParentProps = {
  members: GameMembers;
  single?: boolean;
  color?: string;
};

export default function CourtMembersPane({
  members,
  single = true,
  color = "primary.900",
}: ParentProps) {
  const courtIds = array.generate(members.length, 0);
  return (
    <SimpleGrid columns={single ? 1 : 2} spacing={4} justifyItems={"center"}>
      {members.length > 0 &&
        courtIds.map((id) => (
          <CourtCard
            key={id}
            id={id}
            members={members[id]}
            single={single}
            color={color}
          />
        ))}
    </SimpleGrid>
  );
}

type ChildProps = {
  id: number;
  members: CourtMembers;
  single: boolean;
  color: string;
};

function CourtCard({ id, members, single, color }: ChildProps) {
  const w = single ? "300px" : "150px";
  const s = single ? 12 : 4;

  return (
    <Card p={2} maxW={w} minW={w}>
      <Center>
        <Stack>
          <Center>
            <Heading as={"label"} size={"sm"} color={"gray.500"}>{`コート${
              id + 1
            }`}</Heading>
          </Center>
          <Divider />
          <HStack spacing={s} color={color}>
            {members.map((member) => (
              <strong key={member}>{member}</strong>
            ))}
          </HStack>
        </Stack>
      </Center>
    </Card>
  );
}
