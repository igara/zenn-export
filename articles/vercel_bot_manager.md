---
title: "Vercelのコストを抑えるためにBot対策する"
emoji: "😠"
type: "idea" # tech: 技術記事 / idea: アイデア
topics: ["vercel"]
published: true
publication_name: chot
---

**なにやら様子のおかしいアクセスが増えている**

# 最近の自分の話やSNS情報ついて（世間話）

## 自分の案件の話

案件スタート時(2025年3月)は、Vercelのコストを下げることを目的にしたNext.jsのアップデートとしてスタートし、コストが高い原因を分析しながら進めてました。

![Usage](/images/vercel_bot_manager/usage.png)
*VercelのUsage*

アップデートの対応しながらVercelのログとUsageになにか異常あるなと3月末に気づくことになり、4月からBot対策に本気を出したという感じでした。

(コスト下げるために案件やっていたのでこのタイミングでコスト上がってると言われたらふざけんな😡ともなるわけで...)

とはいえBot対策してみたらNext.jsのアップデート以上にコストを抑えることに繋がりました。

本案件対応前の1・2月段階でもBotは存在していましたが、**3・4月以降になってからなにやら様子のおかしいアクセスが増えている**気はしています。

引き続き怪しいアクセスがないか監視中です。

## [X(旧Twitter)でバズってたVercelのBot制限でコスト下がった話](https://x.com/ZaynHao/status/2042187522416242985)

https://x.com/ZaynHao/status/2042187522416242985

WordPress特有のURLに対してアクセス制限したらコストが下がったという内容のものでフレームワーク特有のものなら攻撃者として弾いてしまうのはアリだなと思った内容でした。

Xの投稿も4月最初のものなのでなんか自分だけでなくいろんなとこで攻撃されているんだなと薄々思うものでした。

## [外部からアクセス可能なhttpsサイトはドメイン設定後「即」攻撃にさらされる件](https://zenn.dev/kusuke/articles/25330f7759eba4)

https://zenn.dev/kusuke/articles/25330f7759eba4

攻撃する側もこのURLが一般的に公開されているから攻撃しようではなく、
CT Logの仕組みから自動的に攻撃するようなものがあると、いよいよ見境なく攻撃しているんだなと危機感を覚えたものでした。

最近のAIツールなどでもこういったものは自作が可能しやすい状況でもあるため、ここ最近の様子のおかしいアクセスも積み重ね的に起きているんだろうと思いました。

# VercelのBot対策したもの

## [Bot Management](https://vercel.com/docs/bot-management)

- 下記を有効
    - [Bot Protection](https://vercel.com/docs/bot-management#bot-protection-managed-ruleset)
    - [AI Bot](https://vercel.com/docs/bot-management#ai-bots-managed-ruleset)

## CustomRules: 全体のRateLimit設定

:::message
調整中サイトに合わせて調整した方が良い
特にSEOにも影響するため
Top AS Names（プロバイダー名）で怪しいとこだけが引っ掛かるぐらいがちょうど良さそう
:::

- 設定しているもの
    - Request Path
        - Contains
            - /
    - And Request Path
        - Does not contain
            - 画像ファイルなどのVercelで使用されるファイル
    - Rate Limit
        - 60 seconds
        - 40 requests
        - 1 keys JA4 Digest
        - Too Many Requests 429
            - Optional

## トラフィックから監視

### アクセス多いものを疑った方がいい

下記のものでVercelのトラフィックからログとして監視してたりします

![Usage](/images/vercel_bot_manager/log.png)
*Vercelに設定したCustomRulesのLog一覧*

- Top JA4 Digests
    - [JA4はTLS Fingerprint](https://vercel.com/docs/vercel-firewall/firewall-concepts#ja4)
        - TLSハンドシェイクの詳細（バージョン、サポートする暗号スイート、拡張など）からハッシュを生成したもの
        - IPやUser Agentと違いクライアント側で容易に変更しにくいため、より信頼性が高い識別子となる
    - 完全一意ではないけどIP、User Agentよりかは信頼性が高い
    - 多いものに対してCustomRulesよりlog監視対象にしておくと良さそう
- Top Request Paths
    - 大体Botは同じパスを巡回しがちなので
        - 最近はTwitterの検索経由で来るBotも存在する
            - しかもこいつGooglebotって名乗ってた
- Top User Agents
    - 自認GooglebotとしてBot Protectionを貫通してアクセスしてくるものがいる
        - JA4 DigestsとRequest Pathsの組み合わせで弾くのが良さそう
    - X11 Linux x86_64
      - LinuxのXWindow、おそらくリモートデスクトップ環境利用
        - シンクライアントとしてのアクセス？
        - Kali Linuxなようなものも考えられる
      - 日本リージョンのGCPからのアクセスが多かった
- Top AS Names
  - 怪しいプロバイダーからのアクセスかみる
  - GCPからのアクセスが多い
    - 純粋なGooglebotもある

# 最後に

**なにやら様子のおかしいアクセスが増えている** ということで今後も対策を続けたいと思っており、稚拙ながら自分の対応してみたことを記載してみました。

自分の認知にはないことも多くあると思いますのでこの記事にコメントやリプがあると助かります！
