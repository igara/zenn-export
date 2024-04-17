---
title: "公式Slack Appを作成せずにSlackツールをChrome拡張で作成する技術"
emoji: "⚠️"
type: "idea" # tech: 技術記事 / idea: アイデア
topics: ["deprecated", "slack", "chromeextension"]
published: true
publication_name: chot
---

# この記事について

:::message
ここで出てくるSlackのトークンは公式で明示されていないトークン使用例のためおすすめできる方法ではありません。
トークンは個人ユーザに対してのものになりますので問題などは個人責任でよろしくお願いします。

この記事を閲覧するモチベーションとして下記を意識し、アイデアを広げるためのものと認識して閲覧してください。

- 裏技的に個人ツールが作成できる
- Chrome拡張でできることの幅を広げる

:::

# 作例したサンプルコード

https://github.com/igara/slack_message_chrome_extension

内容としては所属しているSlackチームのチャンネルを取得してチャンネルにメッセージを送信するSlack API使用できるかテストしたものになっています。

![chrome_extension](/images/deprecated_slack_chrome_extension/chrome_extension.gif)

# 解説

全体のスクリプトの挙動を図式化しました。
追って解説していきます。

![chrome_extension_architecture](/images/deprecated_slack_chrome_extension/chrome_extension_architecture.drawio.png)

## popup, content_script, background イベント伝搬方法

addListener, sendMessageによるイベント送信でそれぞれのスクリプトに情報を伝えるようにしています。

- イベント登録

```typescript
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.event === "任意のイベント名") {
    // 実行したい処理記載
  }
});
```

- イベント送信

```typescript
chrome.runtime.sendMessage(
  {
    event: "任意のイベント名",
    ...その他伝えたい情報など
  },
  () => {
    // 実行したい処理記載
  },
);
```

## HttpOnlyのCookie取得

通常はHttpOnlyのCookieを[document.cookie](https://developer.mozilla.org/ja/docs/Web/API/Document/cookie)から取得できません。
Chrome拡張は権限を許可することによって使用できるAPIがあります。

https://developer.chrome.com/docs/extensions/reference/permissions-list?hl=ja


`cookies` を許可してHttpOnlyのCookieをbackgroundのスクリプトから取得しています。

今回は[@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)を使用したもので[manifest.json](https://developer.chrome.com/docs/extensions/reference/manifest?hl=ja)の記載は[vite.config.ts](https://github.com/igara/slack_message_chrome_extension/blob/main/vite.config.ts)に記載しています。

## Slack APIのリクエスト

Slackをブラウザで開いて開発者ツールで[Slack API Docs](https://api.slack.com/methods)にあるものを実行してもCORSで弾かれます。
backgroundのスクリプトはHTML上で動作する環境とは異なり、NodeJSのような環境でAPIのリクエスト実行が可能です。

# 最後に

重ねてですが今回の方法はおすすめできる方法ではありません。
ですが、ちょっとしたハックで抜け道的に個人の業務改善や趣味に活用するための発想転換方法として思い出していただければ考えています。

# 参考リンク

- https://zenn.dev/7oh/scraps/98d5cdcceb9bd8
  - Chrome拡張を作成する際に参考した
- https://api.slack.com/authentication/token-types
  - Slack公式が明示しているトークンについての説明
- https://github.com/adsr/irslackd/issues/91#issuecomment-647051680
  - このコメントをきっかけにSlack Appではないトークンの仕組みについて知った
  - Chromeの開発者ツールでxoxcトークンの存在は知っていたが、Cookieの値の `d` が必要というのを知った
- https://stackoverflow.com/questions/62759949/accessing-slack-api-with-chrome-authentication-token-xoxc
  - Slack APIを使用するなら適切なスコープでSlack Appを作成することをすすめるのは正しい
- https://zenn.dev/hosyan/articles/342fb29e9da76f
  - 数少ないxoxcトークンを使用したツールの例として観測した記事
