import type { PrimitiveAtom } from "jotai";
import { useAtom } from "jotai";
import { useCallback } from "react";

/**
 * Reducer パターンで atom を操作するカスタムフック
 *
 * jotai/utils の useReducerAtom が v2.8.0 で非推奨になったため、
 * 公式 recipe に基づいて実装した代替版。
 * @see https://jotai.org/docs/recipes/use-reducer-atom
 * @see https://github.com/pmndrs/jotai/releases/tag/v2.8.0
 */
export function useReducerAtom<Value, Action>(
	anAtom: PrimitiveAtom<Value>,
	reducer: (value: Value, action: Action) => Value,
): readonly [Value, (action: Action) => void] {
	const [state, setState] = useAtom(anAtom);
	const dispatch = useCallback((action: Action) => setState((prev) => reducer(prev, action)), [setState, reducer]);
	return [state, dispatch] as const;
}
