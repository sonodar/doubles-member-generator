import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { build } from "esbuild";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
	plugins: [
		react(),
		// 開発サーバーで /sw.js を配信するためのプラグイン
		// src/sw.ts は本番ビルドでのみ dist/sw.js に出力されるため、
		// 開発環境では Vite が SPA フォールバックで index.html を返してしまう
		{
			name: "sw-dev",
			configureServer(server) {
				server.middlewares.use(async (req, res, next) => {
					if (req.url === "/sw.js") {
						const result = await build({
							entryPoints: [resolve(rootDir, "src/sw.ts")],
							bundle: true,
							write: false,
							format: "iife",
						});
						res.setHeader("Content-Type", "application/javascript");
						res.end(result.outputFiles[0].text);
						return;
					}
					next();
				});
			},
		},
	],
	define: {
		"window.global": {},
	},
	build: {
		rollupOptions: {
			input: {
				main: resolve(rootDir, "index.html"),
				sw: resolve(rootDir, "src/sw.ts"),
			},
			output: {
				entryFileNames: (chunk) => (chunk.name === "sw" ? "sw.js" : "assets/[name]-[hash].js"),
			},
		},
	},
});
