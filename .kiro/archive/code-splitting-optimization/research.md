# Research & Design Decisions

## Summary
- **Feature**: `code-splitting-optimization`
- **Discovery Scope**: Simple Addition（既存ルーティングへのReact.lazy適用のみ）
- **Key Findings**:
  - 現在2ルート（`/`と`/share/:id`）のシンプルな構成
  - Viteはデフォルトで動的インポートを自動的にチャンク分割する
  - React.lazy + Suspenseの標準パターンで完結

## Research Log

### React.lazyとSuspenseの使用パターン
- **Context**: 最小限の変更でコード分割を実現する方法
- **Sources Consulted**: React公式ドキュメント、Vite公式ドキュメント
- **Findings**:
  - `React.lazy(() => import('./Component'))` で動的インポートをラップ
  - `<Suspense fallback={...}>` でローディング中のフォールバックUIを提供
  - Viteは動的インポートを検出して自動的に別チャンクに分割
- **Implications**: vite.config.tsの変更は不要、App.tsxのみ修正

### 現在のルーティング構造
- **Context**: 変更対象の特定
- **Findings**:
  - メインルート `/` → `Main` コンポーネント
  - 共有ルート `/share/:id` → `Share` コンポーネント（ShareWrapperでラップ）
  - react-router-dom v7使用
- **Implications**: 2つのコンポーネントをlazy化するだけで完了

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| React.lazy + Suspense | 標準のReact APIを使用 | 追加ライブラリ不要、学習コストゼロ | なし | 採用 |

## Design Decisions

### Decision: React.lazy + Suspenseのみ使用
- **Context**: シンプルさを最優先する要件
- **Alternatives Considered**:
  1. vite.config.tsでmanualChunks設定
  2. @loadable/componentなどの外部ライブラリ
- **Selected Approach**: React標準のlazy/Suspenseのみ
- **Rationale**: 追加設定・依存なしで実現可能、Viteがデフォルトで動的インポートをチャンク分割
- **Trade-offs**: 細かいチャンク制御はできないが、要件上不要
- **Follow-up**: ビルド後のチャンク分割を確認

## Risks & Mitigations
- リスクなし（標準APIの適用のみ）

## References
- [React.lazy](https://react.dev/reference/react/lazy) — 公式ドキュメント
- [Vite Code Splitting](https://vite.dev/guide/features.html#dynamic-import) — 動的インポートによる自動分割
