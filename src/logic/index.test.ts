import { describe, expect, test } from "vitest";
import { Algorithms, type CurrentSettings, generate, join, leave, retry } from "./";
import { array } from "./array";
import { getLatestMembers } from "./util";

describe("main", () => {
	test("generate random members", () => {
		const initial: CurrentSettings = generate({
			courtCount: 2,
			members: array.generate(12),
			histories: [],
			gameCounts: {},
			algorithm: Algorithms.DISCRETENESS,
		});

		// 履歴が生成されていること
		const members = getLatestMembers(initial);
		expect(initial.histories[0]).toMatchObject({ members });

		const added = join(initial);

		// メンバーが増えていること、履歴が変わらないこと
		expect(added.members.length).toBe(13);
		expect(added.histories).toEqual(initial.histories);
		expect(added.gameCounts).toEqual({
			...initial.gameCounts,
			13: { playCount: 0, baseCount: 1, joinedAt: 1 },
		});

		const next = generate(added);

		// 履歴が増えていること、最初の履歴が保持されていること
		expect(next.histories.length).toBe(2);
		expect(next.histories[0]).toMatchObject({ members });

		// リトライした場合は履歴が増えないこと
		const retried = retry(next);
		expect(retried.histories.length).toBe(next.histories.length);
		expect(retried.histories[0]).toStrictEqual(next.histories[0]);
		// 最後の履歴が変わっていること
		expect(getLatestMembers(retried)).not.toStrictEqual(getLatestMembers(next));

		const leaveMemberId = retried.histories[0].members[0][0];
		const left = leave(retried, leaveMemberId);

		// メンバーが減っていること
		expect(left.members.length).toBe(12);

		// 除隊したメンバーの履歴に削除マーカーが立っていること
		expect(left.histories[0].deleted).toBe(true);
	});
});
