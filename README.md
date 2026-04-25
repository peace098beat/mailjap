# mailjap

購読メールを自動で日本語翻訳し、Gmail または Slack に転送する Google Apps Script プロジェクトです。

```
購読メール受信 → 日本語翻訳（Gemini / OpenAI / Claude）→ 転送（Gmail / Slack）
```

---

## ファイル構成

```
mailjap/
├── config.gs       # 設定（転送先、ソース定義）
├── main.gs         # エントリーポイント・時間トリガー
├── fetcher.gs      # Gmail検索・メール本文抽出
├── translator.gs   # Gemini → OpenAI → Claude フォールバック翻訳
├── notifier.gs     # Gmail転送 / Slack Webhook
└── utils.gs        # HTML→テキスト変換、ログ等
```

---

## セットアップ手順

### Step 1 — Gemini API キーを取得する

1. **Google AI Studio** にアクセス
   - https://aistudio.google.com

2. 右上の **「Get API key」** をクリック

3. **「Create API key」** → プロジェクトを選択（または新規作成）

4. 生成された API キーをメモしておく

> OpenAI・Claude は任意です。Gemini が失敗したときのフォールバックとして使用されます。

---

### Step 2 — Slack Incoming Webhook URL を取得する（Slack通知を使う場合）

1. **Slack API** にアクセス
   - https://api.slack.com/apps

2. **「Create New App」** → **「From scratch」** を選択

3. アプリ名を入力し、対象のワークスペースを選択 → **「Create App」**

4. 左メニューの **「Incoming Webhooks」** → **「Activate Incoming Webhooks」** をオン

5. **「Add New Webhook to Workspace」** → 投稿先チャンネルを選択 → **「許可する」**

6. 生成された Webhook URL（`https://hooks.slack.com/services/...`）をメモしておく

---

### Step 3 — Google Apps Script プロジェクトを作成する

1. **Google Apps Script** にアクセス
   - https://script.google.com/home

2. **「新しいプロジェクト」** をクリック

3. プロジェクト名を `mailjap` に変更

4. URL からスクリプト ID をメモしておく
   ```
   https://script.google.com/d/【スクリプトID】/edit
   ```

5. **スクリプトプロパティを設定する**
   - 左メニュー（歯車アイコン）**「プロジェクトの設定」** を開く
   - 下部の **「スクリプトプロパティ」** → **「スクリプトプロパティを追加」**

   | プロパティ名 | 値 |
   |---|---|
   | `GEMINI_API_KEY` | Step 1 で取得したキー |
   | `SLACK_WEBHOOK` | Step 2 で取得した Webhook URL |
   | `OPENAI_API_KEY` | （任意）OpenAI のキー |
   | `CLAUDE_API_KEY` | （任意）Anthropic のキー |

---

### Step 4 — Gmail ラベルとフィルタを設定する

#### ラベルを作成する

1. **Gmail** にアクセス
   - https://mail.google.com

2. 左メニュー下部 **「ラベルを作成」** で以下を作成する

   | ラベル名 | 用途 |
   |---|---|
   | `mailjap/python-weekly` | Python Weekly 受信用 |
   | `mailjap/programmer-weekly` | Programmer Weekly 受信用 |

   > `mailjap/done` は GAS が自動で作成します。手動作成不要です。

#### フィルタを設定する

1. Gmail 検索バー右端の **「フィルタと検索条件の作成」** をクリック

2. **「From」** に購読メールの送信元アドレスを入力（例：`newsletter@pythonweekly.com`）

3. **「フィルタを作成」** → **「ラベルを適用」** で対応するラベルを選択

4. 同様に各購読メールのフィルタを設定する

---

### Step 5 — clasp をインストールして認証する

```bash
# clasp をインストール
npm install -g @google/clasp

# Google アカウントで認証（ブラウザが開く）
clasp login

# 認証情報を確認（内容をコピーしておく）
cat ~/.clasprc.json
```

> `%` が末尾に表示される場合がありますが、それはシェルの表示です。`{` から `}` までの JSON 部分だけをコピーしてください。

---

### Step 6 — GitHub Secrets を登録する

1. **このリポジトリの Settings** にアクセス
   - https://github.com/peace098beat/mailjap/settings/secrets/actions

2. **「New repository secret」** をクリック

3. 以下を登録する

   | Name | Value |
   |---|---|
   | `CLASPRC_JSON` | Step 5 で `cat ~/.clasprc.json` の出力内容 |

---

### Step 7 — `.clasp.json` のスクリプト ID を確認する

[mailjap/.clasp.json](mailjap/.clasp.json) の `scriptId` が Step 3 で取得したものと一致していることを確認する。

```json
{
  "scriptId": "【スクリプトID】",
  "rootDir": "."
}
```

---

### Step 8 — main ブランチに push して自動デプロイを確認する

```bash
git push origin main
```

GitHub Actions のログを確認する：
- https://github.com/peace098beat/mailjap/actions

✅ `Push to GAS` ステップが成功すれば、GAS にコードが反映されています。

---

### Step 9 — GAS のトリガーを設定する（初回のみ）

1. **Google Apps Script** のプロジェクトを開く
   - https://script.google.com/home

2. 左メニューの **「トリガー」（時計アイコン）** をクリック

3. 右下の **「トリガーを追加」** をクリック

4. 以下の通り設定する

   | 項目 | 値 |
   |---|---|
   | 実行する関数 | `run` |
   | イベントのソース | 時間主導型 |
   | 時間ベースのトリガーの種類 | 時間ベースのタイマー |
   | 時間の間隔 | 1時間ごと |

5. **「保存」** をクリック

---

## 動作確認

手動で実行する場合は GAS エディタで `run` 関数を選択して **「実行」** をクリックしてください。

ログは GAS エディタの **「実行数」** または **「ログ（Ctrl+Enter）」** で確認できます。

---

## Slack 通知フォーマット

```
*[Python Weekly #742]* 2026-04-25
📌 今週のハイライト（日本語要約）
・FastAPIの新機能についての解説...
・Pythonのメモリ管理を理解する...
・...
🔗 原文: https://pythonweekly.com/p/...
```

---

## 新しい購読メールを追加する方法

[mailjap/config.gs](mailjap/config.gs) の `sources` 配列に追加します。

```javascript
{
  name: 'JavaScript Weekly',
  gmailLabel: 'mailjap/javascript-weekly',
  translate: true,
  notify: ['slack'],
  slackChannel: '#dev',
},
```

その後、Gmail でラベル `mailjap/javascript-weekly` とフィルタを作成し、`git push` するだけです。
