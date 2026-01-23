# Requirements Document

## Project Description (Input)
Amplify Gen 2 への移行。データ移行はしなくて良い。

## Introduction

本ドキュメントは、AWS Amplify Gen 1 から Gen 2 へのフル移行に関する要件を定義する。対象は以下を含む：

1. **バックエンド**: Amplify Gen 1 (CLI) → Gen 2 (TypeScript/CDK)
2. **データアクセス**: DataStore → Amplify Data API
3. **フロントエンド**: Astro + React → **Vite + React (SPA)**
4. **ホスティング**: Amplify SSR Hosting → **Amplify Static Hosting**

データ移行は対象外とし、新規デプロイとして扱う。

### 現在のアーキテクチャ（Gen 1）

**バックエンド:**
- AppSync GraphQL API（Identity Pool 認証）
- DynamoDB テーブル（Event, Environment）
- Lambda 関数（EventCleaner: DynamoDB Streams トリガー）
- DataStore を使用したクライアント同期

**フロントエンド/Hosting:**
- Astro + React（SSR モード）
- カスタムビルドスクリプト（build-for-amplify-hosting.sh）
- deploy-manifest.json によるルーティング設定

### 移行後のアーキテクチャ（Gen 2）

**バックエンド:**
- Amplify Gen 2 Data（TypeScript でスキーマ定義）
- DynamoDB テーブル（Event, Environment）
- Amplify Gen 2 Function（EventCleaner）
- Amplify Data API を使用したクライアント同期

**フロントエンド/Hosting:**
- **Vite + React（SPA）**
- **Amplify Static Hosting**
- カスタムビルド設定不要

### Gen 1 と Gen 2 の主な違い

| 観点 | Gen 1 | Gen 2 |
|------|-------|-------|
| リソース定義 | CLI コマンド（`amplify add`） | TypeScript コード（`defineBackend()`） |
| 設定ファイル | JSON/YAML（backend-config.json 等） | TypeScript（amplify/backend.ts） |
| 環境管理 | `amplify env` コマンド | Git ブランチベース自動環境 |
| ローカル開発 | `amplify mock` | `npx ampx sandbox` |
| デプロイ | `amplify push` | Git push または `npx ampx pipeline-deploy` |
| クライアント設定 | amplifyconfiguration.json | amplify_outputs.json |
| IaC | CloudFormation テンプレート | AWS CDK |
| データアクセス | DataStore | Amplify Data API |

## Requirements

### Requirement 1: Amplify Gen 2 バックエンド定義の作成

**Objective:** As a 開発者, I want Amplify Gen 2 形式でバックエンドリソースを定義する, so that 最新の Amplify フレームワークを活用し、TypeScript による型安全な開発ができる

#### Acceptance Criteria

1. The Amplify Gen 2 Backend shall `amplify/` ディレクトリに TypeScript ベースのバックエンド定義を配置する
2. The Amplify Gen 2 Backend shall `amplify/backend.ts` で `defineBackend()` を使用してバックエンドリソースを宣言的に定義する
3. The Amplify Gen 2 Backend shall `amplify/data/resource.ts` で Data リソースを定義する
4. The Amplify Gen 2 Backend shall `amplify/functions/` ディレクトリで Lambda 関数を定義する
5. The Amplify Gen 2 Backend shall AWS CDK を使用してカスタムリソース（DynamoDB Streams トリガー等）を定義する

### Requirement 2: GraphQL API の移行

**Objective:** As a 開発者, I want 既存の GraphQL スキーマを Gen 2 形式で再定義する, so that 現在の API インターフェースを維持しながら Gen 2 の機能を活用する

#### Acceptance Criteria

1. The Amplify Gen 2 Data shall `defineData()` を使用して GraphQL スキーマを定義する
2. The Amplify Gen 2 Data shall Event モデル（id, environmentID, type, payload, occurredAt, consumed）を定義する
3. The Amplify Gen 2 Data shall Environment モデル（id, ttl, finishedAt, Events リレーション）を定義する
4. The Amplify Gen 2 Data shall EventType enum（INITIALIZE, JOIN, LEAVE, GENERATE, RETRY, FINISH）を定義する
5. The Amplify Gen 2 Data shall Event と Environment の間に hasMany/belongsTo リレーションを設定する
6. The Amplify Gen 2 Data shall byEnvironment セカンダリインデックス（environmentID での検索用）を維持する
7. The Amplify Gen 2 Data shall Identity Pool (guest) 認証を設定する

