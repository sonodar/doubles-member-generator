import type { ReactElement } from "react";
import { render as rtlRender, type RenderOptions, type RenderResult } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import { Provider, createStore, type WritableAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import customTheme from "@components/theme";

// biome-ignore lint/suspicious/noExplicitAny: jotai の型定義に合わせる必要がある
type AnyWritableAtom = WritableAtom<unknown, any[], any>;
type AtomTuple = readonly [AnyWritableAtom, unknown];

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
	/** Jotai アトムの初期値 */
	initialAtomValues?: AtomTuple[];
}

interface HydrateAtomsProps {
	initialValues: AtomTuple[];
	children: React.ReactNode;
}

function HydrateAtoms({ initialValues, children }: HydrateAtomsProps) {
	useHydrateAtoms(initialValues);
	return children;
}

interface AllProvidersProps {
	children: React.ReactNode;
	initialAtomValues?: AtomTuple[];
}

function AllProviders({ children, initialAtomValues = [] }: AllProvidersProps) {
	const store = createStore();
	return (
		<ChakraProvider theme={customTheme}>
			<Provider store={store}>
				{initialAtomValues.length > 0 ? (
					<HydrateAtoms initialValues={initialAtomValues}>{children}</HydrateAtoms>
				) : (
					children
				)}
			</Provider>
		</ChakraProvider>
	);
}

/**
 * ChakraProvider と Jotai Provider をラップしたカスタム render 関数
 */
function render(ui: ReactElement, options: CustomRenderOptions = {}): RenderResult {
	const { initialAtomValues, ...renderOptions } = options;

	return rtlRender(ui, {
		wrapper: ({ children }) => <AllProviders initialAtomValues={initialAtomValues}>{children}</AllProviders>,
		...renderOptions,
	});
}

// @testing-library/react の API を再エクスポート
export * from "@testing-library/react";
export { render };
