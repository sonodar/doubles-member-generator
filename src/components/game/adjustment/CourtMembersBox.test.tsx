import { DragDropProvider } from "@dnd-kit/react";
import type { CourtMembers } from "@logic";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "../../../testing/utils";
import { CourtMembersBox } from "./CourtMembersBox";

// @dnd-kit/react のモック
const mockDroppableState = {
	isDropTarget: false,
	ref: vi.fn(),
};

vi.mock("@dnd-kit/react", async () => {
	const actual = await vi.importActual("@dnd-kit/react");
	return {
		...actual,
		useDroppable: vi.fn(() => mockDroppableState),
		useDraggable: vi.fn(() => ({
			isDragging: false,
			ref: vi.fn(),
		})),
	};
});

describe("CourtMembersBox", () => {
	const courtMembers: CourtMembers = [1, 2, 3, 4];

	describe("基本表示", () => {
		it("コートメンバー4人が表示される", () => {
			render(
				<DragDropProvider>
					<CourtMembersBox courtId={1} courtMembers={courtMembers} />
				</DragDropProvider>,
			);

			expect(screen.getByText("1")).toBeInTheDocument();
			expect(screen.getByText("2")).toBeInTheDocument();
			expect(screen.getByText("3")).toBeInTheDocument();
			expect(screen.getByText("4")).toBeInTheDocument();
		});

		it("異なるコートIDで表示できる", () => {
			const courtMembers2: CourtMembers = [5, 6, 7, 8];
			render(
				<DragDropProvider>
					<CourtMembersBox courtId={2} courtMembers={courtMembers2} />
				</DragDropProvider>,
			);

			expect(screen.getByText("5")).toBeInTheDocument();
			expect(screen.getByText("6")).toBeInTheDocument();
			expect(screen.getByText("7")).toBeInTheDocument();
			expect(screen.getByText("8")).toBeInTheDocument();
		});
	});
});
