# Research & Design Decisions

## Summary
- **Feature**: `renovate-automerge-config`
- **Discovery Scope**: Extension（既存設定の改善）
- **Key Findings**:
  - `minimumReleaseAge` + `internalChecksFilter: "strict"` の組み合わせで猶予期間中のPR/ブランチ作成を抑制可能
  - セキュリティ更新は `minimumReleaseAge` をバイパスする（Renovateのデフォルト動作）
  - 既存のGitHub Actionsワークフローは既に週1回実行設定済み

## Research Log

### minimumReleaseAge と internalChecksFilter の連携
- **Context**: サプライチェーン攻撃対策として7日間の猶予期間を設けたい
- **Sources Consulted**:
  - [Minimum Release Age - Renovate Docs](https://docs.renovatebot.com/key-concepts/minimum-release-age/)
  - [Configuration Options - Renovate Docs](https://docs.renovatebot.com/configuration-options/)
- **Findings**:
  - `minimumReleaseAge: "7 days"` でリリースから7日間経過するまで更新を抑制
  - `internalChecksFilter: "strict"` を設定すると、猶予期間中はブランチ/PRを作成しない
  - Renovate 42以降、`internalChecksFilter: "strict"` がデフォルト動作
  - 猶予期間中の更新はDependency Dashboardの「Pending Status Checks」に表示される（ただし本プロジェクトではDashboard無効）
- **Implications**:
  - 猶予期間中の通知がなくなり、開発者の負担軽減
  - `internalChecksFilter: "strict"` は明示的に設定することを推奨

### セキュリティ更新の猶予期間バイパス
- **Context**: 脆弱性対応は即時マージしたい
- **Sources Consulted**:
  - [Minimum Release Age - Renovate Docs](https://docs.renovatebot.com/key-concepts/minimum-release-age/)
- **Findings**:
  - "Security updates bypass any `minimumReleaseAge` checks"
  - 脆弱性修正は検出され次第すぐにPRが作成される
  - 既存の `vulnerabilityAlerts` 設定はそのまま維持可能
- **Implications**: 追加設定不要、既存動作で要件を満たす

### JSON5サポート
- **Context**: 設定ファイルにコメントを追加したい
- **Sources Consulted**:
  - Renovate公式ドキュメント
- **Findings**:
  - Renovateは `renovate.json5` を自動認識
  - JSON5形式でコメント（`//` および `/* */`）が使用可能
  - リネームするだけで移行完了
- **Implications**: ファイルリネームと内容更新のみで対応可能

### packageRulesの優先順位
- **Context**: dependencies/devDependenciesのグループ化設定
- **Sources Consulted**:
  - [Renovate Package Rules Guide](https://docs.mend.io/wsk/renovate-package-rules-guide)
- **Findings**:
  - packageRulesは配列の後ろに書いたものが優先（後勝ち）
  - `matchDepTypes` で dependencies/devDependencies を区別可能
  - グループ化は `groupName` で設定
- **Implications**:
  - devDependenciesグループを後に書くことで、既存の個別グループ設定を上書き
  - dependenciesグループとdevDependenciesグループの2つに簡素化

### labelsの設定
- **Context**: automerge対象とmajor更新を区別するラベル
- **Sources Consulted**:
  - [Configuration Options - Renovate Docs](https://docs.renovatebot.com/configuration-options/)
- **Findings**:
  - `labels` は配列で指定
  - `labels` は non-mergeable（上書き動作）
  - `addLabels` を使うと既存ラベルに追加
- **Implications**: packageRulesで更新タイプごとに異なるラベルを設定

### lockFileMaintenanceの無効化
- **Context**: minor更新が猶予期間をバイパスするリスクを回避
- **Sources Consulted**:
  - [Configuration Options - Renovate Docs](https://docs.renovatebot.com/configuration-options/)
- **Findings**:
  - `lockFileMaintenance: { enabled: false }` で無効化可能
  - 間接依存の更新は直接依存の更新時に行われる
- **Implications**: 設定追加のみで対応可能

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 設定ファイル変更のみ | renovate.json5とワークフローの更新 | シンプル、リスク低 | なし | 採用 |

## Design Decisions

### Decision: 猶予期間の実装方法
- **Context**: サプライチェーン攻撃対策として7日間の猶予期間が必要
- **Alternatives Considered**:
  1. `minimumReleaseAge` のみ - PRは作成されるが自動マージが遅延
  2. `minimumReleaseAge` + `internalChecksFilter: "strict"` - 猶予期間中はPR/ブランチを作成しない
- **Selected Approach**: Option 2
- **Rationale**: 通知削減の要件を満たすため、PR作成自体を抑制する必要がある
- **Trade-offs**: Dependency Dashboardで進行状況が見えない（ただし無効化済み）
- **Follow-up**: 初回実行時に正しく動作することを確認

### Decision: グループ化の簡素化
- **Context**: 既存の個別グループ設定（AWS Amplify、testing、types等）を維持するか
- **Alternatives Considered**:
  1. 既存グループ維持 - 複雑だがPR粒度が細かい
  2. 2グループ構成（dependencies/devDependencies） - シンプルで通知削減効果大
- **Selected Approach**: Option 2
- **Rationale**:
  - 通知削減が主目的
  - devDependenciesにあるパッケージが多いため、個別グループの意味が薄い
  - 週1回実行との組み合わせで最大2PR/週に削減
- **Trade-offs**: 更新内容の確認がやや煩雑になる可能性
- **Follow-up**: PRのサイズが大きすぎる場合は再検討

### Decision: ラベル付与
- **Context**: automerge対象とレビュー必須を区別したい
- **Selected Approach**:
  - patch/minor: `["renovate", "automerge"]`
  - major: `["renovate"]`
- **Rationale**: ラベルでフィルタリングしやすくなる

## Risks & Mitigations
- **リスク**: `minimumReleaseAge` がnpmレジストリのタイムスタンプに依存 → タイムスタンプがない場合は猶予期間が適用されない
  - **緩和策**: Renovate 42以降はデフォルトで厳格な動作、問題が発生した場合はデバッグログで確認
- **リスク**: 設定ファイルの構文エラー
  - **緩和策**: GitHub Actionsのvalidateジョブで設定検証済み
- **リスク**: 既存のオープンPRとの競合
  - **緩和策**: 設定変更前に既存PRをマージまたはクローズ

## References
- [Minimum Release Age - Renovate Docs](https://docs.renovatebot.com/key-concepts/minimum-release-age/) — 猶予期間の設定方法
- [Configuration Options - Renovate Docs](https://docs.renovatebot.com/configuration-options/) — 設定オプションのリファレンス
- [Renovate Package Rules Guide](https://docs.mend.io/wsk/renovate-package-rules-guide) — packageRulesの詳細
