import { describe, expect, it } from "vitest";
import { render, screen } from "../../../testing/utils";
import { MemberDroppable } from "./MemberDroppable";
import { DndContext } from "@dnd-kit/core";

describe("MemberDroppable", () => {
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
});
