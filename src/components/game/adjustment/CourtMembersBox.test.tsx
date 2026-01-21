import { describe, expect, it, vi } from "vitest";
import { render, screen } from "../../../testing/utils";
import { CourtMembersBox } from "./CourtMembersBox";
import { DndContext } from "@dnd-kit/core";
import type { CourtMembers } from "@logic";

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

describe("CourtMembersBox", () => {
	const courtMembers: CourtMembers = [1, 2, 3, 4];

	describe("基本表示", () => {
		it("コートメンバー4人が表示される", () => {
			render(
				<DndContext>
					<CourtMembersBox courtId={1} courtMembers={courtMembers} />
				</DndContext>,
			);

			expect(screen.getByText("1")).toBeInTheDocument();
			expect(screen.getByText("2")).toBeInTheDocument();
			expect(screen.getByText("3")).toBeInTheDocument();
			expect(screen.getByText("4")).toBeInTheDocument();
		});

		it("異なるコートIDで表示できる", () => {
			const courtMembers2: CourtMembers = [5, 6, 7, 8];
			render(
				<DndContext>
					<CourtMembersBox courtId={2} courtMembers={courtMembers2} />
				</DndContext>,
			);

			expect(screen.getByText("5")).toBeInTheDocument();
			expect(screen.getByText("6")).toBeInTheDocument();
			expect(screen.getByText("7")).toBeInTheDocument();
			expect(screen.getByText("8")).toBeInTheDocument();
		});
	});
});
