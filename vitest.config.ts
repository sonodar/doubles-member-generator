import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: "happy-dom",
		setupFiles: ["./src/test-setup.ts"],
		coverage: {
			provider: "v8",
			enabled: true,
			reporter: ["text", "html", "json-summary"],
			include: ["src/**/*.ts", "src/**/*.tsx", "amplify/**/*.ts"],
			exclude: [
				"src/**/*.test.ts",
				"src/**/*.test.tsx",
				"src/testing/**/*",
				"amplify/backend.ts",
				"amplify/**/*.test.ts",
				"amplify/**/resource.ts",
			],
		},
	},
});
