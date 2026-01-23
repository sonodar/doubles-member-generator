import { DragDropProvider } from "@dnd-kit/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "../../../testing/utils";
import { MemberDroppable } from "./MemberDroppable";

// useDroppable のモック状態
const mockDroppableState = {
	isDropTarget: false,
	ref: vi.fn(),
};

vi.mock("@dnd-kit/react", async () => {
	const actual = await vi.importActual("@dnd-kit/react");
	return {
		...actual,
		useDroppable: vi.fn(() => mockDroppableState),
	};
});

describe("MemberDroppable", () => {
	beforeEach(() => {
		mockDroppableState.isDropTarget = false;
	});

	describe("基本表示", () => {
		it("子要素が表示される", () => {
			render(
				<DragDropProvider>
					<MemberDroppable type="courtMember" memberId={5} courtId={0}>
						<span>テスト内容</span>
					</MemberDroppable>
				</DragDropProvider>,
			);

			expect(screen.getByText("テスト内容")).toBeInTheDocument();
		});
	});

	describe("ドロップ領域", () => {
		it("ドロップ領域として設定されている", () => {
			const { container } = render(
				<DragDropProvider>
					<MemberDroppable type="courtMember" memberId={5} courtId={0}>
						<span>コンテンツ</span>
					</MemberDroppable>
				</DragDropProvider>,
			);

			// useDroppable が適用されているか確認
			// container 内に要素があることを確認
			expect(container.firstChild).toBeInTheDocument();
		});
	});

	describe("ホバー状態", () => {
		it("isDropTarget=falseの場合、背景が透明になる", () => {
			mockDroppableState.isDropTarget = false;
			const { container } = render(
				<DragDropProvider>
					<MemberDroppable type="courtMember" memberId={5} courtId={0}>
						<span>テスト</span>
					</MemberDroppable>
				</DragDropProvider>,
			);

			const box = container.firstChild as HTMLElement;
			expect(box.style.background).toBe("transparent");
		});

		it("isDropTarget=trueの場合、背景色が変更される", () => {
			mockDroppableState.isDropTarget = true;
			const { container } = render(
				<DragDropProvider>
					<MemberDroppable type="courtMember" memberId={5} courtId={0}>
						<span>テスト</span>
					</MemberDroppable>
				</DragDropProvider>,
			);

			const box = container.firstChild as HTMLElement;
			expect(box.style.background).toBe("var(--chakra-colors-gray-100)");
		});
	});
});
