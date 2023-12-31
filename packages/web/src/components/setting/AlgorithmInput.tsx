import { HStack, Radio, RadioGroup } from "@chakra-ui/react";
import type { Algorithm } from "@doubles-member-generator/manager";
import React from "react";

type Props = { value: Algorithm; onChange: (mode: Algorithm) => void };

export default function AlgorithmInput({ value, onChange }: Props) {
  return (
    <RadioGroup onChange={onChange} value={value}>
      <HStack spacing={6}>
        <Radio value={"DISCRETENESS"} colorScheme={"brand"}>
          ばらつき重視
        </Radio>
        <Radio value={"EVENNESS"} colorScheme={"brand"}>
          均等性重視
        </Radio>
      </HStack>
    </RadioGroup>
  );
}
