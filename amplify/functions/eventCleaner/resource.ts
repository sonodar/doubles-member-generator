import { defineFunction } from "@aws-amplify/backend";

export const eventCleaner = defineFunction({
	name: "eventCleaner",
	entry: "./handler.ts",
	runtime: 22,
	timeoutSeconds: 60,
	// data スタックに配置して循環依存を回避
	resourceGroupName: "data",
});
