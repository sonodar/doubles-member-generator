import { createSystem, createToaster, defaultConfig } from "@chakra-ui/react";

export const prettyFont = {
	fontFamily: `"Zen Maru Gothic",-apple-system,sans-serif`,
};

const system = createSystem(defaultConfig, {
	theme: {
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
	},
});

export const toaster = createToaster({
	placement: "bottom",
	pauseOnPageIdle: true,
});

export default system;
