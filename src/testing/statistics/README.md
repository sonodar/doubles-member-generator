# テストデータ一覧

途中参加者（joinedAt > 0）がいる場合の統計パネル表示が正しく動作することを検証するテストデータ。

## パターン概要

| # | ファイル名 | シナリオ | 優先度 | 検証対象 |
|---|-----------|---------|--------|---------|
| 1 | pattern1-fair-play.json | 途中参加者が公平にプレイ | 必須 | ハイライト判定、休憩数=0 |
| 2 | pattern2-unfair-rest.json | 途中参加者が休憩多い | 必須 | ハイライト=low、休憩数>0 |
| 3 | pattern3-initial-member-rest.json | 初期メンバーの休憩数 | 必須 | 初期メンバー vs 途中参加者の休憩数計算 |
| 4 | pattern4-all-equal.json | 全員均等（ベースライン） | 重要 | ベースライン、全員ハイライト=none |
| 5 | pattern5-multiple-joiners.json | 複数の途中参加者 | 推奨 | 各自の joinedAt 以降で計算 |
| 6 | pattern6-consecutive-rest.json | 途中参加後に連続休憩 | 必須 | 連続休憩数（参加後のみ） |
| 7 | pattern7-just-joined.json | 途中参加直後（未プレイ） | 重要 | プレイ数=0、休憩数=0 |
| 8 | pattern8-left-member.json | 途中参加後に離脱 | 推奨 | showLeftMember=true で表示 |
| 9 | pattern9-over-play.json | 途中参加者が多くプレイ | 重要 | ハイライト=high |
| 10 | pattern10-warning.json | 不公平警告と途中参加者 | 推奨 | 警告判定 |
| 11 | pattern11-zero-base.json | baseCount=0の途中参加者 | 推奨 | baseCount=0 or 1 |
| 12 | pattern12-algorithm.json | アルゴリズム別テスト | 推奨 | EVENNESS vs DISCRETENESS |

## データ構造

各JSONファイルは以下の構造を持つ:

```json
{
  "description": "パターンの説明",
  "courtCount": 2,
  "members": [...],
  "histories": [...],
  "gameCounts": {...},
  "algorithm": "evenness" | "discreteness",
  "expected": {
    "memberX": {
      "playCount": N,
      "effectivePlayCount": N,
      "totalRestCount": N,
      "consecutiveRestCount": N,
      "highlightLevel": {
        "playCount": "none" | "low" | "medium" | "high",
        "totalRestCount": "none" | "low" | "medium" | "high",
        "restCount": "none" | "low" | "medium" | "high"
      }
    }
  }
}
```

## 使用方法

1. テストファイルで各パターンを読み込む
2. `OutlierLevelProvider`などのロジックに適用
3. `expected`と実際の結果を比較
