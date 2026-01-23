import { Center, ChakraProvider, Spinner } from "@chakra-ui/react";
import { createStore, Provider } from "jotai";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, useParams } from "react-router-dom";
import system from "./components/theme";

const Main = lazy(() => import("./components/Main"));
const Share = lazy(() => import("./components/Share"));

const store = createStore();

function ShareWrapper() {
	const { id } = useParams<{ id: string }>();
	return <Share sharedId={id ?? ""} />;
}

export default function App() {
	return (
		<ChakraProvider value={system}>
			<Provider store={store}>
				<BrowserRouter>
					<Suspense
						fallback={
							<Center h="100vh">
								<Spinner size="xl" />
							</Center>
						}
					>
						<Routes>
							<Route path="/" element={<Main />} />
							<Route path="/share/:id" element={<ShareWrapper />} />
						</Routes>
					</Suspense>
				</BrowserRouter>
			</Provider>
		</ChakraProvider>
	);
}
