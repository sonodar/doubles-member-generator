# Research & Design Decisions

## Summary
- **Feature**: amplify-gen2-migration
- **Discovery Scope**: Complex Integration（バックエンド移行 + フロントエンドフレームワーク移行 + ホスティング変更）
- **Key Findings**:
  1. Amplify Gen 2 は TypeScript-first で `defineBackend()`, `defineData()`, `defineFunction()` を使用
  2. DynamoDB Streams トリガーは CDK で設定可能（公式ドキュメントにサンプルあり）
  3. Gen 2 では DataStore 非サポート、Amplify Data API (`generateClient<Schema>()`) を使用
  4. Vite + React は 2025 年のフロントエンド標準、Chakra UI との統合も問題なし
  5. Amplify Static Hosting は SPA に最適、自動検出とフォールバックルーティング対応

## Research Log

### Amplify Gen 2 バックエンド定義
- **Context**: Gen 1 CLI ベースから Gen 2 TypeScript ベースへの移行方法
- **Sources Consulted**:
  - [Concepts - AWS Amplify Gen 2 Documentation](https://docs.amplify.aws/react/how-amplify-works/concepts/)
  - [Set up a Function - AWS Amplify Gen 2 Documentation](https://docs.amplify.aws/react/build-a-backend/functions/set-up-function/)
- **Findings**:
  - `@aws-amplify/backend` ライブラリで `defineBackend()` を使用
  - `amplify/backend.ts` がエントリーポイント
  - `amplify/data/resource.ts` で `defineData()` によるスキーマ定義
  - `amplify/functions/<name>/resource.ts` で `defineFunction()` による Lambda 定義
  - `amplify/functions/<name>/handler.ts` でハンドラー実装
- **Implications**: ディレクトリ構造が Gen 1 とは異なる。Gen 2 形式に合わせた新規作成が必要

### Amplify Gen 2 Data スキーマ定義
- **Context**: 既存 GraphQL スキーマの Gen 2 形式への移行
- **Sources Consulted**:
  - [Add custom queries and mutations - AWS Amplify Gen 2 Documentation](https://docs.amplify.aws/react/build-a-backend/data/custom-business-logic/)
- **Findings**:
  - `a.schema()` で TypeScript によるスキーマ定義
  - `a.model()` でモデル定義、フィールドは `a.string()`, `a.datetime()` 等
  - `a.enum()` で列挙型定義
  - `a.hasMany()`, `a.belongsTo()` でリレーション定義
  - `.authorization()` で認証設定
  - `.secondaryIndexes()` でセカンダリインデックス定義
- **Implications**: 既存の schema.graphql を TypeScript に変換。型安全性が向上

### DynamoDB Streams Lambda トリガー
- **Context**: EventCleaner Lambda を DynamoDB Streams で起動する方法
- **Sources Consulted**:
  - [DynamoDB Streams - AWS Amplify Gen 2 Documentation](https://docs.amplify.aws/react/build-a-backend/functions/examples/dynamo-db-stream/)
  - [DynamoDB Streams and AWS Lambda triggers - Amazon DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.Lambda.html)
- **Findings**:
  - Amplify Gen 2 は DynamoDB Streams をイベントソースとしてサポート
  - `backend.ts` で CDK を使用して EventSourceMapping を設定
  - StreamViewType: NEW_AND_OLD_IMAGES が削除検出に最適
  - Lambda Powertools Logger 推奨
  - `aws-lambda` パッケージでハンドラー型定義
- **Implications**: 既存の EventCleaner ロジックはほぼそのまま移行可能。CDK による設定が必要

### DataStore → Amplify Data API 移行
- **Context**: Gen 2 での DataStore 非サポートへの対応
- **Sources Consulted**:
  - [Subscribe to real-time events - AWS Amplify Gen 2 Documentation](https://docs.amplify.aws/react/build-a-backend/data/subscribe-data/)
  - [Gen 2 for Gen 1 customers - AWS Amplify Gen 2 Documentation](https://docs.amplify.aws/react/start/migrate-to-gen2/)
- **Findings**:
  - DataStore は Gen 2 で非サポート
  - `generateClient<Schema>()` でクライアント生成
  - `client.models.X.observeQuery()` でリアルタイム同期
  - `client.models.X.create()`, `.update()`, `.delete()`, `.get()`, `.list()` でCRUD
  - フィルタ構文が DataStore と異なる（predicate → filter object）
- **Implications**: `src/api/event.ts`, `src/api/environment.ts` の全面書き換え必要

### Vite + React SPA 構成
- **Context**: Astro から Vite + React への移行
- **Sources Consulted**:
  - [Using Chakra in Vite | Chakra UI](https://chakra-ui.com/docs/get-started/frameworks/vite)
  - [Advanced Guide to Using Vite with React in 2025](https://codeparrot.ai/blogs/advanced-guide-to-using-vite-with-react-in-2025)
  - [GitHub - astahmer/vite-react-chakra-ts](https://github.com/astahmer/vite-react-chakra-ts)
- **Findings**:
  - Vite は 2025 年のフロントエンド標準ビルドツール
  - `npm create vite@latest` で初期化
  - Chakra UI は `ChakraProvider` でラップ
  - react-router-dom でクライアントサイドルーティング
  - Jotai との組み合わせも問題なし（既存テンプレートあり）
  - パスエイリアスは `vite-tsconfig-paths` プラグインで対応
- **Implications**: 既存 React コンポーネントはほぼそのまま流用可能。ルーティング追加のみ

### Amplify Static Hosting
- **Context**: SSR から Static Hosting への移行
- **Sources Consulted**:
  - [Deploying a Next.js SSR application to Amplify - AWS Amplify Hosting](https://docs.aws.amazon.com/amplify/latest/userguide/deploy-nextjs-app.html)
  - [SSR supported features - AWS Amplify Hosting](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-supported-features.html)
- **Findings**:
  - Amplify Hosting は Static と SSR の両モードをサポート
  - SPA はフォールバックルーティング（Rewrites）で対応
  - `amplify.yml` でビルド設定、`baseDirectory` を `dist` に設定
  - Node.js 20+ が 2025 年以降のサポート対象
  - Gen 2 バックエンドと同一アプリとしてデプロイ可能
- **Implications**: カスタムビルドスクリプト不要。amplify.yml を大幅簡略化

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Amplify Gen 2 Full Stack | defineBackend + defineData + Vite SPA | AWS 統合、TypeScript-first、IaC | 学習コスト、AWS ロックイン | 既存アーキテクチャからの自然な進化 |
| 外部 BaaS (Supabase, Firebase) | 別サービスでバックエンド | 柔軟性、マルチクラウド | 移行コスト大、既存スキーマ互換なし | 検討外 |
| 手動 CDK | 直接 CDK でリソース定義 | フル制御 | Amplify 統合喪失、複雑性増 | オーバーエンジニアリング |

**選択**: Amplify Gen 2 Full Stack

## Design Decisions

### Decision: Amplify Gen 2 ディレクトリ構造
- **Context**: Gen 1 の amplify/ ディレクトリを Gen 2 形式に置き換え
- **Alternatives Considered**:
  1. Gen 1 構造を維持しつつ Gen 2 を別ディレクトリに配置
  2. Gen 2 形式で amplify/ を完全に作り直し
- **Selected Approach**: Gen 2 形式で完全に作り直し
- **Rationale**: Gen 1 と Gen 2 の構造は互換性がなく、混在は混乱を招く
- **Trade-offs**: Gen 1 設定ファイルは参照用に一時保持し、移行完了後に削除
- **Follow-up**: 移行中は両方のディレクトリが存在する可能性あり

### Decision: フロントエンドエントリーポイント
- **Context**: Astro の pages/*.astro から Vite のエントリーポイントへ
- **Alternatives Considered**:
  1. index.html + main.tsx（標準 Vite 構成）
  2. App.tsx をルートコンポーネントとして使用
- **Selected Approach**: index.html + main.tsx + App.tsx（ルーティング含む）
- **Rationale**: Vite 標準構成に従い、ルーティングは App.tsx で管理
- **Trade-offs**: Astro の SSR 機能は失われるが、今回は不要
- **Follow-up**: SEO が必要な場合は将来的に Next.js 検討

### Decision: データアクセス層の抽象化
- **Context**: DataStore から Amplify Data API への移行
- **Alternatives Considered**:
  1. 直接 client.models.X を各コンポーネントで使用
  2. 既存の src/api/event.ts, environment.ts を維持し、内部実装のみ変更
- **Selected Approach**: 既存のラッパー層を維持し、内部実装を Amplify Data API に変更
- **Rationale**: コンポーネント層の変更を最小化、テスト容易性維持
- **Trade-offs**: ラッパー層のメンテナンスが必要
- **Follow-up**: 型定義は Gen 2 生成の Schema 型を使用

### Decision: パスエイリアス維持
- **Context**: 既存の @logic, @components/* 等のパスエイリアス
- **Alternatives Considered**:
  1. 相対パスに変更
  2. パスエイリアスを Vite 設定で維持
- **Selected Approach**: vite-tsconfig-paths プラグインでパスエイリアスを維持
- **Rationale**: 既存コードの変更を最小化
- **Trade-offs**: プラグイン依存が増える
- **Follow-up**: tsconfig.json のパスエイリアス設定を Vite と同期

## Risks & Mitigations

- **Risk**: Amplify Gen 2 の breaking changes
  - **Mitigation**: 公式ドキュメントを定期確認、sandbox 環境でテスト
- **Risk**: DataStore → Amplify Data API の互換性問題
  - **Mitigation**: 段階的移行、単体テストで動作確認
- **Risk**: 既存 React コンポーネントの Vite 互換性
  - **Mitigation**: 主要なライブラリ（Chakra UI, Jotai, dnd-kit）は Vite 対応済み
- **Risk**: DynamoDB Streams トリガーの CDK 設定複雑性
  - **Mitigation**: 公式サンプルを参照、sandbox で動作確認

## References

- [AWS Amplify Gen 2 Documentation](https://docs.amplify.aws/)
- [DynamoDB Streams - AWS Amplify Gen 2](https://docs.amplify.aws/react/build-a-backend/functions/examples/dynamo-db-stream/)
- [Subscribe to real-time events - AWS Amplify Gen 2](https://docs.amplify.aws/react/build-a-backend/data/subscribe-data/)
- [Using Chakra in Vite | Chakra UI](https://chakra-ui.com/docs/get-started/frameworks/vite)
- [Vite Guide 2025](https://codeparrot.ai/blogs/advanced-guide-to-using-vite-with-react-in-2025)

