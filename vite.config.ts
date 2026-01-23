import { defineConfig } from "vite";
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
			"@hooks": path.resolve(__dirname, "src/hooks"),
		},
	},
	define: {
		"window.global": {},
	},
});
