# Research & Design Decisions

## Summary
- **Feature**: `shared-view-statistics-e2e`
- **Discovery Scope**: Extension（既存テスト基盤の拡張）
- **Key Findings**:
  - 共有画面の `replayEvents()` は SharedPane.tsx 内のローカル関数であり、テストから直接呼び出せない
  - テストデータ（`StatisticsTestData`）と共有画面のイベント（`Event[]`）はフォーマットが異なり、変換層が必要
  - メイン画面テストは `buildGameCounts()` で histories を直接リプレイするが、共有画面は `replayEvent()` で Event を 1 件ずつ処理する経路が異なる

## Research Log

### テストデータ形式と Event 形式の差異
- **Context**: 共有画面のイベントリプレイ経路でテストするには、`StatisticsTestData` を `Event[]` に変換する必要がある
- **Sources Consulted**: `src/testing/statistics/index.ts`, `src/api/types.ts`, `src/api/event.ts`
- **Findings**:
  - `StatisticsTestData`: `{ members, histories, joiners, algorithm, courtCount, expected }` 形式。histories は `History[]`、joiners は `{ [historyIndex]: { id } }` のマップ
  - `Event[]`: `{ id, type, occurredAt, payload? }` 形式。Initialize → Join/Generate/Retry/Leave/Finish のシーケンス
  - 変換ロジック: 初期メンバーで Initialize → 各 history index で joiner があれば Join、その後 Generate を発行
- **Implications**: テストユーティリティに変換関数を追加する必要がある。Join イベントは payload なし（メンバーID は内部で自動採番）のため、joiner の ID が一致するかは join() ロジックの実装に依存する

### replayEvents のテスタビリティ
- **Context**: `replayEvents()` は SharedPane.tsx 内のローカル関数で、export されていない
- **Sources Consulted**: `src/components/shared/SharedPane.tsx`
- **Findings**:
  - ローカル関数のため、直接インポートしてテストできない
  - 内部実装は `api/event.ts` の `replayEvent()` を reduce で呼ぶだけ
  - テスト方法として 2 つのアプローチが考えられる:
    1. `replayEvents()` を別モジュールに抽出して単体テスト可能にする
    2. SharedPane コンポーネント全体をレンダリングし、DOM 上の統計値を検証する
- **Implications**: アプローチ 1 が関心の分離として適切。抽出後もテスト対象のコードパスは同一

### join() イベントとメンバーID自動採番
- **Context**: Join イベントには payload がなく、`join()` ロジックが `Math.max(...members) + 1` で新 ID を採番する
- **Sources Consulted**: `src/logic/join.ts`
- **Findings**:
  - `StatisticsTestData` の joiners は `{ "8": { id: 14 } }` のように特定 ID を指定するが、`join()` は自動採番
  - テストデータの初期メンバーと joiner の ID が `join()` の自動採番ロジックと整合する必要がある
  - 実際のパターンでは初期メンバーが `[1..13]` で joiner が `{ id: 14 }` のように設計されており、整合している
- **Implications**: 変換関数は joiner の ID が `join()` の採番結果と一致することを前提にできる。ただし、複数 joiner の順序が重要

## Design Decisions

### Decision: テストデータ → Event 変換関数の導入
- **Context**: 共有画面のイベントリプレイ経路を通じてテストするため、既存の `StatisticsTestData` を `Event[]` に変換する必要がある
- **Alternatives Considered**:
  1. 各パターンに対して手動で Event[] を定義する → テストデータの二重管理
  2. StatisticsTestData → Event[] の変換関数を作成する → 単一データソース
  3. buildGameCounts をリファクタリングして Event 経由にする → 影響範囲が大きい
- **Selected Approach**: Option 2 — 変換関数を `src/testing/statistics/` に追加
- **Rationale**: 既存テストデータを再利用でき、新パターン追加時も自動的にカバーされる
- **Trade-offs**: 変換ロジック自体の正しさを担保する必要があるが、入力データが固定なのでリスクは低い

### Decision: replayEvents の抽出
- **Context**: テストで共有画面のイベントリプレイ経路を通すため、ローカル関数を別モジュールに抽出する
- **Alternatives Considered**:
  1. SharedPane コンポーネント全体をレンダリングしてDOM検証 → 重い、UIモックが多い
  2. replayEvents を別モジュールに抽出して単体テスト → 軽量、正確
- **Selected Approach**: Option 2
- **Rationale**: 統計値の正しさは replayEvents の出力する CurrentSettings で決まるため、コンポーネントレンダリングは不要
- **Trade-offs**: SharedPane.tsx に変更が入るが、ロジックの移動のみで振る舞いは変わらない

## Risks & Mitigations
- join() の自動採番がテストデータの joiner ID と不整合する場合 → 変換関数内でアサーションを入れて早期検出
- replayEvents 抽出時に import パスの変更漏れ → TypeScript コンパイルで検出可能
