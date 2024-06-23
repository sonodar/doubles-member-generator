# Technology Stack

## Architecture

SSR対応のフルスタックWebアプリケーション。Astroをメタフレームワークとして採用し、ReactコンポーネントとAWS Amplifyバックエンドを統合。

## Core Technologies

- **Language**: TypeScript（strict mode）
- **Framework**: Astro 4.x + React 18
- **Runtime**: Node.js 20+
- **Backend**: AWS Amplify（AppSync GraphQL + DynamoDB）

## Key Libraries

- **UI**: Chakra UI + Framer Motion（アクセシブルでアニメーション対応）
- **State**: Jotai（軽量アトミック状態管理、localStorage永続化）
- **DnD**: @dnd-kit/core（ドラッグ&ドロップによるメンバー調整）
- **Validation**: Zod（スキーマベースのバリデーション）
- **Pattern Matching**: ts-pattern（型安全なパターンマッチング）

## Development Standards

### Type Safety
- TypeScriptのstrict mode必須
- `any`の使用禁止（Biome linterで検出）
- 自動生成コード（`src/api/API.ts`, `src/api/models`, `src/api/graphql`）はlint対象外

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
- AWS Amplify CLI（バックエンド操作時）

### Common Commands
```bash
# Dev: npm run dev
# Build: npm run build
# Test: npm run test
# Lint: npm run lint
# Format: npm run format
# TypeCheck: npm run typecheck
# All fixes: npm run fix
```

## Key Technical Decisions

- **Astro + React**: 静的部分はAstroで最適化、インタラクティブ部分のみReactをハイドレート
- **Jotai over Redux**: 小規模アプリに適した軽量な状態管理、localStorage連携が容易
- **Chakra UI**: アクセシビリティとカスタマイズ性のバランス
- **Biome**: ESLint + Prettierより高速、設定が簡潔

---
_Document standards and patterns, not every dependency_
