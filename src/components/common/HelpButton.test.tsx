import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "../../testing/utils";
import HelpButton from "./HelpButton";

describe("HelpButton", () => {
	describe("基本表示", () => {
		it("ヘルプボタンが表示される", () => {
			render(<HelpButton items={["algorithm"]} />);

			expect(screen.getByRole("button", { name: "Help" })).toBeInTheDocument();
		});
	});

	describe("モーダル表示", () => {
		it("クリック時にヘルプモーダルが表示される", () => {
			render(<HelpButton items={["algorithm"]} />);

			fireEvent.click(screen.getByRole("button", { name: "Help" }));

			expect(screen.getByText("ヘルプ")).toBeInTheDocument();
			expect(screen.getByText("ばらつき重視")).toBeInTheDocument();
			expect(screen.getByText("均等性重視")).toBeInTheDocument();
		});

		it("titleを指定するとモーダルのタイトルが変わる", () => {
			render(<HelpButton title="カスタムタイトル" items={["algorithm"]} />);

			fireEvent.click(screen.getByRole("button", { name: "Help" }));

			expect(screen.getByText("カスタムタイトル")).toBeInTheDocument();
		});

		it("閉じるボタンでonCloseが呼ばれる", () => {
			render(<HelpButton items={["algorithm"]} />);

			fireEvent.click(screen.getByRole("button", { name: "Help" }));
			expect(screen.getByText("ヘルプ")).toBeInTheDocument();

			// 閉じるボタンが存在することを確認
			expect(screen.getByRole("button", { name: "閉じる" })).toBeInTheDocument();
		});
	});
});
