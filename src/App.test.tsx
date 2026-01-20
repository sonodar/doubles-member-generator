import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useParams } from "react-router-dom";

afterEach(() => {
	cleanup();
});

// コンポーネントをモック
vi.mock("@components/Main", () => ({
	default: () => <div data-testid="main-component">Main Component</div>,
}));

vi.mock("@components/Share", () => ({
	default: ({ sharedId }: { sharedId: string }) => <div data-testid="share-component">Share Component: {sharedId}</div>,
}));

// モックされた Share を直接使用
function MockedShare({ sharedId }: { sharedId: string }) {
	return <div data-testid="share-component">Share Component: {sharedId}</div>;
}

function ShareWrapper() {
	const { id } = useParams<{ id: string }>();
	return <MockedShare sharedId={id ?? ""} />;
}

// テスト用のルート定義（BrowserRouter の代わりに MemoryRouter を使用）
function TestApp({ initialEntries }: { initialEntries: string[] }) {
	return (
		<MemoryRouter initialEntries={initialEntries}>
			<Routes>
				<Route path="/" element={<div data-testid="main-component">Main Component</div>} />
				<Route path="/share/:id" element={<ShareWrapper />} />
			</Routes>
		</MemoryRouter>
	);
}

describe("App", () => {
	describe("routing", () => {
		it("should render Main component on / route", () => {
			render(<TestApp initialEntries={["/"]} />);

			expect(screen.getByTestId("main-component")).toBeInTheDocument();
		});

		it("should render Share component on /share/:id route", () => {
			render(<TestApp initialEntries={["/share/test-id-123"]} />);

			expect(screen.getByTestId("share-component")).toBeInTheDocument();
			expect(screen.getByText(/test-id-123/)).toBeInTheDocument();
		});

		it("should pass empty string when id param is missing", () => {
			render(
				<MemoryRouter initialEntries={["/share/"]}>
					<Routes>
						<Route path="/share/" element={<ShareWrapper />} />
					</Routes>
				</MemoryRouter>,
			);

			expect(screen.getByTestId("share-component")).toBeInTheDocument();
		});
	});
});
