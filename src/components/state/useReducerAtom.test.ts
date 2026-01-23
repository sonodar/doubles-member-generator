import { act, renderHook } from "@testing-library/react";
import { atom } from "jotai";
import { describe, expect, it } from "vitest";
import { useReducerAtom } from "./useReducerAtom";

describe("useReducerAtom", () => {
	describe("基本動作", () => {
		it("初期状態を返す", () => {
			const testAtom = atom(0);
			const reducer = (state: number, action: { type: "inc" | "dec" }) => {
				if (action.type === "inc") return state + 1;
				if (action.type === "dec") return state - 1;
				return state;
			};

			const { result } = renderHook(() => useReducerAtom(testAtom, reducer));
			const [state] = result.current;

			expect(state).toBe(0);
		});

		it("dispatch でアクションを送信すると状態が更新される", () => {
			const testAtom = atom(0);
			const reducer = (state: number, action: { type: "inc" | "dec" }) => {
				if (action.type === "inc") return state + 1;
				if (action.type === "dec") return state - 1;
				return state;
			};

			const { result } = renderHook(() => useReducerAtom(testAtom, reducer));

			act(() => {
				const [, dispatch] = result.current;
				dispatch({ type: "inc" });
			});

			const [state] = result.current;
			expect(state).toBe(1);
		});

		it("複数回 dispatch すると状態が累積される", () => {
			const testAtom = atom(10);
			const reducer = (state: number, action: { type: "add"; value: number }) => {
				return state + action.value;
			};

			const { result } = renderHook(() => useReducerAtom(testAtom, reducer));

			act(() => {
				const [, dispatch] = result.current;
				dispatch({ type: "add", value: 5 });
			});

			act(() => {
				const [, dispatch] = result.current;
				dispatch({ type: "add", value: 3 });
			});

			const [state] = result.current;
			expect(state).toBe(18);
		});
	});

	describe("型安全性", () => {
		it("オブジェクト状態とアクションを扱える", () => {
			type State = { count: number; name: string };
			type Action = { type: "setCount"; count: number } | { type: "setName"; name: string };

			const testAtom = atom<State>({ count: 0, name: "" });
			const reducer = (state: State, action: Action): State => {
				if (action.type === "setCount") return { ...state, count: action.count };
				if (action.type === "setName") return { ...state, name: action.name };
				return state;
			};

			const { result } = renderHook(() => useReducerAtom(testAtom, reducer));

			act(() => {
				const [, dispatch] = result.current;
				dispatch({ type: "setCount", count: 42 });
			});

			act(() => {
				const [, dispatch] = result.current;
				dispatch({ type: "setName", name: "test" });
			});

			const [state] = result.current;
			expect(state).toEqual({ count: 42, name: "test" });
		});
	});
});
