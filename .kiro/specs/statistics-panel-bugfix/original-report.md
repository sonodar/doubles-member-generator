# 統計パネル バグ修正: t_wada 流 TDD（E2E テスト駆動）

## Context

統計パネル（MemberCountPane）に途中参加者の統計表示に関する 3 つのバグがある（`.local/plans/dapper-exploring-meerkat.md`）。以前ロジックの単体テストでバグ修正を行った際、**ロジックの I/O は正しいのに画面表示が正しくない**ことが頻発した。この教訓を踏まえ、ロジックテストではなく **MemberCountPane コンポーネントの E2E テスト**（React Testing Library による UI レンダリングテスト）を先に書き、画面に表示される値とハイライトを直接アサートする。

テストデータは `src/testing/statistics/` の pattern1-12 を使用する（整合性検証済み）。

---

## 3 つのバグ

| # | バグ | 現在のコード | あるべき動作 |
|---|------|------------|------------|
| 1 | **総プレイのハイライト**: `playCount` のみで判定 | `count.ts:20` `toCountPerMember` が `playCount` のみ | `effectivePlayCount`（= playCount + baseCount）で中央値・差分を計算 |
| 2 | **総休憩の回数表示**: 参加前の履歴も休憩カウント | `count.ts:36-38` `getTotalRestCount` が全履歴走査 | `joinedAt` 以降の履歴のみ対象 |
| 3 | **総休憩のハイライト**: 上記の誤った値で判定 | バグ 2 に起因 | バグ 2 が修正されれば自動的に修正 |

**前提**: `PlayCount` 型（`types.ts:9`）に `joinedAt` フィールドがないため、まず型拡張が必要。

---

## TDD サイクル

### Phase 0: テスタビリティ確保（コンポーネントに data 属性追加）

現在の `MemberCountPane.tsx` の `CountPain` コンポーネントにはテスト用の識別子がない。ハイライトレベルと表示値を E2E でアサートするために、最小限の data 属性を追加する。

**`MemberCountPane.tsx:80-81`** を修正:
```tsx
// Before
<Box bg={color} color={members.includes(id) ? "" : "white"}>

// After
<Box bg={color} color={members.includes(id) ? "" : "white"}
     data-member-id={id} data-highlight={level}>
```

これにより `screen.getByTestId` ではなく `container.querySelector('[data-member-id="14"]')` でメンバー別に要素を取得でき、`dataset.highlight` でハイライトレベルをアサートできる。

**完了条件**: `npm run check` → 全 PASS（format + lint + typecheck + test）

### Phase 1: RED — 失敗するテストを書く

`src/components/common/MemberCountPane.statistics.test.tsx` を新規作成。

テストデータの各パターンからテストケースを生成。`MemberCountPane` を `settings` prop で直接レンダリングし、**画面に表示される値**をアサートする。

```typescript
// テスト構造イメージ
import { standardPatterns } from "../../testing/statistics";

describe("統計パネル: 途中参加者の表示", () => {
  // パターンごとにテストケースを動的生成
  for (const pattern of standardPatterns) {
    describe(pattern.description, () => {
      for (const [memberId, expected] of Object.entries(pattern.expected)) {
        // 1. 総プレイタブ: 表示値
        it(`member ${memberId}: 総プレイ数が ${expected.playCount} と表示される`)

        // 2. 総プレイタブ: ハイライト
        if (expected.highlightLevel?.playCount)
          it(`member ${memberId}: 総プレイのハイライトが ${expected.highlightLevel.playCount}`)

        // 3. 総休憩タブ: 表示値
        if (expected.totalRestCount !== undefined)
          it(`member ${memberId}: 総休憩数が ${expected.totalRestCount} と表示される`)

        // 4. 総休憩タブ: ハイライト
        if (expected.highlightLevel?.totalRestCount)
          it(`member ${memberId}: 総休憩のハイライトが ${expected.highlightLevel.totalRestCount}`)

        // 5. 連続休憩タブ: 表示値
        if (expected.consecutiveRestCount !== undefined)
          it(`member ${memberId}: 連続休憩数が ${expected.consecutiveRestCount} と表示される`)

        // 6. 連続休憩タブ: ハイライト
        if (expected.highlightLevel?.restCount)
          it(`member ${memberId}: 連続休憩のハイライトが ${expected.highlightLevel.restCount}`)

        // 7. 警告（pattern10）
        if (expected.warning)
          it(`member ${memberId}: 警告表示`)
      }
    });
  }
});
```

