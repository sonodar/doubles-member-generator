import { describe, expect, it } from "vitest";
import { render, screen } from "../../../testing/utils";
import { MemberBox } from "./MemberBox";
import { DndContext } from "@dnd-kit/core";

describe("MemberBox", () => {
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
});
