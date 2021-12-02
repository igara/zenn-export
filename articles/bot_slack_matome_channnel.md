---
title: "Slackのチャンネルのメッセージを1つのチャンネルに集約するSlackボットを作ってみた"
emoji: "💬"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["slack", "gas", "googleappsscrip"]
published: true
---
作ろうとした背景としてメンバー各位が書く分報チャンネルがあってチャンネル参加してなくても一括に確認できるようなものがあったらいいなと思っていたので作ってみた感じです。  

Slackの分報を社内Twitterに！皆の分報を一つのチャネルに集約するSlackボットを作ってみた  
https://zenn.dev/ryo_kawamata/articles/times-all-bot  
のパクリですがGAS版として投稿しています。  

## 作成物

https://github.com/igara/bot_slack_matome_channnel

![](/images/bot_slack_matome_channnel/slack_bot_message.gif)

オプションで集約したくないチャンネルの場合は無視できるようなものを作成しました。  

:::message
GASなので利用回数の制限があるので注意です。  
https://developers.google.com/apps-script/guides/services/quotas  

2021/04/20時点では

Feature | Consumer (e.g., gmail.com) and G Suite free edition(legacy) | Google Workspace accounts |
| ---- | ---- | ---- |
| Triggers total runtime | 90 min / day |　6 hr / day |
| URL Fetch calls | 20,000 / day | 100,000 / day |

と記載されていますので規模感に合わせてGASじゃない実装にしたほうが良いというのもありそうです。  
TriggerはSlackの情報をSpreadsheetにキャッシュさせるために使用したり、  
URL FetchはSlackにメッセージを流すために使用していますので上記の上限できびしいなと思ったらこの記事を参考にしないほうがいいと思います。
:::

## セットアップ

### Slackアプリのscope設定

https://api.slack.com/apps からアプリを作成し、  
**OAuth & Permissions** の画面から以下のscopeをBot Userに追加します。  

- channels:history
- channels:read
- chat:write
- users.profile:read
- users:read
- users:read.email

usersのscopeはSpreadsheetに情報を残した際にメールアドレスもGoogle Workspaceとの連携も楽そうという未来実装的に入れているものなので本題では不要なscopeだったりします。  

![](/images/bot_slack_matome_channnel/slack_bot_scope.jpg)

設定が完了したら **OAuth & Permissions** の画面上部にある **Bot User OAuth Token** の値をコピーしましょう。  

### GASのプロジェクトを作成

下記コマンドからソースを持ってきます。  

```
git clone https://github.com/igara/bot_slack_matome_channnel.git
cd bot_slack_matome_channnel
```

環境変数の適応を行います。

```
cp .env.sample.ts .env.ts
```

```ts
export default {
  // Slackのチーム名
  SLACK_TEAM: "hoge",
  // OAuth & Permissionsのページに記載されてたBot User OAuth Token
  SLACK_ACCESS_TOKEN: "xoxb-xxxxx-xxxxx-xxxxx",
  // メッセージを送りたい対象のチャンネル名
  BOT_SLACK_MATOME_CHANNEL_NAME: "bot_slack_matome_channnel",
  // 集約したい対象のチャンネル名の正規表現 下記は分報チャンネル想定
  TARGET_CHANNEL_REGEXES: [/^t_\S*/, /^time_\S*/],
  // TARGET_CHANNEL_REGEXESの中から除外したいチャンネルの正規表現
  IGNORE_TARGET_CHANNEL_REGEXES: [/^t_ignore_\S*/, /^time_ignore_\S*/],
};
```

下記のコマンドからSpreadsheet & GASを作成します

```
npm install

# login
npx clasp login

# new create spreadsheet & script project & .clasp.json
npm run new name=hoge

# build
npm run build
# push
npx clasp push
```

上記を実行するとSpreadsheetが作成され、その中にあるスクリプトエディターを開くとGASも追加されているかと思います。

![](/images/bot_slack_matome_channnel/create_spreadsheet.jpg)

![](/images/bot_slack_matome_channnel/create_gas.jpg)

### SpreadsheetにSlackの情報を読み込む

スクリプトエディターから下記の関数を実行してSlackの情報をSpreadsheetに残します。  

- **create_sheets.ts.gs** の **createSheets** を実行して必要なシートを作成
- **get_channels.ts.gs** の **getChannels** を実行してシートにチャンネルの情報を残す
- **get_users.ts.gs** の **getUsers** を実行してシートにユーザの情報を残す

スクリプトエディターを経由しないで実行する方法として  

https://qiita.com/jiroshin/items/dcc398285c652554e66a#%E3%83%AD%E3%83%BC%E3%82%AB%E3%83%AB%E3%81%8B%E3%82%89gas%E3%82%92%E5%8F%A9%E3%81%8F

