# Research & Design Decisions

## Summary
- **Feature**: push-notification
- **Discovery Scope**: New Feature（Web Push API とバックエンド統合を含む新規機能）
- **Key Findings**:
  - AWS Amplify Gen2 は Web Push を直接サポートしていないため、web-push npm + Lambda で独自実装が必要
  - VAPID キーは全主要ブラウザで必須（Chrome, Firefox, Safari 16.4+, Edge）
  - 既存の Event テーブル DynamoDB Streams を活用し、Event 作成時に通知を発火するアーキテクチャが最適

## Research Log

### Web Push API とブラウザ対応
- **Context**: プッシュ通知の技術選定
- **Sources Consulted**:
  - [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
  - [web-push-libs/web-push](https://github.com/web-push-libs/web-push)
  - [Using Web Push with VAPID](https://rossta.net/blog/using-the-web-push-api-with-vapid.html)
- **Findings**:
  - Web Push Protocol は 2016年に標準化され、Firebase なしで直接利用可能
  - VAPID（Voluntary Application Server Identification）キーは全主要ブラウザで必須
  - Service Worker 登録には HTTPS が必要（localhost は例外）
  - Safari 16.4+ で Web Push サポート開始、iOS 16.4+ も対応
- **Implications**:
  - Firebase 不要で AWS のみで完結可能
  - VAPID キーペアを生成し、公開鍵はフロントエンド、秘密鍵はバックエンドで管理

### AWS Amplify Gen2 と Web Push
- **Context**: 既存バックエンドへの統合方法
- **Sources Consulted**:
  - [Amplify ServiceWorker Guide](https://docs.amplify.aws/lib/utilities/serviceworker/q/platform/js/)
  - [Amplify Push Notifications](https://aws.amazon.com/blogs/mobile/aws-amplify-supports-push-notifications/)
  - [GitHub Issue: Gen2 Push Notification](https://github.com/aws-amplify/amplify-flutter/issues/6128)
- **Findings**:
  - Amplify Gen2 は Web Push を直接サポートしていない
  - Amplify の Push Notifications は主にモバイル向け（FCM/APNs 経由）
  - ServiceWorker クラスは Gen1 のユーティリティとして存在するが、Gen2 での公式サポートは限定的
- **Implications**:
  - web-push npm ライブラリを使用した Lambda 関数で独自実装が必要
  - 既存の DynamoDB Streams + Lambda パターンを踏襲可能

### DynamoDB Streams による通知トリガー
- **Context**: イベント発生時の通知発火メカニズム
- **Sources Consulted**:
  - [AWS Lambda + DynamoDB Streams + web-push](https://levelup.gitconnected.com/how-to-send-web-push-notifications-for-free-with-aws-and-without-firebase-19d02eadf1f7)
  - [Guardian's Web Push Architecture](https://medium.com/the-guardian-mobile-innovation-lab/creating-our-web-push-service-91da44b38539)
- **Findings**:
  - DynamoDB Streams で INSERT イベントを検知し、Lambda で通知送信が可能
  - Guardian は web-push npm を Lambda で使用し、購読データを DynamoDB に保存
  - 通知送信は非同期で、1つの Lambda 呼び出しで複数の購読者に送信可能
- **Implications**:
  - 既存の eventCleaner と同様のパターンで pushNotifier Lambda を追加
  - Event テーブルの DynamoDB Streams を有効化し、INSERT トリガーで発火

### 購読情報の管理
- **Context**: プッシュ購読データの永続化と管理
- **Sources Consulted**:
  - [Web Push Notifications Guide](https://laurenelwhite.github.io/web-push-guide/)
  - [Demystifying Web Push](https://pqvst.com/2023/11/21/web-push-notifications/)
- **Findings**:
  - 購読情報には endpoint, p256dh キー, auth キーが含まれる
  - endpoint は購読者ごとに一意で、ブラウザベンダーのプッシュサービス URL
  - 購読は Environment に紐づけて管理（共有セッションごと）
  - 無効な購読（410 Gone, 404 Not Found）は自動削除が必要
- **Implications**:
  - Subscription モデルを新規作成し、Environment との 1:N 関係を定義
  - 購読情報は暗号化不要（endpoint 自体が capability URL として機能）

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Event テーブル Streams トリガー | Event INSERT 時に Lambda で通知 | 既存パターン踏襲、シンプル、遅延が少ない | Event テーブル Streams 有効化が必要 | **選択** |
| AppSync Mutation Resolver | GraphQL リゾルバ内で直接通知 | API レイヤーで完結 | Lambda 外での web-push 実行困難 | 却下 |
| SNS + Lambda | SNS 経由で通知キュー化 | スケーラビリティ高い | 過剰な複雑性、現規模では不要 | 却下 |

## Design Decisions

### Decision: Event テーブル DynamoDB Streams による通知トリガー
- **Context**: イベント発生時に購読者への通知を確実に配信する必要がある
- **Alternatives Considered**:
  1. AppSync Mutation 後に Lambda 呼び出し — API レイヤーでの制御が複雑
  2. SNS + Lambda — 小規模アプリには過剰
  3. Event テーブル DynamoDB Streams — シンプルで既存パターンと一貫性あり
- **Selected Approach**: Event テーブルに DynamoDB Streams を有効化し、INSERT イベントで pushNotifier Lambda を発火
- **Rationale**:
  - 既存の eventCleaner と同様のアーキテクチャパターン
  - Event 作成と通知が疎結合で、障害時も Event 保存は成功
  - Lambda の再試行機能でリトライを自動化
- **Trade-offs**:
  - Event テーブルに Streams を有効化する追加コスト（微小）
  - 通知失敗時のフォールバックは Lambda 側で実装
- **Follow-up**: Streams 有効化による既存機能への影響確認

### Decision: Subscription モデルの新規追加
- **Context**: 購読情報を永続化し、Environment ごとに管理する必要がある
- **Alternatives Considered**:
  1. Environment モデルに購読配列を埋め込み — スキーマ複雑化、1MB 制限リスク
  2. 独立した Subscription モデル — 正規化、柔軟性高い
- **Selected Approach**: Subscription モデルを新規作成し、Environment への外部キー参照
- **Rationale**:
  - 正規化により購読数増加に対応
  - 個別の購読削除・更新が容易
  - TTL による自動削除を Environment と連動可能
- **Trade-offs**: 追加のテーブル管理、クエリが若干複雑化
- **Follow-up**: Environment 削除時の Subscription クリーンアップを eventCleaner に統合

### Decision: VAPID キーの管理方法
- **Context**: VAPID 公開鍵・秘密鍵の安全な管理が必要
- **Alternatives Considered**:
  1. 環境変数で直接設定 — シンプルだがシークレット管理が弱い
  2. AWS Secrets Manager — セキュア、ローテーション可能
  3. Parameter Store SecureString — Secrets Manager より低コスト
- **Selected Approach**: AWS Systems Manager Parameter Store SecureString
- **Rationale**:
  - Secrets Manager より低コストで小規模アプリに適切
  - IAM ポリシーで Lambda のみアクセス許可
  - Amplify Gen2 CDK でパラメータ参照が容易
- **Trade-offs**: 自動ローテーション機能なし（VAPID キーは長期固定で問題なし）
- **Environment Strategy**: main（本番）とその他（develop, sandbox）で2セットのキーペアを使用
  - 本番: `/doubles-member-generator/main/vapid-*`
  - その他: `/doubles-member-generator/develop/vapid-*`
  - フロントエンド: Amplify 環境変数（main/develop）と direnv（ローカル）で公開鍵を分離
- **Lambda 設定**: Parameter Store パスは環境変数（`VAPID_PUBLIC_KEY_PARAM`, `VAPID_PRIVATE_KEY_PARAM`）で Lambda に渡し、コード内でのハードコードを回避
- **IaC 方針**: CDK は SecureString の値設定を非サポートのため、AWS CLI で手動作成。暗黙知を防ぐため `.kiro/steering/secrets.md` にシークレットの存在と背景を記載

### Decision: 主催者識別のためのクライアント ID
- **Context**: 主催者が自分のイベントで通知を受け取らないようにする
- **Alternatives Considered**:
  1. Cognito Identity ID — 一意だが取得にオーバーヘッド
  2. UUID をクライアントで生成 — シンプル、localStorage で永続化
  3. IP アドレス — プライバシー問題、NAT 下で不正確
- **Selected Approach**: crypto.randomUUID() でクライアント ID を生成し、localStorage に保存
- **Rationale**:
  - 追加の認証フローなしで一意性を確保
  - Event 発行時に senderUid を payload に含め、通知時に除外判定
- **Trade-offs**: ブラウザ/デバイス間で ID が異なる
- **Follow-up**: Event payload スキーマへの senderUid 追加

## Risks & Mitigations
- **Safari 16.4 未満の非対応** — 機能検出で graceful degradation、通知 UI を非表示
- **購読 endpoint の期限切れ** — 410/404 レスポンス時に Subscription を削除
- **Lambda 同時実行制限** — 大規模利用時は Reserved Concurrency 設定を検討
- **VAPID キー漏洩** — Parameter Store + IAM で最小権限アクセス
- **Subscription データ漏洩** — endpoint は capability URL のため、AppSync からの読み取りを禁止（`allow.guest().to(["create"])`）。読み取り・削除は Lambda のみ DynamoDB 直接アクセス

## References
- [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) — Web Push 標準仕様
- [web-push npm](https://github.com/web-push-libs/web-push) — Node.js 向け Web Push ライブラリ
- [Using Web Push with VAPID](https://rossta.net/blog/using-the-web-push-api-with-vapid.html) — VAPID 実装ガイド
- [AWS Lambda + web-push](https://levelup.gitconnected.com/how-to-send-web-push-notifications-for-free-with-aws-and-without-firebase-19d02eadf1f7) — Lambda での Web Push 実装例
- [Amplify Gen2 Documentation](https://docs.amplify.aws/react/build-a-backend/) — Amplify Gen2 バックエンド構築
