import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "../../testing/utils";
import { ShareButton } from "./ShareButton";

describe("ShareButton", () => {
	const mockOnIssue = vi.fn();

	beforeEach(() => {
		mockOnIssue.mockClear();
		mockOnIssue.mockResolvedValue(undefined);
	});

	describe("基本表示", () => {
		it("シェアボタンが表示される", () => {
			render(<ShareButton onIssue={mockOnIssue} />);

			expect(screen.getByRole("button", { name: "シェア" })).toBeInTheDocument();
		});

		it("isDisabled=trueの場合、ボタンが無効になる", () => {
			render(<ShareButton onIssue={mockOnIssue} isDisabled={true} />);

			expect(screen.getByRole("button", { name: "シェア" })).toBeDisabled();
		});
	});

	describe("共有リンク未発行時", () => {
		it("クリック時に確認ダイアログが表示される", () => {
			render(<ShareButton onIssue={mockOnIssue} />);

			fireEvent.click(screen.getByRole("button", { name: "シェア" }));

			expect(screen.getByText("共有リンクの発行")).toBeInTheDocument();
		});

		it("確認ダイアログでOKをクリックするとonIssueが呼ばれる", async () => {
			render(<ShareButton onIssue={mockOnIssue} />);

			fireEvent.click(screen.getByRole("button", { name: "シェア" }));
			fireEvent.click(screen.getByRole("button", { name: "OK" }));

			await waitFor(() => {
				expect(mockOnIssue).toHaveBeenCalledTimes(1);
			});
		});

		it("確認ダイアログでキャンセルをクリックするとonIssueは呼ばれない", () => {
			render(<ShareButton onIssue={mockOnIssue} />);

			fireEvent.click(screen.getByRole("button", { name: "シェア" }));
			fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

			expect(mockOnIssue).not.toHaveBeenCalled();
		});
	});

	describe("共有リンク発行済み時", () => {
		it("sharedIdがある場合、クリック時に共有ダイアログが表示される", () => {
			render(<ShareButton sharedId="test-id-123" onIssue={mockOnIssue} />);

			fireEvent.click(screen.getByRole("button", { name: "シェア" }));

			// ShareDialogが表示される（ヘッダーは「共有」）
			expect(screen.getByText("共有")).toBeInTheDocument();
		});
	});
});
