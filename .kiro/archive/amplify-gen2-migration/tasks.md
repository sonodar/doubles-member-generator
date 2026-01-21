# Implementation Plan

## Overview

Amplify Gen 1 から Gen 2 への移行、および Astro から Vite + React (SPA) へのフロントエンドフレームワーク移行の実装タスク。design.md の 5 フェーズ移行戦略に基づく。

## Implementation Tasks

### Phase 0: 準備

- [x] 1. Gen 1 バックエンド設定の削除
  - Gen 1 の `amplify/` ディレクトリを削除（worktree 内）
  - JSON/CloudFormation ベースの設定ファイル群を除去
  - .gitignore から Gen 1 関連の記載を削除
  - git status で Gen 1 関連ファイルが残っていないかを確認
  - Gen 2 初期化の前提条件を整備
  - _Requirements: 11.1_

### Phase 1: Gen 2 バックエンド

- [ ] 2. Amplify Gen 2 バックエンドの初期化
- [x] 2.1 Gen 2 プロジェクト構造のセットアップ
  - `npm create amplify@latest` で Gen 2 初期化
  - `amplify/` ディレクトリに TypeScript ベースのバックエンド定義を配置
  - `@aws-amplify/backend` パッケージの導入
  - _Requirements: 1.1, 1.2_

- [x] 2.2 (P) GraphQL スキーマの定義
  - **参照**: `git show main:amplify/backend/api/DoublesMemberGenerator/schema.graphql`
  - `defineData()` を使用して GraphQL スキーマを TypeScript で定義
  - Event モデル（id, environmentID, type, payload, occurredAt, consumed）の作成
  - Environment モデル（id, ttl, finishedAt, events リレーション）の作成
  - EventType enum（INITIALIZE, JOIN, LEAVE, GENERATE, RETRY, FINISH）の定義
  - Event と Environment の間に hasMany/belongsTo リレーションを設定
  - byEnvironment セカンダリインデックス（environmentID, occurredAt）の設定
  - Identity Pool (guest) 認証の設定
  - TTL 属性（ttl フィールド）の設定
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.1_

- [x] 2.3 (P) EventCleaner Lambda 関数の定義
  - **参照**: `git show main:amplify/backend/function/DoublesMemberGeneratorEventCleaner/src/index.ts`
  - `defineFunction()` を使用して Lambda 関数を定義
  - Node.js 22 ランタイムの設定（Node.js 20 は 2026/04 に EOL のため）
  - TypeScript ハンドラーの実装
  - DynamoDB Streams からの REMOVE イベント処理ロジック
  - byEnvironment インデックスを使用した Event 検索
  - 関連 Event レコードの削除処理
  - `@aws-sdk/lib-dynamodb` は仕方なくバンドルに含める（除外するほうがハッキーになるため）
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 2.4 バックエンドリソースの統合と CDK カスタマイズ
  - `defineBackend()` で Data と Function を統合
  - CDK を使用して DynamoDB Streams イベントソースマッピングを設定
  - CDK を使用して DynamoDB の TTL 機能を有効化
  - Event テーブルへの読み取り・削除権限を Lambda に付与
  - 環境変数 EVENT_TABLE_NAME の設定
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 3.2, 4.2_

- [x] 2.5 サンドボックス環境の起動と疎通確認（手動）

  > **注意**: これは手動での確認作業です。AWS にリソースがデプロイされます。

  **手順**:
  1. ターミナルで以下を実行
     ```bash
     npx ampx sandbox
     ```
  2. デプロイ完了まで待機（初回は数分かかる）
  3. `amplify_outputs.json` がプロジェクトルートに生成されることを確認

  **確認ポイント**:
  - [x] `npx ampx sandbox` がエラーなく完了する
  - [x] `amplify_outputs.json` が生成される
  - [x] AWS コンソールで AppSync API が作成されている
  - [x] AWS コンソールで DynamoDB テーブル（Environment, Event）が作成されている
  - [x] AWS コンソールで EventCleaner Lambda が作成されている

  **トラブルシューティング**:
  - エラーが発生した場合は `amplify/` 配下の TypeScript コードを確認
  - `npx ampx sandbox delete` で環境を削除して再試行

  _Requirements: 8.1, 8.2_

### Phase 2: フロントエンド移行

- [x] 3. Vite + React SPA へのフレームワーク移行
- [x] 3.1 Vite ビルド環境のセットアップ
  - `vite.config.ts` の作成
  - `index.html` エントリーポイントの作成
  - Vite をビルドツールとして設定
  - 既存のパスエイリアス（@logic, @components 等）を Vite に移行
  - _Requirements: 5.1_

