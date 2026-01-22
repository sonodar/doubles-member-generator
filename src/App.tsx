import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { Provider, createStore } from "jotai";
import Main from "@components/Main";
import Share from "@components/Share";
import system from "@components/theme";

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
					<Routes>
						<Route path="/" element={<Main />} />
						<Route path="/share/:id" element={<ShareWrapper />} />
					</Routes>
				</BrowserRouter>
			</Provider>
		</ChakraProvider>
	);
}
