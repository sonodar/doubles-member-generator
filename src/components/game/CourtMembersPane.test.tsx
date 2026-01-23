import type { GameMembers } from "@logic";
import { describe, expect, it } from "vitest";
import { render, screen } from "../../testing/utils";
import CourtMembersPane from "./CourtMembersPane";

describe("CourtMembersPane", () => {
	const gameMembers: GameMembers = [
		[1, 2, 3, 4],
		[5, 6, 7, 8],
	];

	describe("基本表示", () => {
		it("コート別のメンバーが表示される", () => {
			render(<CourtMembersPane members={gameMembers} />);

			// コート1, コート2 のラベル
			expect(screen.getByText("コート1")).toBeInTheDocument();
			expect(screen.getByText("コート2")).toBeInTheDocument();
		});

		it("各コートのメンバーIDが表示される", () => {
			render(<CourtMembersPane members={gameMembers} />);

			// コート1のメンバー
			expect(screen.getByText("1")).toBeInTheDocument();
			expect(screen.getByText("2")).toBeInTheDocument();
			expect(screen.getByText("3")).toBeInTheDocument();
			expect(screen.getByText("4")).toBeInTheDocument();

			// コート2のメンバー
			expect(screen.getByText("5")).toBeInTheDocument();
			expect(screen.getByText("6")).toBeInTheDocument();
			expect(screen.getByText("7")).toBeInTheDocument();
			expect(screen.getByText("8")).toBeInTheDocument();
		});
	});

	describe("single モード", () => {
		it("single=true の場合でもコート情報が表示される", () => {
			render(<CourtMembersPane members={gameMembers} single={true} />);

			// コート情報が表示される
			expect(screen.getByText("コート1")).toBeInTheDocument();
			expect(screen.getByText("コート2")).toBeInTheDocument();
		});

		it("single=false の場合でもコート情報が表示される", () => {
			render(<CourtMembersPane members={gameMembers} single={false} />);

			// コート情報が表示される
			expect(screen.getByText("コート1")).toBeInTheDocument();
			expect(screen.getByText("コート2")).toBeInTheDocument();
		});
	});

	describe("archive モード", () => {
		it("archive=true の場合でもコート情報が表示される", () => {
			render(<CourtMembersPane members={gameMembers} archive={true} />);

			expect(screen.getByText("コート1")).toBeInTheDocument();
			expect(screen.getByText("コート2")).toBeInTheDocument();
		});
	});

	describe("空のメンバー", () => {
		it("メンバーが空の場合、コートカードは表示されない", () => {
			render(<CourtMembersPane members={[]} />);

			expect(screen.queryByText("コート1")).not.toBeInTheDocument();
		});
	});
});
