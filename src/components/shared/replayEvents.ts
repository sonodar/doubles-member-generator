import { type Event, EventType, replayEvent } from "../../api";
import type { CurrentSettings } from "../../logic";

export function replayEvents(allEvents: Event[]): { settings: CurrentSettings; finished: boolean } {
	const [init, ...events] = allEvents;

	if (init.type !== EventType.Initialize) {
		throw new Error(`Invalid first event type: ${init.type}`);
	}

	let finished = false;

	const settings = events.reduce((settings, event) => {
		if (event.type === EventType.Initialize) return settings;
		finished = finished || event.type === EventType.Finish;
		return replayEvent(settings, event);
	}, init.payload);

	return { settings, finished };
}
