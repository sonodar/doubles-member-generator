import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "../../testing/utils";
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
			render(<ShareButton onIssue={mockOnIssue} disabled={true} />);

			expect(screen.getByRole("button", { name: "シェア" })).toBeDisabled();
		});
	});

	describe("共有リンク未発行時", () => {
		it("クリック時に確認ダイアログが表示される", async () => {
			render(<ShareButton onIssue={mockOnIssue} />);

			fireEvent.click(screen.getByRole("button", { name: "シェア" }));

			await waitFor(() => {
				expect(screen.getByText("共有リンクの発行")).toBeInTheDocument();
			});
		});

		it("確認ダイアログでOKをクリックするとonIssueが呼ばれる", async () => {
			render(<ShareButton onIssue={mockOnIssue} />);

			fireEvent.click(screen.getByRole("button", { name: "シェア" }));

			await waitFor(() => {
				expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
			});

			fireEvent.click(screen.getByRole("button", { name: "OK" }));

			await waitFor(() => {
				expect(mockOnIssue).toHaveBeenCalledTimes(1);
			});
		});

		it("確認ダイアログでキャンセルをクリックするとonIssueは呼ばれない", async () => {
			render(<ShareButton onIssue={mockOnIssue} />);

			const shareButton = screen.getByRole("button", { name: "シェア" });
			act(() => fireEvent.click(shareButton));

			await waitFor(() => {
				expect(screen.getByRole("button", { name: "キャンセル" })).toBeInTheDocument();
			});

			const cancelButton = screen.getByRole("button", { name: "キャンセル" });
			act(() => fireEvent.click(cancelButton));

			await waitFor(() => {
				expect(mockOnIssue).not.toHaveBeenCalled();
			});
		});
	});

	describe("共有リンク発行済み時", () => {
		it("sharedIdがある場合、クリック時に共有ダイアログが表示される", async () => {
			render(<ShareButton sharedId="test-id-123" onIssue={mockOnIssue} />);

			fireEvent.click(screen.getByRole("button", { name: "シェア" }));

			await waitFor(() => {
				// ShareDialogが表示される（ヘッダーは「共有」）
				expect(screen.getByText("共有")).toBeInTheDocument();
			});
		});
	});
});
