import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../../testing/utils";
import { ShareDialog } from "./ShareDialog";

// クリップボード API のモック
const mockWriteText = vi.fn().mockResolvedValue(undefined);
vi.stubGlobal("navigator", {
	clipboard: {
		writeText: mockWriteText,
	},
});

describe("ShareDialog", () => {
	const mockOnClose = vi.fn();
	const testUrl = "https://example.com/share/test-id";

	beforeEach(() => {
		mockOnClose.mockClear();
		mockWriteText.mockClear();
	});

	describe("基本表示", () => {
		it("isOpen=true の場合、ダイアログが表示される", () => {
			render(<ShareDialog open={true} onClose={mockOnClose} value={testUrl} />);

			expect(screen.getByText("共有")).toBeInTheDocument();
		});

		it("URL が入力欄に表示される", () => {
			render(<ShareDialog open={true} onClose={mockOnClose} value={testUrl} />);

			const input = screen.getByRole("textbox");
			expect(input).toHaveValue(testUrl);
		});

		it("URLコピーボタンが表示される", () => {
			render(<ShareDialog open={true} onClose={mockOnClose} value={testUrl} />);

			expect(screen.getByRole("button", { name: "URLコピー" })).toBeInTheDocument();
		});
	});

	describe("コピー機能", () => {
		it("URLコピーボタンをクリックするとクリップボードにコピーされる", async () => {
			render(<ShareDialog open={true} onClose={mockOnClose} value={testUrl} />);

			const copyButton = screen.getByRole("button", { name: "URLコピー" });
			fireEvent.click(copyButton);

			expect(mockWriteText).toHaveBeenCalledWith(testUrl);
		});

		it("コピー後に onClose が呼ばれる", () => {
			render(<ShareDialog open={true} onClose={mockOnClose} value={testUrl} />);

			const copyButton = screen.getByRole("button", { name: "URLコピー" });
			fireEvent.click(copyButton);

			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});
	});

	describe("非表示", () => {
		it("isOpen=false の場合、ダイアログが非表示", () => {
			render(<ShareDialog open={false} onClose={mockOnClose} value={testUrl} />);

			expect(screen.queryByText("共有")).not.toBeInTheDocument();
		});
	});
});
