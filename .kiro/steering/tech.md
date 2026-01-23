# Technology Stack

## Architecture

SPAベースのフルスタックWebアプリケーション。ViteをビルドツールとしてReactフロントエンドを構築し、AWS Amplify Gen2バックエンドと統合。

## Core Technologies

- **Language**: TypeScript（strict mode）
- **Framework**: Vite + React 18
- **Runtime**: Node.js 22+
- **Backend**: AWS Amplify Gen2（AppSync GraphQL + DynamoDB）
- **Routing**: React Router DOM 7.x

## Key Libraries

- **UI**: Chakra UI v3（アクセシブル）
- **State**: Jotai（軽量アトミック状態管理、localStorage永続化）
- **DnD**: @dnd-kit/core（ドラッグ&ドロップによるメンバー調整）
- **Validation**: Zod（スキーマベースのバリデーション）
- **Pattern Matching**: ts-pattern（型安全なパターンマッチング）

## Development Standards

### Type Safety
- TypeScriptのstrict mode必須
- `any`の使用禁止（Biome linterで検出）
- Amplify Gen2 スキーマ型は `amplify/data/resource.ts` で定義し、フロントエンドから直接参照

### Code Quality
- **Formatter/Linter**: Biome（ESLint/Prettierの代替）
- **Line Width**: 120文字
- **Unused Imports**: エラーとして検出

### Testing
- **Framework**: Vitest
- ロジック層（`src/logic/`）にユニットテスト配置
- `*.test.ts`パターンでテストファイルを識別

## Development Environment

### Required Tools
- Node.js 22+
- npm
- AWS Amplify Gen2 CLI（`@aws-amplify/backend-cli`）

### Common Commands
```bash
# Dev: npm run dev
# Build: npm run build
# Test: npm run test
# Lint: npm run lint
# Format: npm run format
# TypeCheck: npm run typecheck
# All fixes: npm run fix
# Amplify Sandbox: npm run sandbox (ampx sandbox)
```

## Key Technical Decisions

- **Vite + React**: 高速な開発サーバーとHMR、シンプルなSPA構成
- **Amplify Gen2**: TypeScriptベースのインフラ定義、型安全なスキーマ、CDKによるカスタマイズ
- **Jotai over Redux**: 小規模アプリに適した軽量な状態管理、localStorage連携が容易
- **Chakra UI v3**: Recipe/Slot パターンによるスタイル定義、Ark UI ベースのアクセシブルコンポーネント
- **Biome**: ESLint + Prettierより高速、設定が簡潔
- **React Router DOM**: ファイルベースルーティングからプログラマティックルーティングへ

---
_Document standards and patterns, not every dependency_
