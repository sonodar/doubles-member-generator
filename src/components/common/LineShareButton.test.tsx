import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "../../testing/utils";
import LineShareButton from "./LineShareButton";

describe("LineShareButton", () => {
	beforeEach(() => {
		// window.LineIt のモック
		window.LineIt = {
			loadButton: vi.fn(),
		};
	});

	describe("基本表示", () => {
		it("LINE共有ボタンが表示される", () => {
			const { container } = render(<LineShareButton url="https://example.com/share/test" />);

			const button = container.querySelector(".line-it-button");
			expect(button).toBeInTheDocument();
		});

		it("data-url属性にURLが設定される", () => {
			const testUrl = "https://example.com/share/test-id";
			const { container } = render(<LineShareButton url={testUrl} />);

			const button = container.querySelector(".line-it-button");
			expect(button).toHaveAttribute("data-url", testUrl);
		});
	});

	describe("LineIt SDK連携", () => {
		it("urlが渡された場合、LineIt.loadButtonが呼ばれる", () => {
			render(<LineShareButton url="https://example.com/share/test" />);

			expect(window.LineIt?.loadButton).toHaveBeenCalled();
		});

		it("urlがundefinedの場合、LineIt.loadButtonは呼ばれない", () => {
			render(<LineShareButton />);

			expect(window.LineIt?.loadButton).not.toHaveBeenCalled();
		});
	});
});
