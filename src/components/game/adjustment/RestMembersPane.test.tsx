import { DndContext } from "@dnd-kit/core";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "../../../testing/utils";
import { RestMembersPane } from "./RestMembersPane";

// @dnd-kit/core のモック
const mockDroppableState = {
	isOver: false,
	setNodeRef: vi.fn(),
};

vi.mock("@dnd-kit/core", async () => {
	const actual = await vi.importActual("@dnd-kit/core");
	return {
		...actual,
		useDroppable: vi.fn(() => mockDroppableState),
		useDraggable: vi.fn(() => ({
			isDragging: false,
			attributes: {},
			listeners: {},
			setNodeRef: vi.fn(),
			transform: null,
		})),
	};
});

describe("RestMembersPane", () => {
	describe("基本表示", () => {
		it("休憩見出しが表示される", () => {
			render(
				<DndContext>
					<RestMembersPane restMembers={[9, 10]} />
				</DndContext>,
			);

			expect(screen.getByText("休憩")).toBeInTheDocument();
		});

		it("休憩メンバーが表示される", () => {
			render(
				<DndContext>
					<RestMembersPane restMembers={[9, 10]} />
				</DndContext>,
			);

			expect(screen.getByText("9")).toBeInTheDocument();
			expect(screen.getByText("10")).toBeInTheDocument();
		});
	});

	describe("空の休憩メンバー", () => {
		it("休憩メンバーが0人の場合、見出しのみ表示される", () => {
			render(
				<DndContext>
					<RestMembersPane restMembers={[]} />
				</DndContext>,
			);

			expect(screen.getByText("休憩")).toBeInTheDocument();
			// メンバーは表示されない
			expect(screen.queryByText("9")).not.toBeInTheDocument();
		});
	});
});
