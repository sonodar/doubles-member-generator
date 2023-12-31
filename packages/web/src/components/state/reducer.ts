import {
  join,
  type CurrentSettings,
  leave,
  replayGenerate,
  replayRetry,
} from "@doubles-member-generator/manager";
import { match } from "ts-pattern";
import type { EventPayload } from "@doubles-member-generator/api";

export function settingsReducer(
  settings: CurrentSettings,
  action: EventPayload,
): CurrentSettings {
  return match(action)
    .with({ type: "INITIALIZE" }, ({ payload }) => payload)
    .with({ type: "JOIN" }, () => join(settings))
    .with({ type: "LEAVE" }, ({ payload }) => leave(settings, payload.memberId))
    .with({ type: "GENERATE" }, ({ payload }) =>
      replayGenerate(settings, payload.members),
    )
    .with({ type: "RETRY" }, ({ payload }) =>
      replayRetry(settings, payload.members),
    )
    .with({ type: "FINISH" }, () => settings)
    .exhaustive();
}