- [x] 3.2 React SPA エントリーポイントの作成
  - `src/main.tsx` の作成（React アプリケーションのマウント）
  - `src/App.tsx` の作成（ChakraProvider 適用）
  - Amplify の初期設定（`amplify_outputs.json` の読み込み）
  - 既存の UI ライブラリ（Chakra UI, Framer Motion, dnd-kit）の維持
  - 既存の状態管理（Jotai）の維持
  - _Requirements: 5.2, 5.3, 5.7, 5.8, 7.1_

- [x] 3.3 クライアントサイドルーティングの実装
  - react-router-dom の導入
  - `/` ルートで Main コンポーネントを表示
  - `/share/:id` ルートで Share コンポーネントを表示
  - 既存の Main, Share コンポーネントの Props 調整
  - _Requirements: 5.4, 5.5, 5.6_

- [x] 3.4 Amplify Data API クライアントの作成
  - `src/api/client.ts` の作成
  - `generateClient<Schema>()` による型安全なクライアント生成
  - Schema 型のエクスポート
  - _Requirements: 7.2_

- [x] 3.5 Event サービスの Amplify Data API 移行
  - **参照**: `git show main:src/api/event.ts`
  - DataStore を Amplify Data API に置き換え
  - `client.models.Event.create()` によるイベント発行
  - `client.models.Event.observeQuery()` によるリアルタイム同期
  - `client.models.Event.list()` による Event 一覧取得
  - 既存の eventEmitter, subscribeEvent, findAllEvents API インターフェースを維持
  - _Requirements: 7.3, 7.4, 7.5, 7.6_

- [x] 3.6 Environment サービスの Amplify Data API 移行
  - **参照**: `git show main:src/api/environment.ts`
  - DataStore を Amplify Data API に置き換え
  - `client.models.Environment.create()` による Environment 作成
  - `client.models.Environment.update()` による finishedAt 更新
  - 既存の createEnvironment, finishEnvironment API インターフェースを維持
  - _Requirements: 7.7_

- [x] 3.7 Astro 関連ファイルの削除
  - `astro.config.mjs` の削除
  - `src/pages/*.astro` の削除
  - `src/layouts/Layout.astro` の削除
  - `build-for-amplify-hosting.sh` の削除
  - `deploy-manifest.json` の削除
  - Astro 関連の npm 依存関係（astro, @astrojs/node, @astrojs/react）の削除
  - 不要になった npm スクリプトの更新
  - _Requirements: 11.4, 11.5, 11.6_

- [x] 3.8 Gen 1 生成コードの削除
  - `src/amplifyconfiguration.json` の削除
  - `src/api/models/` ディレクトリの削除
  - `src/api/graphql/` ディレクトリの削除
  - Gen 2 生成コードへの参照を更新
  - _Requirements: 11.2, 11.3_

### Phase 3: 手動動作確認（ユーザーテスト）

> **注意**: このフェーズは自動テストではなく、ブラウザでの手動確認です。
> 実際の AWS リソース（AppSync, DynamoDB）と通信するため、Sandbox 環境が必要です。

- [x] 4. 手動動作確認
- [x] 4.1 ローカル開発環境の起動確認

  **前提条件**: タスク 2.5（Sandbox 環境）が完了していること

  **手順**:
  1. ターミナル A で Sandbox を起動（起動済みならスキップ）
     ```bash
     npx ampx sandbox
     ```
  2. `amplify_outputs.json` が生成されていることを確認
  3. ターミナル B で開発サーバーを起動
     ```bash
     npm run dev
     ```
  4. ブラウザで `http://localhost:5173` を開く

  **確認ポイント**:
  - [x] 開発サーバーがエラーなく起動する
  - [x] ブラウザに初期設定画面が表示される
  - [x] ブラウザコンソールに Amplify 接続エラーがない

  _Requirements: 5.1_

