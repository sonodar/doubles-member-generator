# Requirements Document

## Introduction
本ドキュメントは、Chakra UI を v2.8.2 から v3 へアップグレードし、自前実装コンポーネントを Chakra UI 標準コンポーネントに移行するための要件を定義する。アップグレードにより、パフォーマンス向上、バンドルサイズ削減、および保守性向上を実現する。移行前にコンポーネントテストを実装し、回帰確認を可能にする。

## Requirements

### Requirement 1: コンポーネントテストの実装
**Objective:** As a 開発者, I want 移行前にコンポーネントテストを実装する, so that Chakra UI アップグレード後の動作確認と回帰テストが可能になる

#### Acceptance Criteria
1. The システム shall 主要なUIコンポーネントに対するテストを実装する
2. When コンポーネントをレンダリングする, the テスト shall 正常に描画されることを検証する
3. When ユーザー操作（クリック、入力等）を行う, the テスト shall 期待される動作を検証する
4. The テスト shall @testing-library/react を使用してコンポーネントテストを実装する
5. When ドラッグ&ドロップ操作を行う, the テスト shall 視覚的フィードバックと状態変更を検証する
6. The システム shall 全てのコンポーネントテストが Vitest で実行可能である

### Requirement 2: Chakra UI v3 へのアップグレード
**Objective:** As a 開発者, I want Chakra UI を最新の v3 にアップグレードする, so that 新機能・パフォーマンス向上・長期サポートの恩恵を受けられる

#### Acceptance Criteria
1. When アプリケーションをビルドする, the システム shall Chakra UI v3 の依存関係でエラーなくビルドを完了する
2. When 開発サーバーを起動する, the システム shall コンソールに Chakra UI 関連の非推奨警告を表示しない
3. The システム shall @chakra-ui/react v3 および関連パッケージを使用する
4. The システム shall 不要になった依存関係（@emotion/react, @emotion/styled, framer-motion, @chakra-ui/icons）を削除する
5. When TypeScript の型チェックを実行する, the システム shall Chakra UI 関連の型エラーを発生させない

### Requirement 3: プロバイダー設定の移行
**Objective:** As a 開発者, I want Chakra v3 のプロバイダー構成に移行する, so that v3 の機能を正しく利用できる

#### Acceptance Criteria
1. When アプリケーションを初期化する, the システム shall Chakra v3 の Provider 構成を使用する

### Requirement 4: 自前実装コンポーネントの Chakra コンポーネント移行
**Objective:** As a 開発者, I want 自前実装の UI コンポーネントを Chakra 標準コンポーネントに置き換える, so that コードベースの保守性と一貫性を向上させる

#### Acceptance Criteria
1. When カスタム実装されたボタン・入力・モーダル等がある場合, the システム shall 対応する Chakra v3 コンポーネントに置き換える
2. When カスタムスタイリングが必要な場合, the システム shall Chakra v3 のスタイルプロップまたはレシピシステムを使用する
3. The システム shall 移行後も既存の UI/UX（見た目・操作感）を維持する
4. When アクセシビリティ機能（キーボード操作、スクリーンリーダー対応）がある場合, the システム shall 移行後も同等以上のアクセシビリティを提供する
5. When useRadio/useRadioGroup で実装されたトグルボタン（CourtCountInput, AlgorithmInput）がある場合, the システム shall Chakra v3 の SegmentedControl コンポーネントに移行する

### Requirement 5: アイコンシステムの移行
**Objective:** As a 開発者, I want @chakra-ui/icons から react-icons に移行する, so that v3 互換のアイコン利用を実現する

#### Acceptance Criteria
1. When 既存コードで @chakra-ui/icons を使用している場合, the システム shall react-icons に移行する
2. The システム shall 既存のアイコン表示と同等のサイズ・色・配置を維持する
3. When アイコンボタンを使用している場合, the システム shall Chakra v3 の IconButton コンポーネントを使用する

### Requirement 6: 既存機能の動作保証
**Objective:** As a ユーザー, I want アップグレード後も全ての既存機能が正常に動作する, so that サービスの継続利用に支障がない

#### Acceptance Criteria
1. When メンバー生成機能を使用する, the システム shall アップグレード前と同じ動作結果を返す
2. When ドラッグ&ドロップでメンバーを調整する, the システム shall 視覚的フィードバックを含め正常に動作する
3. When 統計情報（試合回数・休憩回数）を表示する, the システム shall 正確な数値を表示する
4. When 不公平状態の警告を表示する, the システム shall 適切なスタイルで警告を表示する
5. When URL共有機能を使用する, the システム shall 正常に共有リンクを生成・読み込む
6. The システム shall 全ての既存ユニットテストおよびコンポーネントテストをパスする

### Requirement 7: パフォーマンスと品質基準
**Objective:** As a 開発者, I want アップグレード後もパフォーマンスと品質基準を維持する, so that ユーザー体験を損なわない

#### Acceptance Criteria
1. The システム shall ビルド後のバンドルサイズがアップグレード前と同等以下である
2. When Biome による lint チェックを実行する, the システム shall エラーを発生させない
3. When TypeScript の型チェックを実行する, the システム shall エラーを発生させない
4. The システム shall 初回描画のパフォーマンスがアップグレード前と同等以上である