### Requirement 3: Lambda 関数の移行

**Objective:** As a 開発者, I want EventCleaner Lambda 関数を Gen 2 形式で再定義する, so that Environment 削除時の Event クリーンアップ機能を維持する

#### Acceptance Criteria

1. The Amplify Gen 2 Function shall `defineFunction()` を使用して EventCleaner Lambda 関数を定義する
2. The Amplify Gen 2 Backend shall CDK を使用して DynamoDB Streams イベントソースマッピングを設定する
3. When Environment レコードが削除された場合, the EventCleaner Function shall 関連する全ての Event レコードを削除する
4. The Amplify Gen 2 Function shall Event テーブルへの読み取り・削除権限を持つ
5. The Amplify Gen 2 Function shall Node.js 22 ランタイムを使用する
6. The Amplify Gen 2 Function shall TypeScript でハンドラーを実装する

### Requirement 4: TTL（Time To Live）設定

**Objective:** As a 開発者, I want Environment テーブルの TTL 設定を維持する, so that 古いデータが自動的に削除される

#### Acceptance Criteria

1. The Amplify Gen 2 Data shall Environment テーブルに TTL 属性（ttl フィールド）を設定する
2. The Amplify Gen 2 Backend shall CDK を使用して DynamoDB の TTL 機能を有効化する

### Requirement 5: フロントエンドフレームワーク移行（Astro → Vite + React）

**Objective:** As a 開発者, I want フロントエンドを Vite + React (SPA) に移行する, so that シンプルな構成でメンテナンス性を向上させる

#### Background

現在の Astro + React 構成では SSR が不要であり、Vite + React (SPA) に移行することでビルド設定を大幅に簡略化できる。

#### Acceptance Criteria

1. The Frontend shall Vite をビルドツールとして使用する
2. The Frontend shall React 18 を UI ライブラリとして維持する
3. The Frontend shall 既存の React コンポーネント（`src/components/`）をそのまま流用する
4. The Frontend shall react-router-dom を使用してクライアントサイドルーティングを実装する
5. The Frontend shall `/` ルートで Main コンポーネントを表示する
6. The Frontend shall `/share/:id` ルートで Share コンポーネントを表示する
7. The Frontend shall 既存の UI ライブラリ（Chakra UI, Framer Motion, dnd-kit）を維持する
8. The Frontend shall 既存の状態管理（Jotai）を維持する

### Requirement 6: Amplify Static Hosting の設定

**Objective:** As a 開発者, I want Amplify Static Hosting で SPA をホストする, so that シンプルなデプロイ設定で運用できる

#### Background

SSR が不要になったため、Static Hosting を使用する。カスタムビルドスクリプトや deploy-manifest.json は不要になる。

#### Acceptance Criteria

1. The Amplify Hosting shall Static Hosting モードで SPA をデプロイする
2. The Amplify Hosting shall SPA のフォールバックルーティング（全パスを index.html にリダイレクト）を設定する
3. The Amplify Hosting shall Git ブランチベースの自動デプロイをサポートする
4. The Amplify Hosting shall Gen 2 バックエンドと連携する
5. The amplify.yml shall Vite ビルド用に簡略化する（`npm run build`、`dist` ディレクトリ）

### Requirement 7: フロントエンド統合の更新（DataStore → Amplify Data API）

**Objective:** As a 開発者, I want フロントエンドのデータアクセス層を Gen 2 の Amplify Data API に移行する, so that 新しいバックエンドでリアルタイム同期を維持する

#### Background

Gen 2 では DataStore がサポートされていないため、Amplify Data API (`generateClient()`) への移行が必要。

#### Acceptance Criteria

1. When Gen 2 バックエンドがデプロイされた場合, the Frontend shall `amplify_outputs.json` を使用して Amplify を設定する
2. The Frontend shall DataStore を Amplify Data API (`generateClient<Schema>()`) に置き換える
3. The Frontend shall `client.models.Event.observeQuery()` を使用してリアルタイム同期を実装する
4. The Frontend shall `client.models.X.create()` / `update()` / `delete()` でデータ操作を行う
5. The Frontend shall 既存の Event/Environment 型定義を Gen 2 生成の Schema 型に移行する
6. The Frontend shall `src/api/event.ts` を Amplify Data API に書き換える
7. The Frontend shall `src/api/environment.ts` を Amplify Data API に書き換える

