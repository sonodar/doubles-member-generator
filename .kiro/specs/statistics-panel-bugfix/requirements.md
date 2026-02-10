# Requirements Document

## Introduction

統計パネル（MemberCountPane）における途中参加者の統計表示に 3 つのバグが存在する。総プレイ回数のハイライト判定が `baseCount` を考慮していない問題、途中参加者の総休憩回数が参加前の履歴もカウントしている問題、およびそれに起因する総休憩ハイライトの誤判定である。本要件は、これらのバグを修正し、統計パネルが途中参加者に対して正確な統計情報とハイライトを表示することを保証する。修正は t_wada 流 TDD（E2E テスト駆動）アプローチで行い、MemberCountPane コンポーネントの UI レンダリングテストを先行して作成する。

詳細な分析と TDD サイクルの計画は [`original-report.md`](./original-report.md) を参照。

## Requirements

### Requirement 1: 総プレイ回数のハイライト判定の正確性

> **Source:** [`original-report.md`](./original-report.md) — バグ #1「総プレイのハイライト: `playCount` のみで判定」

**Objective:** サークル運営者として、途中参加者を含む全メンバーの総プレイ回数ハイライトが公平な基準で判定されることを望む。これにより、`baseCount`（途中参加時の補正値）を持つメンバーの実質的なプレイ回数が正しく反映され、不公平の検出精度が向上する。

#### Acceptance Criteria

1. When 統計パネルが総プレイ回数タブを表示する, the MemberCountPane shall `effectivePlayCount`（= `playCount` + `baseCount`）を用いて中央値を計算する
2. When 統計パネルが各メンバーの総プレイ回数ハイライトを判定する, the MemberCountPane shall `effectivePlayCount` と中央値の差分に基づいてハイライトレベルを決定する
3. While `baseCount` が 0 のメンバー（初期メンバー）の場合, the MemberCountPane shall 従来通り `playCount` のみでハイライト判定を行う（`effectivePlayCount` = `playCount` + 0 であるため動作に変更なし）

### Requirement 2: 途中参加者の総休憩回数表示の正確性

> **Source:** [`original-report.md`](./original-report.md) — バグ #2「総休憩の回数表示: 参加前の履歴も休憩カウント」

**Objective:** サークル運営者として、途中参加者の総休憩回数が参加後の履歴のみに基づいて表示されることを望む。これにより、参加前に行われたゲームが休憩としてカウントされる誤表示が解消される。

#### Acceptance Criteria

1. When 統計パネルが途中参加メンバーの総休憩回数を計算する, the MemberCountPane shall そのメンバーの参加時点（`joinedAt`）以降の履歴のみを対象として休憩回数をカウントする
2. When 統計パネルが初期メンバーの総休憩回数を計算する, the MemberCountPane shall 全履歴を対象として休憩回数をカウントする（従来動作と同一）
3. The MemberCountPane shall 各メンバーの参加時点を `PlayCount` 型の `joinedAt` フィールドで追跡する

### Requirement 3: 途中参加者の総休憩ハイライト判定の正確性

> **Source:** [`original-report.md`](./original-report.md) — バグ #3「総休憩のハイライト: 上記の誤った値で判定」（バグ #2 に起因）

**Objective:** サークル運営者として、途中参加者の総休憩ハイライトが正しい休憩回数に基づいて判定されることを望む。これにより、参加前の履歴による誤ったハイライト（過剰休憩の警告等）が解消される。

#### Acceptance Criteria

1. When 統計パネルが総休憩のハイライトを判定する, the MemberCountPane shall Requirement 2 で修正された正確な総休憩回数に基づいてハイライトレベルを決定する
2. When 途中参加メンバーの総休憩回数が修正された結果ハイライト対象外となる場合, the MemberCountPane shall そのメンバーにハイライトを適用しない

### Requirement 4: 途中参加時の参加時点記録

> **Source:** [`original-report.md`](./original-report.md) — 前提「`PlayCount` 型に `joinedAt` フィールドがないため、まず型拡張が必要」および Phase 2 Step 1-2

**Objective:** システムとして、メンバーが途中参加した際にその時点の履歴位置を記録し、以降の統計計算で利用可能にすることを望む。これにより、途中参加者に関する統計計算の正確性が担保される。

#### Acceptance Criteria

1. When 新しいメンバーが途中参加する, the join ロジック shall そのメンバーの `PlayCount` に現在の履歴数を `joinedAt` として記録する
2. While 初期メンバー（ゲーム開始時から参加）の場合, the join ロジック shall `joinedAt` を未設定（`undefined`）のままとし、全履歴を統計計算の対象とする
3. The `PlayCount` 型 shall `joinedAt` フィールドを optional なプロパティとして保持し、既存データとの後方互換性を維持する

### Requirement 5: テスタビリティの確保

> **Source:** [`original-report.md`](./original-report.md) — Phase 0「テスタビリティ確保（コンポーネントに data 属性追加）」

**Objective:** 開発者として、統計パネルの各メンバーの表示値とハイライトレベルを E2E テストでアサート可能にすることを望む。これにより、ロジックの I/O だけでなく実際の画面表示が正しいことを検証できる。

#### Acceptance Criteria

1. The MemberCountPane shall 各メンバーの統計表示要素に `data-member-id` 属性としてメンバー ID を付与する
2. The MemberCountPane shall 各メンバーの統計表示要素に `data-highlight` 属性としてハイライトレベルを付与する
3. When E2E テストが `[data-member-id="${id}"]` セレクタでメンバー要素を取得した場合, the MemberCountPane shall 対応するメンバーの統計情報を含む要素を返す

### Requirement 6: E2E テストによる回帰防止

> **Source:** [`original-report.md`](./original-report.md) — Phase 1「RED — 失敗するテストを書く」および検証方法

**Objective:** 開発者として、統計パネルの全パターン（pattern1-12）に対する E2E テストを整備し、今後の修正による回帰を防止することを望む。これにより、統計表示の正確性が継続的に保証される。

#### Acceptance Criteria

1. The テストスイート shall `src/testing/statistics/` の全パターン（pattern1-12）に対してテストケースを動的生成する
2. The テストスイート shall 各パターンの各メンバーについて、総プレイ回数の表示値をアサートする
3. The テストスイート shall 各パターンの各メンバーについて、総プレイ回数のハイライトレベルをアサートする
4. The テストスイート shall 各パターンの各メンバーについて、総休憩回数の表示値をアサートする
5. The テストスイート shall 各パターンの各メンバーについて、総休憩回数のハイライトレベルをアサートする
6. The テストスイート shall 各パターンの各メンバーについて、連続休憩回数の表示値とハイライトレベルをアサートする
7. Where 警告表示が期待されるパターンの場合, the テストスイート shall 警告インジケータの表示有無をアサートする
