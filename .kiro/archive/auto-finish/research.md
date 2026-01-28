# Research & Design Decisions

## Summary
- **Feature**: `auto-finish`
- **Discovery Scope**: Extension（既存システムへの機能追加）
- **Key Findings**:
  - Amplify Gen2 の `defineFunction` で `schedule` プロパティを使用してスケジュール実行が可能
  - 既存の `eventCleaner`、`pushNotifier` Lambda のパターンを踏襲可能
  - `silent: true` フラグは既に pushNotifier で対応済み（行 131）

## Research Log

### Amplify Gen2 スケジュール機能
- **Context**: 定期実行スケジュール（要件3）の実現方式を調査
- **Sources Consulted**: [AWS Amplify Gen2 Scheduling Functions](https://docs.amplify.aws/react/build-a-backend/functions/scheduling-functions/)
- **Findings**:
  - `defineFunction` の `schedule` プロパティで EventBridge Rules を自動設定
  - 自然言語表現（`"every day"`）または cron 表現が使用可能
  - 複数スケジュールを配列で指定可能
- **Implications**: 既存の Lambda 定義パターンに `schedule` を追加するだけで実現可能

### 既存アーキテクチャパターン
- **Context**: 既存の Lambda 関数パターンと統合方式を分析
- **Sources Consulted**: `amplify/functions/eventCleaner/`, `amplify/functions/pushNotifier/`
- **Findings**:
  - `defineFunction` で Lambda 定義、`backend.ts` で権限とイベントソースを設定
  - DynamoDB クライアントは `@aws-sdk/lib-dynamodb` の `DynamoDBDocumentClient` を使用
  - `resourceGroupName: "data"` で data スタックに配置し循環依存を回避
  - テーブル参照は `backend.data.resources.tables` から取得
- **Implications**: 同様のパターンで新規 Lambda を追加可能

### Event スキーマと silent フラグ
- **Context**: 要件6（Push 通知抑制）の実現方式を確認
- **Sources Consulted**: `amplify/functions/pushNotifier/handler.ts`
- **Findings**:
  - `EventPayload` 型に `silent` プロパティが既に存在（行 131 で判定）
  - `silent: true` の場合、pushNotifier は通知をスキップ
  - FINISH イベントタイプは通知対象（`NOTIFIABLE_EVENT_TYPES` に含まれる）
- **Implications**: 自動終了時に `silent: true` を含む FINISH イベントを発行すれば通知抑制が実現

### Environment テーブル構造
- **Context**: アイドル判定とfinishedAt更新の対象データを確認
- **Sources Consulted**: `amplify/data/resource.ts`
- **Findings**:
  - `Environment` モデル: `ttl`, `finishedAt`, `events` (hasMany)
  - `Event` モデル: `environmentID`, `type`, `payload`, `occurredAt`, `consumed`
  - `byEnvironment` インデックスで環境ID別のイベント取得が可能
  - `finishedAt` は `a.datetime()` 型（null許容）
- **Implications**: 既存スキーマで要件を満たせる、スキーマ変更不要

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| スケジュール Lambda | 単一 Lambda を日次スケジュールで実行 | シンプル、既存パターン踏襲、Amplify Gen2 ネイティブサポート | 大量の Environment がある場合のタイムアウト | 推奨 |
| Step Functions | ステートマシンでバッチ処理を制御 | 大規模処理に対応、リトライ制御が容易 | 過剰設計、Amplify Gen2 統合が複雑 | 将来的なスケールアウト時に検討 |

## Design Decisions

### Decision: 単一スケジュール Lambda 方式
- **Context**: 定期的なアイドル Environment 検出と終了処理の実現方式
- **Alternatives Considered**:
  1. 単一 Lambda + EventBridge Schedule — シンプルな日次バッチ
  2. Step Functions + EventBridge — 複雑なワークフロー制御
- **Selected Approach**: 単一 Lambda + EventBridge Schedule
- **Rationale**: 既存の Lambda パターン（eventCleaner, pushNotifier）と一貫性があり、Amplify Gen2 の `schedule` プロパティで簡潔に実装可能
- **Trade-offs**: 大量の Environment がある場合は Lambda タイムアウト（最大 15 分）に注意が必要
- **Follow-up**: 実運用でのパフォーマンス監視、必要に応じてページネーション実装

### Decision: FINISH イベント発行による通知連携
- **Context**: 自動終了時の共有画面更新と通知抑制
- **Alternatives Considered**:
  1. finishedAt 直接更新のみ — 共有画面が更新されない
  2. FINISH イベント発行 + silent フラグ — 共有画面更新かつ通知抑制
- **Selected Approach**: FINISH イベント発行 + silent: true フラグ
- **Rationale**: 既存の pushNotifier が silent フラグを尊重するため追加開発不要
- **Trade-offs**: イベント書き込みのオーバーヘッド（微小）
- **Follow-up**: なし

### Decision: 最終イベント基準のアイドル判定
- **Context**: アイドル状態の判定基準
- **Alternatives Considered**:
  1. Environment 更新日時ベース — updatedAt がない
  2. 最終イベントの occurredAt ベース — 既存インデックス活用可能
- **Selected Approach**: 最終イベントの occurredAt ベース、イベント無しの場合は createdAt
- **Rationale**: byEnvironment インデックスで効率的にクエリ可能
- **Trade-offs**: なし
- **Follow-up**: なし

## Risks & Mitigations
- **大量 Environment によるタイムアウト** — ページネーション実装、Lambda メモリ/タイムアウト調整で対応
- **同時実行による競合** — finishedAt 設定済みチェックで冪等性を確保
- **スケジュール実行の信頼性** — EventBridge Scheduler は高可用性、失敗時は次回実行で再検出

## References
- [AWS Amplify Gen2 Scheduling Functions](https://docs.amplify.aws/react/build-a-backend/functions/scheduling-functions/) — Amplify Gen2 でのスケジュール設定
- [EventBridge Scheduler L2 Construct](https://aws.amazon.com/blogs/devops/announcing-the-general-availability-of-the-amazon-eventbridge-scheduler-l2-construct/) — CDK での EventBridge Scheduler 設定
