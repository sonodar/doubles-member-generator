import { ChakraProvider } from "@chakra-ui/react";
import system from "@components/theme";
import { type RenderOptions, type RenderResult, render as rtlRender } from "@testing-library/react";
import { Provider, type WritableAtom, createStore } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import type { ReactElement } from "react";

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
		<ChakraProvider value={system}>
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
