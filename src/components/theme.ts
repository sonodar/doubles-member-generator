import { createSystem, createToaster, defaultConfig } from "@chakra-ui/react";

export const prettyFont = {
	fontFamily: `"Zen Maru Gothic",-apple-system,sans-serif`,
};

const system = createSystem(defaultConfig, {
	theme: {
		recipes: {
			// Button のデフォルトスタイル（Chakra v2 のデフォルト動作を再現）
			button: {
				base: {
					fontWeight: "semibold",
					borderRadius: "md",
				},
			},
			// Heading サイズを Chakra v2 相当に調整（各サイズを1段階大きい textStyle にマッピング）
			heading: {
				variants: {
					size: {
						xs: { textStyle: "sm" },
						sm: { textStyle: "md" },
						md: { textStyle: "lg" },
						lg: { textStyle: "xl" },
						xl: { textStyle: "2xl" },
						"2xl": { textStyle: "3xl" },
						"3xl": { textStyle: "4xl" },
						"4xl": { textStyle: "5xl" },
						"5xl": { textStyle: "6xl" },
						"6xl": { textStyle: "7xl" },
					},
				},
			},
		},
		tokens: {
			fonts: {
				heading: { value: `"Zen Maru Gothic",-apple-system,sans-serif` },
			},
			colors: {
				brand: {
					50: { value: "#E8EFF6" },
					100: { value: "#DDE6F4" },
					200: { value: "#D1DDF1" },
					300: { value: "#B9CBEC" },
					400: { value: "#A1B9E7" },
					500: { value: "#89A6E2" },
					600: { value: "#7D97CD" },
					700: { value: "#7289BA" },
					800: { value: "#687DA9" },
					900: { value: "#5F729A" },
				},
				primary: {
					50: { value: "#94A9EE" },
					100: { value: "#89A0EC" },
					200: { value: "#7791E9" },
					300: { value: "#6582E6" },
					400: { value: "#5373E3" },
					500: { value: "#4164E0" },
					600: { value: "#3B5BCC" },
					700: { value: "#3653B9" },
					800: { value: "#314BA8" },
					900: { value: "#2D4499" },
				},
				danger: {
					50: { value: "#FCF6F8" },
					100: { value: "#F7D4DE" },
					200: { value: "#F4C3D1" },
					300: { value: "#F1B2C4" },
					400: { value: "#EB90AA" },
					500: { value: "#E56D90" },
					600: { value: "#D06383" },
					700: { value: "#BD5A77" },
					800: { value: "#AC526C" },
					900: { value: "#9C4B62" },
				},
			},
		},
		semanticTokens: {
			colors: {
				brand: {
					solid: { value: "{colors.brand.500}" },
					contrast: { value: "white" },
					fg: { value: "{colors.brand.700}" },
					muted: { value: "{colors.brand.100}" },
					subtle: { value: "{colors.brand.100}" },
					emphasized: { value: "{colors.brand.300}" },
					focusRing: { value: "{colors.brand.500}" },
				},
				primary: {
					solid: { value: "{colors.primary.500}" },
					contrast: { value: "white" },
					fg: { value: "{colors.primary.700}" },
					muted: { value: "{colors.primary.100}" },
					subtle: { value: "{colors.primary.200}" },
					emphasized: { value: "{colors.primary.300}" },
					focusRing: { value: "{colors.primary.500}" },
				},
				danger: {
					solid: { value: "{colors.danger.500}" },
					contrast: { value: "white" },
					fg: { value: "{colors.danger.700}" },
					muted: { value: "{colors.danger.100}" },
					subtle: { value: "{colors.danger.200}" },
					emphasized: { value: "{colors.danger.300}" },
					focusRing: { value: "{colors.danger.500}" },
				},
			},
		},
	},
	globalCss: {
		html: {
			colorPalette: "brand",
		},
		// number input のスピンボタンを非表示（Chakra v2 のデフォルト動作を再現）
		"input[type=number]": {
			appearance: "textfield",
		},
		"input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button": {
			appearance: "none",
			margin: 0,
		},
	},
});

export const toaster = createToaster({
	placement: "bottom",
	pauseOnPageIdle: true,
});

export default system;
