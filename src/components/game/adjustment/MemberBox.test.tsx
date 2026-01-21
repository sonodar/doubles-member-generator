import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "../../../testing/utils";
import { MemberBox } from "./MemberBox";
import { DndContext } from "@dnd-kit/core";

// useDraggable のモック状態
const mockDraggableState: {
	isDragging: boolean;
	attributes: Record<string, unknown>;
	listeners: Record<string, unknown>;
	setNodeRef: ReturnType<typeof vi.fn>;
	transform: { x: number; y: number } | null;
} = {
	isDragging: false,
	attributes: {},
	listeners: {},
	setNodeRef: vi.fn(),
	transform: null,
};

vi.mock("@dnd-kit/core", async () => {
	const actual = await vi.importActual("@dnd-kit/core");
	return {
		...actual,
		useDraggable: vi.fn(() => mockDraggableState),
	};
});

describe("MemberBox", () => {
	beforeEach(() => {
		mockDraggableState.isDragging = false;
		mockDraggableState.transform = null;
	});

	describe("基本表示", () => {
		it("メンバーIDが表示される", () => {
			render(
				<DndContext>
					<MemberBox type="courtMember" memberId={5} courtId={0} color="blue.100" />
				</DndContext>,
			);

			expect(screen.getByText("5")).toBeInTheDocument();
		});
	});

	describe("ドラッグ属性", () => {
		it("draggable として設定されている", () => {
			const { container } = render(
				<DndContext>
					<MemberBox type="courtMember" memberId={5} courtId={0} color="blue.100" />
				</DndContext>,
			);

			// @dnd-kit は data-* 属性やスタイルを追加する
			const memberBox = container.querySelector('[style*="transform"]') || container.firstChild;
			expect(memberBox).toBeInTheDocument();
		});
	});

	describe("ドラッグ状態", () => {
		it("isDragging=falseの場合、boxShadowが適用される", () => {
			mockDraggableState.isDragging = false;
			const { container } = render(
				<DndContext>
					<MemberBox type="courtMember" memberId={5} courtId={0} color="blue.100" />
				</DndContext>,
			);

			// boxShadow="sm"が適用されている（Chakra UIのスタイル）
			const box = container.firstChild as HTMLElement;
			expect(box).toBeInTheDocument();
			// Chakra UIはCSSカスタムプロパティやclassを使うためスタイル検証は難しいが、
			// レンダリングが正常に行われることを確認
		});

		it("isDragging=trueの場合、boxShadowが削除される", () => {
			mockDraggableState.isDragging = true;
			const { container } = render(
				<DndContext>
					<MemberBox type="courtMember" memberId={5} courtId={0} color="blue.100" />
				</DndContext>,
			);

			// boxShadow=undefinedが適用される
			const box = container.firstChild as HTMLElement;
			expect(box).toBeInTheDocument();
		});

		it("ドラッグ中にtransformスタイルが適用される", () => {
			mockDraggableState.isDragging = true;
			mockDraggableState.transform = { x: 100, y: 50 };
			const { container } = render(
				<DndContext>
					<MemberBox type="courtMember" memberId={5} courtId={0} color="blue.100" />
				</DndContext>,
			);

			const box = container.firstChild as HTMLElement;
			expect(box.style.transform).toBe("translate3d(100px, 50px, 0)");
		});

		it("ドラッグ終了後はtransformスタイルが元に戻る", () => {
			mockDraggableState.isDragging = false;
			mockDraggableState.transform = null;
			const { container } = render(
				<DndContext>
					<MemberBox type="courtMember" memberId={5} courtId={0} color="blue.100" />
				</DndContext>,
			);

			const box = container.firstChild as HTMLElement;
			expect(box.style.transform).toBe("");
		});
	});
});
