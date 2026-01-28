import { defineFunction } from "@aws-amplify/backend";

export const autoFinisher = defineFunction({
	name: "autoFinisher",
	entry: "./handler.ts",
	runtime: 22,
	timeoutSeconds: 120,
	schedule: "every day",
	// data スタックに配置して循環依存を回避
	resourceGroupName: "data",
});