- [x] 4.2 主要機能の手動テスト

  **手順と確認ポイント**:

  **A. 初期設定フロー（`/` ルート）**
  1. ブラウザで `http://localhost:5173` を開く
  2. コート数・メンバー数を設定して「開始」をクリック
  3. メンバーを追加する
  - [x] 初期設定画面が表示される
  - [x] 設定後、メンバー管理画面に遷移する
  - [x] メンバーが追加できる

  **B. 組み合わせ生成**
  1. メンバーを 4 人以上追加
  2. 「生成」ボタンをクリック
  - [x] 組み合わせが生成される
  - [x] 統計情報が表示される

  **C. 共有 URL（`/share/:id` ルート）**
  1. 「共有」ボタンをクリック
  2. 表示された共有 URL をコピー
  3. 新しいタブで共有 URL を開く
  - [x] 共有 URL が生成される
  - [x] 共有 URL で同じ組み合わせが表示される

  **D. リアルタイム同期**
  1. 2 つのブラウザタブで同じ環境を開く
  2. 一方のタブでメンバーを追加
  - [x] もう一方のタブに即座に反映される

  _Requirements: 2.1, 3.3, 5.5, 5.6, 7.3_

- [-] 4.3 EventCleaner Lambda の動作確認（オプション）

  > **注意**: TTL は 7 日間に設定されているため、完全な確認は困難です。
  > 必要に応じて一時的に短い TTL でテストするか、AWS コンソールで確認してください。

  **確認方法**:
  1. AWS コンソール > DynamoDB > Environment テーブルを開く
  2. TTL で期限切れになったレコードが削除されることを確認
  3. CloudWatch Logs で EventCleaner Lambda のログを確認
  4. Event テーブルから関連レコードが削除されていることを確認

  _Requirements: 3.3_

### Phase 4: ホスティング・ビルド設定

- [ ] 5. Amplify Static Hosting とビルド設定
- [x] 5.1 amplify.yml のビルド設定更新
  - Vite ビルド用に設定を簡略化
  - `npm run build` コマンドの設定
  - `dist` ディレクトリの出力設定
  - Gen 2 バックエンドデプロイ設定（main/develop はデプロイ、feature は参照のみ）
  - _Requirements: 6.5_

- [x] 5.2 (P) 開発コマンドスクリプトの整備
  - package.json に Gen 2 CLI コマンド用スクリプトを追加
  - `npx ampx sandbox` 用スクリプト
  - _Requirements: 8.3, 8.4, 8.5, 8.6_

