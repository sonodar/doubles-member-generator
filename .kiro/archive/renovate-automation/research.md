# Research & Design Decisions

## Summary
- **Feature**: `renovate-automation`
- **Discovery Scope**: Simple Addition（設定ファイルと GitHub Actions ワークフローの追加）
- **Key Findings**:
  - Renovate の automerge 設定は `packageRules` の `matchUpdateTypes` で patch/minor/major を制御可能
  - GitHub Actions で Renovate を実行する場合、`renovatebot/github-action` の最新版は v44.2.4
  - レビュアー割り当ては `reviewers` オプションで設定、automerge 有効時はデフォルトで割り当てられない

## Research Log

### Renovate automerge 設定パターン
- **Context**: パッチ・マイナーは自動マージ、メジャーはレビュー必須という要件の実現方法
- **Sources Consulted**:
  - [Renovate Configuration Options](https://docs.renovatebot.com/configuration-options/)
  - [Automerge configuration and troubleshooting](https://docs.renovatebot.com/key-concepts/automerge/)
- **Findings**:
  - `matchUpdateTypes: ["minor", "patch"]` と `automerge: true` の組み合わせで実現可能
  - `automergeType: "pr"` で PR 作成後にマージ（CI 検証が必要な場合に推奨）
  - `automergeStrategy: "squash"` で squash マージを指定
  - メジャーバージョンは明示的に `automerge: false` を設定
- **Implications**: packageRules を使って更新タイプごとに automerge 動作を分岐させる設計が適切

### レビュアー・アサイニー設定
- **Context**: メジャーバージョン更新時に sonodar をレビュアーとして割り当てる要件
- **Sources Consulted**:
  - [Renovate Configuration Options - reviewers](https://docs.renovatebot.com/configuration-options/)
  - [GitHub Discussion #11217](https://github.com/renovatebot/renovate/discussions/11217)
- **Findings**:
  - `reviewers` オプションで GitHub ユーザー名を配列で指定
  - automerge 有効な PR にはデフォルトでレビュアーが割り当てられない
  - automerge 無効（メジャーバージョン）の PR には通常通りレビュアーが割り当てられる
- **Implications**: メジャーバージョン用の packageRule で `reviewers: ["sonodar"]` を設定

### renovatebot/github-action バージョン
- **Context**: GitHub Actions で Renovate を実行するためのアクション選定
- **Sources Consulted**:
  - [renovatebot/github-action GitHub](https://github.com/renovatebot/github-action)
  - [Releases](https://github.com/renovatebot/github-action/releases)
- **Findings**:
  - 最新版は v44.2.4（2026年1月時点）
  - `RENOVATE_TOKEN` シークレットで認証
  - `RENOVATE_REPOSITORIES` 環境変数でリポジトリ指定
- **Implications**: 参考プロジェクト（aws-s3-photo-browser）と同様の構成を採用

### Renovate PR の CI トリガー
- **Context**: Renovate が作成した PR に対して専用の CI を実行する方法
- **Sources Consulted**: GitHub Actions ワークフローの `pull_request` イベント設定
- **Findings**:
  - `pull_request` イベントで `branches: [main]` を指定
  - Renovate が作成するブランチ名は `renovate/*` パターン
  - `if: github.actor == 'renovate[bot]'` などで Renovate PR を識別可能だが、不要（すべての PR で CI を実行すべき）
- **Implications**: 専用ワークフローを作成し、main ブランチへの PR で lint/typecheck/test を実行

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Self-hosted Renovate | GitHub Actions で renovatebot/github-action を使用 | 完全な制御、無料、シークレット管理可能 | 自前でスケジュール管理が必要 | 参考プロジェクトで採用済み |
| Mend Renovate App | GitHub App として導入 | 設定不要、自動スケジュール | 外部サービス依存、シークレット管理不要 | プライベートリポジトリでの制限あり |

**選択**: Self-hosted Renovate（GitHub Actions）
**理由**: 参考プロジェクトとの一貫性、完全な制御、シークレット管理の柔軟性

## Design Decisions

### Decision: スケジュール制御を GitHub Actions に集約
- **Context**: Renovate のスケジュール設定を renovate.json と GitHub Actions のどちらで行うか
- **Alternatives Considered**:
  1. renovate.json の `schedule` オプションで制御
  2. GitHub Actions の `schedule` トリガーで制御
- **Selected Approach**: GitHub Actions の `schedule` トリガーを使用
- **Rationale**: ユーザー要件により、スケジュールは GitHub Actions 側で一元管理
- **Trade-offs**: renovate.json がシンプルになるが、GitHub Actions の設定が必要
- **Follow-up**: なし

### Decision: 専用 CI ワークフローの作成
- **Context**: Renovate PR の検証を既存 CI に統合するか、専用ワークフローを作成するか
- **Alternatives Considered**:
  1. 既存 ci.yml を Renovate PR にも適用
  2. Renovate PR 専用の renovate-ci.yml を作成
- **Selected Approach**: 専用 renovate-ci.yml を作成
- **Rationale**: ユーザー要件により、Renovate 関連は独立したワークフローで管理
- **Trade-offs**: ワークフローの重複が発生するが、関心の分離が明確
- **Follow-up**: prepare-ci アクションの再利用でコード重複を最小化

## Risks & Mitigations
- **RENOVATE_TOKEN シークレット未設定**: ワークフロー実行時にエラー → ドキュメントで設定手順を明記
- **automerge 失敗**: CI 通過後もマージされない可能性 → GitHub リポジトリ設定で auto-merge を有効化する必要あり

## References
- [Renovate Configuration Options](https://docs.renovatebot.com/configuration-options/) — 設定オプションの公式リファレンス
- [Automerge configuration](https://docs.renovatebot.com/key-concepts/automerge/) — automerge の詳細設定ガイド
- [renovatebot/github-action](https://github.com/renovatebot/github-action) — GitHub Actions 用公式アクション