#### API 変更マッピング

| Gen 1 (DataStore) | Gen 2 (Amplify Data API) |
|-------------------|--------------------------|
| `DataStore.save(new Entity({...}))` | `client.models.Entity.create({...})` |
| `DataStore.query(Entity, id)` | `client.models.Entity.get({ id })` |
| `DataStore.query(Entity, (c) => c.field.eq(val))` | `client.models.Entity.list({ filter: { field: { eq: val } } })` |
| `DataStore.observeQuery(Entity, predicate)` | `client.models.Entity.observeQuery({ filter })` |
| `Entity.copyOf(entity, (updated) => {...})` | `client.models.Entity.update({ id, ...fields })` |
| `DataStore.delete(entity)` | `client.models.Entity.delete({ id })` |

### Requirement 8: 開発ワークフローの刷新

**Objective:** As a 開発者, I want Gen 2 のコードファースト開発ワークフローを確立する, so that CLI コマンドに依存しない効率的な開発ができる

#### Acceptance Criteria

1. The Development Workflow shall `npx ampx sandbox` コマンドで個人用クラウドサンドボックス環境を作成・管理する
2. The Development Workflow shall `npx ampx generate outputs` でクライアント設定（amplify_outputs.json）を生成する
3. The Development Workflow shall `npx ampx generate graphql-client-code` で GraphQL クライアントコードを生成する
4. The Development Workflow shall Git ブランチプッシュによる自動デプロイを使用する
5. The package.json shall Gen 2 CLI コマンド用のスクリプトを追加する
6. The Development Workflow shall TypeScript コードの変更によるバックエンドリソースの更新をサポートする

### Requirement 9: 開発者ドキュメントの更新

**Objective:** As a チームメンバー, I want Gen 2 移行に伴う開発手順の変更を理解する, so that 新しいワークフローで開発を継続できる

#### Acceptance Criteria

1. The Documentation shall Gen 1 と Gen 2 のコマンド対応表を提供する
2. The Documentation shall ローカル開発環境のセットアップ手順を更新する
3. The Documentation shall サンドボックス環境の作成・削除手順を記載する
4. The Documentation shall バックエンドリソースの追加・変更手順を記載する
5. The Documentation shall トラブルシューティングガイドを提供する
6. The .kiro/steering/tech.md shall Gen 2 の開発コマンドと Vite 構成を反映する

### Requirement 10: CI/CD パイプラインの更新

**Objective:** As a 開発者, I want CI/CD パイプラインを Gen 2 に対応させる, so that 自動デプロイが正しく動作する

#### Acceptance Criteria

1. The CI/CD Pipeline shall Amplify Console の Gen 2 アプリとして設定する
2. The CI/CD Pipeline shall amplify.yml を Vite ビルド用に簡略化する
3. The CI/CD Pipeline shall ブランチごとの環境自動作成をサポートする
4. When main ブランチにプッシュした場合, the CI/CD Pipeline shall 本番環境にデプロイする
5. When feature ブランチにプッシュした場合, the CI/CD Pipeline shall プレビュー環境を作成する

### Requirement 11: Gen 1 リソースと Astro 関連ファイルのクリーンアップ

**Objective:** As a 開発者, I want Gen 1 の設定ファイル、Astro 関連ファイル、生成コードを削除する, so that プロジェクト構成をクリーンに保つ

#### Acceptance Criteria

1. When 移行が完了した場合, the Project shall Gen 1 の `amplify/` ディレクトリ構成（backend-config.json, team-provider-info.json, .config/ 等）を削除する
2. When 移行が完了した場合, the Project shall `src/amplifyconfiguration.json` を削除する
3. When 移行が完了した場合, the Project shall Gen 1 の生成コード（`src/api/models/`, `src/api/graphql/`）を Gen 2 生成コードに置き換える
4. When 移行が完了した場合, the Project shall Astro 関連ファイルを削除する:
   - `astro.config.mjs`
   - `src/pages/*.astro`
   - `src/layouts/Layout.astro`
   - `build-for-amplify-hosting.sh`
   - `deploy-manifest.json`
5. When 移行が完了した場合, the Project shall Astro 関連の npm 依存関係を削除する（astro, @astrojs/node, @astrojs/react）
6. When 移行が完了した場合, the Project shall 不要になった npm スクリプトを更新する

