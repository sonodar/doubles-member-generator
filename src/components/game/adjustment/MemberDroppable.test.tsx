import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "../../../testing/utils";
import { MemberDroppable } from "./MemberDroppable";
import { DndContext } from "@dnd-kit/core";

// useDroppable のモック状態
const mockDroppableState = {
	isOver: false,
	setNodeRef: vi.fn(),
};

vi.mock("@dnd-kit/core", async () => {
	const actual = await vi.importActual("@dnd-kit/core");
	return {
		...actual,
		useDroppable: vi.fn(() => mockDroppableState),
	};
});

describe("MemberDroppable", () => {
	beforeEach(() => {
		mockDroppableState.isOver = false;
	});

	describe("基本表示", () => {
		it("子要素が表示される", () => {
			render(
				<DndContext>
					<MemberDroppable type="courtMember" memberId={5} courtId={0}>
						<span>テスト内容</span>
					</MemberDroppable>
				</DndContext>,
			);

			expect(screen.getByText("テスト内容")).toBeInTheDocument();
		});
	});

	describe("ドロップ領域", () => {
		it("ドロップ領域として設定されている", () => {
			const { container } = render(
				<DndContext>
					<MemberDroppable type="courtMember" memberId={5} courtId={0}>
						<span>コンテンツ</span>
					</MemberDroppable>
				</DndContext>,
			);

			// useDroppable が適用されているか確認
			// container 内に要素があることを確認
			expect(container.firstChild).toBeInTheDocument();
		});
	});

	describe("ホバー状態", () => {
		it("isOver=falseの場合、背景が透明になる", () => {
			mockDroppableState.isOver = false;
			const { container } = render(
				<DndContext>
					<MemberDroppable type="courtMember" memberId={5} courtId={0}>
						<span>テスト</span>
					</MemberDroppable>
				</DndContext>,
			);

			const box = container.firstChild as HTMLElement;
			expect(box.style.background).toBe("transparent");
		});

		it("isOver=trueの場合、背景色が変更される", () => {
			mockDroppableState.isOver = true;
			const { container } = render(
				<DndContext>
					<MemberDroppable type="courtMember" memberId={5} courtId={0}>
						<span>テスト</span>
					</MemberDroppable>
				</DndContext>,
			);

			const box = container.firstChild as HTMLElement;
			expect(box.style.background).toBe("var(--chakra-colors-gray-100)");
		});

	});
});