にあるようなGoogle Cloud Consoleと自前で作成したClaspのログインができていれば  

```
npx clasp run createSheets
npx clasp run getChannels
npx clasp run getUsers
```

というようなコマンドで実行が可能です。  
その際のGoogleアプリのスコープ設定はこちらの設定がされていればよいはず  
https://github.com/igara/bot_slack_matome_channnel/blob/master/dist/appsscript.json#L14-L29

### Webアプリケーション公開する

スクリプトエディターのメニューから 公開 -> ウェブアプリケーションとして導入から更新を実行し、

![](/images/bot_slack_matome_channnel/update_gas_web_appllication.jpg)

公開したWebアプリケーションのURLをコピーします。

### SlackのEvent Subscriptionsを登録する

**Request URL** に公開したGASのWebアプリケーションのURLを貼り、**Verified** が表示されるか確認します。

![](/images/bot_slack_matome_channnel/slack_event_request_url.jpg)

確認できたら、 **Subscribe to bot events** の項目で

- message.channels

を登録してください。

![](/images/bot_slack_matome_channnel/slack_event_bot.jpg)

以上で設定は完了です。  
Slackで対象のチャンネルを作成してメッセージを投稿してみてボットのメッセージが送られるようになっていたら成功です。

## ソースコード雑に説明

### [src/tasks/create_clasp_json.ts](https://github.com/igara/bot_slack_matome_channnel/blob/master/src/tasks/create_clasp_json.ts)

https://github.com/google/clasp#create に該当するもの  
Spreadsheetとスクリプトエディターの名前を一緒にしたかったから自作したようなもの  

### [src/gas/create_sheets.ts](https://github.com/igara/bot_slack_matome_channnel/blob/master/src/gas/create_sheets.ts)

GASとして使用する関数  
GAS経由にシートを作成する  

```ts
Spreadshhet.deleteSheet(Spreadshhet.getSheetByName("channels"));
const channelsSheetColumnNames = ["id", "name"];
const ChannelsSheet = Spreadshhet.insertSheet("channels");
ChannelsSheet.getRange(1, 1, 1, channelsSheetColumnNames.length).setValues([channelsSheetColumnNames]);
```

な削除して再度シート作成するような作りになっている  

過去に作ったGoogle API経由でCSVを元にシートを作成するのもありっちゃあり  
https://github.com/igara/spreadsheet_master/blob/master/src/tasks/recreate_spreadsheet.ts

ローカルPCで実行するよりGASの環境で実行したい気持ちが今回強かった  

### [src/gas/do_post.ts](https://github.com/igara/bot_slack_matome_channnel/blob/master/src/gas/do_post.ts)


SlackのEvent Subscriptions経由できたメッセージがリクエストされて処理を実行するGASの関数  

今回設定したEvent Subscriptionsがメッセージに対する更新系もプッシュされていたので除外するために書いた処理がこちら

https://github.com/igara/bot_slack_matome_channnel/blob/master/src/gas/do_post.ts#L9-L23

必要に応じて除外しているものを活用してみるのも良さそう  
なおGASの利用枠

### [src/gas/get_channels.ts](https://github.com/igara/bot_slack_matome_channnel/blob/master/src/gas/get_channels.ts)

GASとして使用する関数  
Slack APIを叩いてすべてのチャンネルを取得する  
スクリプトエディターで定期実行するトリガーを設定できるのでこの関数を時間実行できると良いかも  

トリガーの設定もコード化したい場合は下記のコードを参考にすればいけるんですかね？（試してない
https://developers.google.com/apps-script/guides/triggers/installable#managing_triggers_programmatically

### [src/gas/get_users.ts](https://github.com/igara/bot_slack_matome_channnel/blob/master/src/gas/get_users.ts)

GASとして使用する関数  
Slack APIを叩いてすべてのユーザを取得する  

### [src/utils/tasks/clasp_json.ts](https://github.com/igara/bot_slack_matome_channnel/blob/master/src/utils/tasks/clasp_json.ts)

JSONファイルでも型定義したい思いが強くてtsファイル経由で読み込もうとしている

### [src/utils/tasks/clasprc_json.ts](https://github.com/igara/bot_slack_matome_channnel/blob/master/src/utils/tasks/clasprc_json.ts)

JSONファイルでも型定義したい思いが強くてtsファイル経由で読み込もうとしている

### [src/utils/tasks/google.ts](https://github.com/igara/bot_slack_matome_channnel/blob/master/src/utils/tasks/google.ts)

Google API クライアント扱う
