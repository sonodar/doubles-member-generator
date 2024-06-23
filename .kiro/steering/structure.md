# Project Structure

## Organization Philosophy

機能ドメインと技術レイヤーのハイブリッド構成。ビジネスロジックとUIを明確に分離し、再利用性とテスタビリティを確保。

## Directory Patterns

### Logic Layer (`src/logic/`)
**Location**: `src/logic/`
**Purpose**: 純粋なビジネスロジック（UI非依存）
**Pattern**:
- 各ファイルが単一責務を持つ（生成、リトライ、参加、離脱など）
- `types.ts`で共有型定義
- `index.ts`で公開APIを集約re-export
- `*.test.ts`でユニットテスト併置

**Example**:
```
logic/
  ├── types.ts        # MemberId, CourtMembers, History等の型
  ├── generate.ts     # メンバー生成アルゴリズム
  ├── discreteness.ts # 離散性ベースの最適化
  ├── evenness.ts     # 均等性ベースの最適化
  └── index.ts        # 公開APIの集約
```

### Components Layer (`src/components/`)
**Location**: `src/components/`
**Purpose**: Reactコンポーネント
**Pattern**:
- 機能別サブディレクトリ（`game/`, `setting/`, `common/`, `shared/`）
- 状態管理は`state/`サブディレクトリに集約
- Chakra UIベースのスタイリング

**Example**:
```
components/
  ├── game/           # ゲーム画面のコンポーネント群
  │   ├── adjustment/ # ドラッグ&ドロップ調整機能
  │   └── GamePane.tsx
  ├── setting/        # 初期設定画面
  ├── common/         # 共通UI部品
  ├── shared/         # 共有画面
  └── state/          # Jotaiアトム・リデューサー
```

### API Layer (`src/api/`)
**Location**: `src/api/`
**Purpose**: AWS Amplify GraphQL統合
**Pattern**:
- `graphql/`配下は自動生成（Amplify CLI）
- `client.ts`でAmplify設定
- `event.ts`等でドメイン固有のAPI操作をラップ

### Pages (`src/pages/`)
**Location**: `src/pages/`
**Purpose**: Astroルーティング（ファイルベース）
**Pattern**: Astroのファイルベースルーティングに従う

### Amplify Backend (`amplify/`)
**Location**: `amplify/`
**Purpose**: AWS Amplifyバックエンド設定
**Pattern**:
- `backend/api/`にGraphQLスキーマ
- `backend/function/`にLambda関数（TypeScript）
- Yarn Workspacesでバックエンド関数を管理

## Naming Conventions

- **Files**: PascalCase（コンポーネント）、camelCase（ロジック/ユーティリティ）
- **Components**: PascalCase（例: `GamePane.tsx`）
- **Functions**: camelCase（例: `generate`, `retry`）
- **Types**: PascalCase（例: `CourtMembers`, `MemberId`）
- **Test Files**: `*.test.ts`（ソースファイルと同一ディレクトリ）

## Import Organization

```typescript
// 1. External libraries
import { useAtom } from "jotai";
import { ChakraProvider } from "@chakra-ui/react";

// 2. Path aliases (absolute)
import { type Algorithm } from "@logic";
import GamePane from "@components/game/GamePane";

// 3. Relative imports
import { settingsAtom } from "./state/index.ts";
```

**Path Aliases**:
- `@logic` → `src/logic`
- `@components/*` → `src/components/*`
- `@api` → `src/api`
- `@assets/*` → `src/assets/*`
- `@layouts/*` → `src/layouts/*`

## Code Organization Principles

- **UI/Logic分離**: `src/logic/`は純粋関数のみ、React依存なし
- **状態の局所化**: Jotaiアトムでグローバル状態を最小化
- **自動生成コードの分離**: Amplify生成ファイルはlint対象外に設定
- **テスト併置**: ロジックのテストはソースと同ディレクトリに配置

---
_Document patterns, not file trees. New files following patterns shouldn't require updates_
