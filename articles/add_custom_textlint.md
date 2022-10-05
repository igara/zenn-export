---
title: "Spreadsheet管理のライティングルールをtextlintで浸透させる VSCodeにも適応する"
emoji: "✅"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["textlint", "spreadsheet", "vscode"]
published: true
---

文章を書く際、表記揺れをしないようルールを決めることがあると思います。  
その際に共通の定義としてSpreadsheet管理することが多い気はしますが情報が定着せず知らずにレギュレーション違反することもあるでしょう。  
この記事は半強制的にルールを浸透させる仕組みとしてtextlintの独自ルールを用いて自分ならこう運用するという記事になります。

## サンプル

https://github.com/igara/textlint-custom-rule

ディレクトリ構成としてモノレポ構成な感じでやってます。  
実際複数のソースがある場合でも共通のVSCodeの設定を使用したい事が多いので独自のtextlintのプロジェクトもpackagesディレクトリで管理してます。

### ファイル説明

#### 導入に必要なファイル説明

##### [.vscode/extensions.json](https://github.com/igara/textlint-custom-rule/blob/main/.vscode/extensions.json)

VSCodeの拡張の[vscode-textlint](https://marketplace.visualstudio.com/items?itemName=taichi.vscode-textlint)を全員に使用してほしいので追記してます。  
VSCode拡張インストール完了したらtextlintをグローバルインストールする必要があります。  

```
npm i -g textlint
```

##### [.textlintrc.js](https://github.com/igara/textlint-custom-rule/blob/main/.textlintrc.js)

textlint設定ファイルです。

```
    '@textlint/text': {
      extensions: [
        '.php',
        '.ctp',
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
        '.css',
        '.scss',
        '.md',
        '.txt',
        '.csv',
        '.json',
        '.yaml',
        '.yml',
        '.sql',
      ],
    },
```

textlint適応対象のファイルを指定します。  
複雑に言語構文としてではなくテキストとして構文解析させるように[@textlint/text](https://github.com/textlint/textlint/tree/master/packages/%40textlint/textlint-plugin-text)を使用しています。  


```
  rules: {
    '@igara/writing-guideline': {
      severity: 'warning',
    },
  },
```

今回追加するtextlintの独自のライティングルールを指定してます。
@igara/writing-guidelineはnpmに公開しているわけでもなく[package.json](https://github.com/igara/textlint-custom-rule/blob/main/package.json)にファイルパス指定でインストールさせています。  

こちらのファイルを設定することでcliでもtextlint検出が可能になります。  

![](/images/add_custom_textlint/vscode.jpg)

##### [.vscode/settings.json](https://github.com/igara/textlint-custom-rule/blob/main/.vscode/settings.json)

VSCode上でtextlint適応したいファイルの指定をしています。

```
  "textlint.languages": [
    "php",
    "html",
    "typescript",
    "typescriptreact",
    "javascript",
    "javascriptreact",
    "css",
    "scss",
    "markdown",
    "plaintext",
    "csv",
    "json",
    "yaml",
    "sql"
  ],
```

こちらの設定によりVSCodeの編集中でも解析が入るようになります。  

![](/images/add_custom_textlint/vscode.jpg)

#### [textlint独自ルールファイル説明](https://github.com/igara/textlint-custom-rule/tree/main/packages/textlint-rule-writing-guideline)

###### [import.ts](https://github.com/igara/textlint-custom-rule/blob/main/packages/textlint-rule-writing-guideline/import.ts)

Spreadsheetの内容を[writing.json](https://github.com/igara/textlint-custom-rule/blob/main/packages/textlint-rule-writing-guideline/writing.json)に反映するためのスクリプトです。  

このスクリプト実行する前にGoogleのアプリケーションを作成してcredentialのJSONファイルを作る必要があります。  

作り方は下記を参考になると思います。  
https://developers.google.com/sheets/api/quickstart/nodejs


```javascript
/**
 * @see https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}
 */
const SPREADSHEET_ID = '1iYQ3sOOCGFPigtakcpfui0wLUsXwWfqS9TmpUgpiuQY';
```

を変更すれば他のSpreadsheetからの適応も可能になります。  

```javascript
const SHEET_1 = 'シート1';
const LINT_COLUMN = 'A';
const LINT_COLUMN_ARRAY_INDEX = 0;
//const OK_COLUMN = 'B';
const OK_COLUMN_ARRAY_INDEX = 1;
// const NG_COLUMN = 'C';
const NG_COLUMN_ARRAY_INDEX = 2;
const IGNORE_COLUMN = 'D';
const IGNORE_COLUMN_ARRAY_INDEX = 3;
```

ここの値はSpreadsheetの行列に依存しますがこんな感じのシートの想定でやってます。  

![](/images/add_custom_textlint/spreadsheet.jpg)

| Lint対応 | OK | NG | Ignore | 補足 |
| ---- | ---- | ---- | ---- | ---- |
| 対応中 | ください | 　 | 下さい | 　 |
| 対応中 | 。 | \\. | \[a-zA-Z_0-9\]\. | 英語表記ではないときの文章では「。」に置き換えること |

Lint対応列が「対応中」か「済」のときにwriting.jsonに保存対象にしています。  
NG, Ignoreの値は正規表現のものを実際のtextlintのルールでは許可しています。  
単語の表記揺れ修正の場合は正規表現を使わなくても良さそうですが構文的なものはちょっと考える必要があるなと思いました。  

```
npm run spreadsheet
```

でinportの実行ができるようにしてます。

###### [writing.json](https://github.com/igara/textlint-custom-rule/blob/main/packages/textlint-rule-writing-guideline/writing.json)

import.tsで生成されるファイルです。  
値のアクセスをしやすいようにNGワードをKayにしています。  

```json
{
  "下さい": {
    "ok": "ください",
    "ignore": "",
    "url": "https://docs.google.com/spreadsheets/d/1iYQ3sOOCGFPigtakcpfui0wLUsXwWfqS9TmpUgpiuQY/edit#gid=0&range=2:2"
  },
  "\\.": {
    "ok": "。",
    "ignore": "[a-zA-Z_0-9]\\.",
    "url": "https://docs.google.com/spreadsheets/d/1iYQ3sOOCGFPigtakcpfui0wLUsXwWfqS9TmpUgpiuQY/edit#gid=0&range=3:3"
  }
}
```

urlも作成したのはVSCode、cliから実際のルールを記載しているリンクへ遷移できたら便利そうなので追加してます。  
ここのうまい方法わかっていないのでVSCodeもしくは拡張勉強してみたいというモチベーションがありますね。  

###### [index.ts](https://github.com/igara/textlint-custom-rule/blob/main/packages/textlint-rule-writing-guideline/src/index.ts)

textlintの独自のルールを実装したファイルです。  
[writing.json](https://github.com/igara/textlint-custom-rule/blob/main/packages/textlint-rule-writing-guideline/writing.json)の定義から正規表現で頑張って違反してるかやってるコードです。  

###### [index.js](https://github.com/igara/textlint-custom-rule/blob/main/packages/textlint-rule-writing-guideline/lib/index.js)

index.tsをビルドして生成されたファイルです。

```
npm run build
```

でビルドできるようにしています。

###### [index-test.ts](https://github.com/igara/textlint-custom-rule/blob/main/packages/textlint-rule-writing-guideline/test/index-test.ts)

[index.ts](https://github.com/igara/textlint-custom-rule/blob/main/packages/textlint-rule-writing-guideline/src/index.ts)に対して[invalid.tsx(lintにひっかかる)](https://github.com/igara/textlint-custom-rule/blob/main/packages/textlint-rule-writing-guideline/test/inputs/invalid.tsx)と[valid.tsx(lintにひっかからない)](https://github.com/igara/textlint-custom-rule/blob/main/packages/textlint-rule-writing-guideline/test/inputs/valid.tsx)文章をテストするコードです。

[.vscode/launch.json](https://github.com/igara/textlint-custom-rule/blob/main/.vscode/launch.json)によってデバッグの設定も入れているのでVSCodeのデバッグ機能も有効になっています。

## その他伝えたいこと

textlintの独自ルールを作成する際、下記のブログがすごいお世話になりました。  

https://someiyoshino.info/entry/2022/07/30/185845