- [ ] 5.3 Gen 2 アプリのデプロイ（develop ブランチ）（手動・Git + AWS コンソール）

  **手順**:

  **develop ブランチを Amplify に接続（AWS コンソール）**

  1. [AWS Amplify Console](https://console.aws.amazon.com/amplify/) を開く
  2. 「新しいアプリを作成」→「Git リポジトリをホスト」を選択
  3. GitHub リポジトリを選択し、`develop` ブランチを接続
  4. ビルド設定で `amplify.yml` が認識されていることを確認
  5. 「保存してデプロイ」をクリック
  6. デプロイ完了まで待機

  **確認ポイント**:
  - [x] Amplify Console でアプリが作成される
  - [x] ビルドが成功する（緑色のチェックマーク）
  - [-] ビルドログに `npx ampx pipeline-deploy --branch develop` が実行されている
    - 結果: if のログは出るけど実際に実行されたコマンドはログに出ないので不明
  - [x] `develop.*.amplifyapp.com` の一時ドメインが発行される

  _Requirements: 10.1, 10.2_

- [x] 5.4 Gen 2 アプリの動作確認（手動・ブラウザ）

  **手順**:
  1. Amplify Console で発行された一時ドメイン（`*.amplifyapp.com`）を開く
  2. タスク 4.2 と同様の機能テストを実施

  **確認ポイント**:
  - [x] 初期設定画面が表示される
  - [x] メンバー追加・組み合わせ生成が動作する
  - [x] 共有 URL が機能する
  - [x] リアルタイム同期が動作する

  _Requirements: 10.3_

- [x] 5.5 カスタムドメインの移行（手動・AWS コンソール）

  > **注意**: ダウンタイムが発生する可能性があります。計画的に実施してください。

  **手順**:
  1. **Gen 1 アプリからドメイン削除**
     - Amplify Console > Gen 1 アプリ > ドメイン管理
     - カスタムドメインを削除
  2. **Gen 2 アプリにドメイン追加**
     - Amplify Console > Gen 2 アプリ > ドメイン管理
     - 「ドメインを追加」をクリック
     - ドメイン名を入力して設定
  3. **SSL 証明書の待機**
     - 証明書のプロビジョニング完了まで待機（数分〜数時間）
  4. **DNS 伝播の確認**
     ```bash
     dig your-domain.com
     nslookup your-domain.com
     ```

  **確認ポイント**:
  - [x] Gen 1 アプリからドメインが削除された
  - [x] Gen 2 アプリにドメインが追加された
  - [x] SSL 証明書が有効になった（HTTPS でアクセス可能）
  - [x] カスタムドメインで全機能が動作する
  - [x] graphql リクエストが develop ブランチの AppSync URL を向いている

  _Requirements: 6.3, 6.4_

- [x] 5.6 Gen 1 アプリの削除（手動・AWS コンソール）

  > **警告**: この操作は取り消せません。Gen 2 アプリが正常に動作していることを確認してから実行してください。

  **手順**:
  1. Amplify Console > Gen 1 アプリ > 設定 > 全般
  2. 「アプリを削除」をクリック
  3. 確認ダイアログでアプリ名を入力して削除

  **確認ポイント**:
  - [x] Gen 1 アプリが削除された
  - [x] 関連する CloudFormation スタックが削除された（AWS CloudFormation コンソールで確認）

  _Requirements: 11.1_

- [ ] 5.7 マルチブランチ環境の設定（手動・Git + AWS コンソール）

  > **前提**:
  > - タスク 5.4〜5.6 で `develop` ブランチでの動作確認が完了していること
  > - カスタムドメインの移行が完了していること

  **手順**:

  **main ブランチを Amplify に接続（AWS コンソール）**

  1. [AWS Amplify Console](https://console.aws.amazon.com/amplify/) を開く
  2. Gen 2 アプリを選択
  3. 左メニュー「ホスティング」>「ブランチ」をクリック
  4. 「ブランチを接続」ボタンをクリック
  5. `main` ブランチを選択して接続
  6. デプロイ完了まで待機

  **確認ポイント（main）**:
  - [x] main ブランチのビルドが成功する
  - [x] ビルドログに `npx ampx pipeline-deploy --branch main` が実行されている
  - [x] main 用のバックエンドリソースが作成される（develop とは別）

  **C. カスタムドメインを main ブランチに切り替え（AWS コンソール）**

  > **注意**: タスク 5.6 で develop にカスタムドメインを設定済みの場合

  1. Amplify Console > ドメイン管理
  2. カスタムドメインの設定を編集
  3. 接続先ブランチを `develop` → `main` に変更
  4. SSL 証明書の再プロビジョニングを待機

  **確認ポイント（ドメイン切り替え）**:
  - [x] カスタムドメインが main ブランチを指している
  - [x] カスタムドメインでアクセスできる

  **D. feature ブランチの動作確認（オプション）**

  > **注意**: feature ブランチの自動デプロイを有効にする場合のみ実施

  1. feature ブランチを作成してプッシュ
     ```bash
     git checkout develop
     git checkout -b feature/test-branch
     git push -u origin feature/test-branch
     ```

  2. Amplify Console で feature ブランチを接続

  3. ビルドログを確認
     - `npx ampx generate outputs --branch develop` が実行されていること
     - バックエンドのデプロイは**されない**こと

  **確認ポイント（feature）**:
  - [ ] feature ブランチのビルドが成功する
  - [ ] ビルドログに `npx ampx generate outputs --branch develop` が実行されている
  - [ ] feature ブランチは develop のバックエンドを参照している
  - [ ] 新しいバックエンドリソースは作成されない

  **環境構成まとめ**:

  | ブランチ | バックエンド | 用途 |
  |----------|-------------|------|
  | main | main 環境を**デプロイ** | 本番（カスタムドメイン） |
  | develop | develop 環境を**デプロイ** | 開発・テスト |
  | feature/* | develop 環境を**参照のみ** | 機能開発（プレビュー） |

  _Requirements: 10.4, 10.5_

## Requirements Coverage

| Requirement | Tasks |
|-------------|-------|
| 1 (Gen 2 バックエンド定義) | 2.1, 2.4 |
| 2 (GraphQL API 移行) | 2.2, 4.2 |
| 3 (Lambda 関数移行) | 2.3, 2.4, 4.2 |
| 4 (TTL 設定) | 2.2, 2.4 |
| 5 (フロントエンド移行) | 3.1, 3.2, 3.3, 4.1, 4.2 |
| 6 (Static Hosting) | 5.1, 5.2, 5.6 |
| 7 (データアクセス移行) | 3.2, 3.4, 3.5, 3.6 |
| 8 (開発ワークフロー) | 2.5, 5.3 |
| 9 (ドキュメント更新) | 除外（ドキュメントタスク） |
| 10 (CI/CD 更新) | 5.4, 5.5, 5.8 |
| 11 (クリーンアップ) | 1, 3.7, 3.8, 5.7 |
