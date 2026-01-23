# Research & Design Decisions

## Summary
- **Feature**: `realtime-sharing-reconnection`
- **Discovery Scope**: Extension（既存システムの拡張）
- **Key Findings**:
  - iOS Safari はバックグラウンド時に WebSocket を切断し、復帰時に自動再接続しないケースがある
  - Page Visibility API の `visibilitychange` イベントは Safari で信頼性が低く、`pagehide`/`pageshow` との併用が必要
  - AWS Amplify の subscription は自動再接続機能を持つが、iOS Safari でのバックグラウンド復帰時には手動での再 subscribe が必要

## Research Log

### iOS Safari のライフサイクルイベント動作
- **Context**: iOS Safari でタブ/アプリがバックグラウンドに回った際の WebSocket 切断問題を解決するために、利用可能なブラウザイベントを調査
- **Sources Consulted**:
  - [MDN Web Docs: Window pagehide event](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event)
  - [trivago tech blog: Exploring the Page Visibility API](https://tech.trivago.com/post/2020-11-17-exploringthepagevisibilityapifordetectin)
  - [DoubleVerify Engineering: BFCache support](https://medium.com/doubleverify-engineering/the-3-things-you-need-to-know-before-adding-support-to-bfcache-in-your-site-36abf204d1d4)
  - [WebKit Bug 202399](https://bugs.webkit.org/show_bug.cgi?id=202399)
- **Findings**:
  - Safari は `visibilitychange` イベントをページナビゲーション時に発火しない
  - `pagehide` イベントは bfcache コンテキストで特に重要
  - イベント発火順序: `beforeunload` → `pagehide` → `visibilitychange`（unload時）
  - bfcache からの復帰時は `pageshow` イベントのみ発火（`event.persisted === true`）
  - モバイルでは `visibilitychange` をリッスンすることでブラウザプロセス終了を検知可能
- **Implications**:
  - 復帰検知には `visibilitychange`（`document.visibilityState === "visible"`）と `pageshow`（`event.persisted === true`）の両方をリッスンする必要がある
  - 離脱検知には `pagehide` をリッスンして subscription を解除する
  - `online`/`offline` イベントでネットワーク状態変化も検知する

### iOS Safari WebSocket 切断問題
- **Context**: iOS Safari でバックグラウンド→フォアグラウンド復帰時に WebSocket が切断される問題の詳細調査
- **Sources Consulted**:
  - [graphql-ws Discussion #290](https://github.com/enisdenjo/graphql-ws/discussions/290)
  - [socket.io Issue #2924](https://github.com/socketio/socket.io/issues/2924)
  - [trpc Issue #4078](https://github.com/trpc/trpc/issues/4078)
  - [WebKit Bug 228296](https://bugs.webkit.org/show_bug.cgi?id=228296)
  - [Apple Developer Forums](https://developer.apple.com/forums/thread/716118)
- **Findings**:
  - iOS 15 以降で WebSocket が切断される問題が報告されている（リグレッション）
  - Safari がバックグラウンドに移行すると WebSocket サーバーはクライアントの切断を認識
  - フォアグラウンド復帰時に `onerror` と `onclose` イベントを受信
  - `visibilitychange` イベントは接続が既に失われた後に発火する可能性がある
  - Safari は Background Sync API をサポートしていない
- **Implications**:
  - `visibilitychange` で `visible` になった時点で subscription を再作成する必要がある
  - graphql-ws では `CloseEvent` を dispatch して強制的に再接続をトリガーする手法が有効
  - 本プロジェクトでは `sync()` 関数で「既存 subscription 解除 → 新規 subscribe → 最新状態 fetch」を実行する設計が適切

### AWS Amplify Gen2 Subscription の再接続動作
- **Context**: Amplify Gen2 の `observeQuery` や subscription の自動再接続動作を調査
- **Sources Consulted**:
  - [AWS Amplify Gen 2 Documentation: Subscribe to real-time events](https://docs.amplify.aws/react/build-a-backend/data/subscribe-data/)
  - [amplify-js Issue #3039](https://github.com/aws-amplify/amplify-js/issues/3039)
  - [amplify-js Issue #1448](https://github.com/aws-amplify/amplify-js/issues/1448)
  - [amplify-js Issue #7057](https://github.com/aws-amplify/amplify-js/issues/7057)
  - [amplify-js Issue #9824](https://github.com/aws-amplify/amplify-js/issues/9824)
- **Findings**:
  - Amplify の subscription は自動再接続機能を持つが、オフライン中のメッセージは自動的にキャッチアップしない
  - WebSocket 切断後に再 subscribe しても接続が復旧しないケースが報告されている
  - `unsubscribe` 成功時のコールバック/Promise が提供されていない
  - React Native iOS でバックグラウンド→フォアグラウンド復帰時に再接続が機能しないケースあり
  - 10秒のタイムアウトを設けてから再接続する workaround が報告されている
- **Implications**:
  - Amplify の自動再接続に依存せず、アプリケーション側で明示的に再 subscribe する
  - 既存の subscription を `unsubscribe()` してから新規に `subscribe()` を実行
  - 切断中に発生したイベントは API fetch で回収する（`findAllEvents` を使用）

### Singleflight パターン
- **Context**: 複数のライフサイクルイベントが同時に発火した場合の二重実行防止パターンを調査
- **Sources Consulted**:
  - [SingleFlight: Smart Request Deduplication - DEV Community](https://dev.to/serifcolakel/singleflight-smart-request-deduplication-33og)
  - [promise-singleflight - npm](https://www.npmjs.com/package/promise-singleflight)
  - [dedup-async - GitHub](https://github.com/nanw1103/dedup-async)
- **Findings**:
  - Singleflight パターンは同時発生する同一リクエストを1つにまとめ、結果を共有する
  - Memoization とは異なり、実行中の Promise のみを共有し、完了後はキャッシュしない
  - エラー発生時は全ての待機呼び出しが同じエラーを受け取る
  - タイムアウト/デッドラインの設定が推奨される
- **Implications**:
  - `sync()` 関数に singleflight パターンを適用し、二重実行を防止
  - 実行中の Promise 参照を保持し、新たな呼び出しは既存の Promise に合流
  - エラー時は Promise 参照をクリアして次回の呼び出しで再実行可能にする
  - `cleanup()` 時に Promise 参照もクリアしてリソースリークを防止

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| イベントリスナー + sync/cleanup | コンポーネントマウント時にイベントハンドラ登録、sync()とcleanup()で状態管理 | シンプル、2つの概念のみ、既存パターンとの親和性高い | イベントハンドラの登録/解除漏れリスク | 要件に最も適合 |
| カスタムフック抽出 | useRealtimeSync() としてロジックをフックに抽出 | 再利用可能、テストしやすい、責務分離 | フック設計の複雑さ | **採用**: UI/Logic 分離の原則を強化 |
| 状態マシン導入 | connected/disconnected/syncing 等の状態を明示的に管理 | 状態遷移が明確、デバッグしやすい | 複雑化、pause概念の導入が必要になる可能性 | 要件で「pause概念は導入しない」と明記されているため不採用 |

## Design Decisions

### Decision: カスタムフック useRealtimeSync への抽出
- **Context**: ライフサイクル管理ロジックを SharedPane コンポーネント内に実装するか、カスタムフックに抽出するかの選択
- **Alternatives Considered**:
  1. コンポーネント内に直接実装 — シンプルだが責務が混在
  2. カスタムフック抽出 — テスト容易、責務分離、再利用可能
- **Selected Approach**: `useRealtimeSync` カスタムフックに抽出
- **Rationale**:
  - steering の UI/Logic 分離原則に従う
  - フック単体でのユニットテストが容易になる
  - SharedPane は UI 表示に専念できる
  - 将来的に他の画面で同様の機能が必要になった場合に再利用可能
- **Trade-offs**:
  - 利点: テスト容易性、責務分離、再利用性
  - 欠点: フック設計の複雑さ（許容範囲）
- **Follow-up**: なし

### Decision: sync() と cleanup() による二関数設計
- **Context**: 要件で「`sync()` と `cleanup()` の2つの概念のみで成立させ `pause` 概念は導入しない」と明記されている
- **Alternatives Considered**:
  1. connect/disconnect/pause の3状態管理 — より細かな制御が可能だが複雑
  2. 単一の refresh() 関数 — シンプルだが cleanup の明示的な実行ができない
- **Selected Approach**: `sync()` と `cleanup()` の2関数で全てのケースを処理
- **Rationale**:
  - `sync()` は常に「既存 subscription 解除 → 新規 subscribe → 最新状態 fetch」を実行
  - 初期化時も復帰時も同じ `sync()` を呼び出すだけで済む
  - `cleanup()` はアンマウント時と `pagehide` 時に呼び出し、リソースを解放
- **Trade-offs**:
  - 利点: シンプルで理解しやすい、テストしやすい
  - 欠点: 復帰時に毎回 subscription を再作成するオーバーヘッド（許容範囲）
- **Follow-up**: 復帰時の subscription 再作成が数秒以内に完了することを E2E テストで検証

### Decision: Singleflight による二重実行防止
- **Context**: `visibilitychange` と `pageshow` が同時に発火する可能性がある
- **Alternatives Considered**:
  1. デバウンス — 一定時間後に実行するため遅延が発生
  2. フラグによる排他制御 — 非同期処理との相性が悪い
  3. Singleflight パターン — 実行中の Promise を共有
- **Selected Approach**: Singleflight パターンで実行中の Promise を共有
- **Rationale**: 遅延なく即座に処理を開始でき、同時発火時も1回の実行で結果を共有
- **Trade-offs**:
  - 利点: 遅延なし、リソース効率が良い
  - 欠点: エラー時の影響範囲が全ての待機呼び出しに及ぶ
- **Follow-up**: エラー時は Promise 参照をクリアして次回呼び出しで再実行可能にする

### Decision: アンマウント済みチェックによる安全性確保
- **Context**: `sync()` 実行中にコンポーネントがアンマウントされる可能性がある
- **Alternatives Considered**:
  1. AbortController — fetch をキャンセル可能だが subscription 作成には適用困難
  2. フラグチェック — シンプルで確実
- **Selected Approach**: mounted フラグをチェックし、アンマウント済みなら subscription 作成をスキップ
- **Rationale**: React の一般的なパターンであり、理解しやすく確実
- **Trade-offs**:
  - 利点: シンプル、確実
  - 欠点: なし
- **Follow-up**: なし

## Risks & Mitigations
- **Risk 1**: iOS Safari の動作がバージョンによって異なる可能性 — 複数バージョンでの E2E テストを実施
- **Risk 2**: Amplify の内部動作が将来変更される可能性 — Amplify のリリースノートを監視、明示的な再 subscribe で依存を最小化
- **Risk 3**: 複数イベントの同時発火によるレースコンディション — Singleflight パターンで防止

## References
- [MDN Web Docs: Window pagehide event](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event) — ブラウザライフサイクルイベントの公式ドキュメント
- [AWS Amplify Gen 2 Documentation: Subscribe to real-time events](https://docs.amplify.aws/react/build-a-backend/data/subscribe-data/) — Amplify subscription の公式ドキュメント
- [graphql-ws Discussion #290](https://github.com/enisdenjo/graphql-ws/discussions/290) — iOS Safari WebSocket 切断問題の議論
- [promise-singleflight - npm](https://www.npmjs.com/package/promise-singleflight) — Singleflight パターンのリファレンス実装