アサート方法:
- **表示値**: タブ切替後、`[data-member-id="${id}"]` 内の `Text` 要素で値を検証
- **ハイライト**: `[data-member-id="${id}"]` の `data-highlight` 属性で検証
- **警告**: `[data-member-id="${id}"]` 内の `[data-testid="warning-indicator"]` の有無で検証

CurrentSettings の構築: テストデータの `members`, `histories`, `gameCounts`, `algorithm`, `courtCount` をそのまま使用。

**完了条件**: `npm run check` を実行し、今回の変更に起因しないエラーが発生していないこと。テストは FAIL が正常（RED 確認）。

### Phase 2: GREEN — 最小限のコード修正でテストを通す

修正順序（依存関係順）:

#### Step 1: `PlayCount` 型に `joinedAt` 追加
- `src/logic/types.ts:9`
- `joinedAt?: number`（optional にして既存データとの互換性維持）

#### Step 2: `join()` で `joinedAt` を設定
- `src/logic/join.ts:13`
- `joinedAt: newSettings.histories.length` を追加

#### Step 3: `getTotalRestCount` を修正
- `src/logic/count.ts:36-38`
- `joinedAt` パラメータを受け取り、`histories.slice(joinedAt)` で参加後のみカウント

#### Step 4: `getTotalRestCounts` を修正
- `src/logic/count.ts:40-45`
- `gameCounts` を受け取り、各メンバーの `joinedAt` を渡す

#### Step 5: `getContinuousRestCount` を修正（または呼び出し側で対応）
- `src/logic/util.ts:39-42` または `src/logic/count.ts:27-34`
- `joinedAt` 以降の履歴のみを対象にする

#### Step 6: `OutlierLevelProvider` を修正
- `src/logic/count.ts:55-81`
- `effectivePlayCount`（= playCount + baseCount）で中央値を計算し、playCount ハイライト判定に使用
- `totalRestCounts` の計算に `gameCounts` を渡す

**各ステップの完了条件**: `npm run check` を実行し、今回の変更に起因しないエラーが発生していないこと。ステップが進むにつれテストの FAIL 数が減っていくこと。

**Phase 2 全体の完了条件**: `npm run check` → **全 PASS**（GREEN 確認）

### Phase 3: REFACTOR

- テストが全て GREEN になった後、重複コードやロジックの整理
- `effectivePlayCount` の計算を関数に抽出（`toEffectivePlayCounts`）

**完了条件**: `npm run check` → **全 PASS**（リファクタリング後も壊れていないこと）

---

## 修正対象ファイル

| ファイル | Phase | 操作 |
|---------|-------|------|
| `src/components/common/MemberCountPane.tsx` | Phase 0 | data 属性追加（L80-81） |
| `src/components/common/MemberCountPane.statistics.test.tsx` | Phase 1 | 新規作成（E2E テスト） |
| `src/logic/types.ts` | Phase 2 | `PlayCount` に `joinedAt` 追加（L9） |
| `src/logic/join.ts` | Phase 2 | `joinedAt` 設定追加（L13） |
| `src/logic/count.ts` | Phase 2 | 主要バグ修正（L19-81） |
| `src/logic/util.ts` | Phase 2 | `getContinuousRestCount` 修正（L39-42） |

---

## 検証方法

**全 Phase 共通**: 各 Phase 完了時に `npm run check`（format + lint + typecheck + test）を実行し、全て PASS であること。

1. Phase 0 完了時: `npm run check` → 全 PASS（既存動作に影響なし）
2. Phase 1 完了時: `npm run check` → typecheck・lint は PASS、テストのみ FAIL（RED 確認）
3. Phase 2 各ステップ後: `npm run check` → FAIL 数が減っていくことを確認（typecheck・lint は常に PASS）
4. Phase 2 完了時: `npm run check` → **全 PASS**（GREEN 確認）
5. Phase 3 完了時: `npm run check` → **全 PASS**（リファクタリング後も壊れていないこと）
6. `npx tsx src/testing/statistics/verify-patterns.ts` → パターンデータの整合性確認（変更なし）
