import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@assets": path.resolve(__dirname, "src/assets"),
			"@components": path.resolve(__dirname, "src/components"),
			"@layouts": path.resolve(__dirname, "src/layouts"),
			"@api": path.resolve(__dirname, "src/api"),
			"@logic": path.resolve(__dirname, "src/logic"),
		},
	},
	test: {
		globals: true,
		environment: "happy-dom",
		setupFiles: ["./src/test-setup.ts"],
		coverage: {
			provider: "v8",
			enabled: true,
			reporter: ["text", "html", "json-summary"],
			include: ["src/**/*.ts", "src/**/*.tsx"],
			exclude: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/testing/**/*"],
		},
	},
});
