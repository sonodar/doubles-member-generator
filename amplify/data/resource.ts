import { a, type ClientSchema, defineData } from "@aws-amplify/backend";

const schema = a.schema({
	EventType: a.enum(["INITIALIZE", "JOIN", "LEAVE", "GENERATE", "RETRY", "FINISH"]),

	Environment: a
		.model({
			ttl: a.integer().required(),
			finishedAt: a.datetime(),
			events: a.hasMany("Event", "environmentID"),
		})
		.authorization((allow) => [allow.guest()]),

	Event: a
		.model({
			environmentID: a.id().required(),
			type: a.ref("EventType").required(),
			payload: a.json().required(),
			occurredAt: a.datetime().required(),
			consumed: a.boolean(),
			environment: a.belongsTo("Environment", "environmentID"),
		})
		.secondaryIndexes((index) => [index("environmentID").sortKeys(["occurredAt"]).name("byEnvironment")])
		.authorization((allow) => [allow.guest()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
	schema,
	authorizationModes: {
		defaultAuthorizationMode: "identityPool",
	},
});
