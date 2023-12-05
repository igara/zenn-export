---
title: "iOSシミュレータも使ったVRTとGitHub Actions小ネタ"
emoji: "🍎"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["ios", "storybook", "vrt", "appium", "githubactions"]
published: true
---

この記事は、[Lancers（ランサーズ） Advent Calendar 2023](https://qiita.com/advent-calendar/2023/lancers) の6日目の記事です。

## 概要

ここで話すVRT(Visual Regression Testing)はStorybook + storycap + reg-cliを使った方法に対してさらにiOSのSafariブラウザ上でもテストができるようにするためにしたことを記載します。

UIの実装でブラウザのデフォルトのスタイルが表示されてしまってブラウザごとにスタイルが異なることがあると思います。

![ios_vrt_result](/images/ios_sim_vrt/ios_vrt_result.png)

その他、GitHub ActionsのWorkflowを活用してみたら色々活用できそうというのが見えてきたので諸々解説していきたいと思います。

## ソースコード

https://github.com/igara/vrt_sample

## GitHub Actions

- Workflow一覧: https://github.com/igara/vrt_sample/actions
  - `frontend_vrt`  
    通常のVRT Puppeteer経由にChroniumで検証する
  - `frontend_vrt_ios`  
    [snapshot_ios.js](https://github.com/igara/vrt_sample/blob/main/snapshot_ios.js)でiOSシュミレータ起動しながらスクショを撮りreg-cliで画像差分を出すようにしている  
    reg-cliって実はディレクトリ・ファイル名で比較して差分の画像生成しているだけなので今回はAppinumでiOS起動してスクショ撮ったが別のツールでも応用効きそう  
    このときに動かしていたActionsのmacOSも更新次第によっては使用できるOSのバージョンも異なってきそう(https://github.com/actions/runner-images/blob/d5c955d/images/macos/macos-13-arm64-Readme.md)

今回は追加していないのですがChroniumとiOSで比較するWorkflowというのがあってもいいかもしれませんね。

### Workflowの実行

実行タイミングを `workflow_dispatch` にしているのでActionsのUIから実行します。

![workflow_dispatch](/images/ios_sim_vrt/workflow_dispatch.png)

Run workflowから比較対象のブランチやハッシュ、タグからでも実行可能なので導入が早ければ大昔のと最新の差分をソースコードではなくビジュアル的に可視化することも使い方によっては可能になると思います。

実行が完了するとActionsのArtifactsにVRTの結果のレポートをダウンロードできるようになります。

![artifacts](/images/ios_sim_vrt/artifacts.png)

ActionsのArtifactsは保存できる期間が決まっているのでレポート出力後にreleases機能でGitのタグを作るついでにVRTのレポート結果も一緒にアップロードしてあげるといいかもしれません。

https://github.com/igara/vrt_sample/releases/tag/20231205-02

![releases](/images/ios_sim_vrt/releases.png)

## 問題点・まとめ

iOSの実行時間かかるのとたまにメモリの問題で失敗することがあります。メモリに関しては通常のVRTでもたまにあるので要チューニングなとこあります。

Actionsで実行させる前に自分のローカル環境でもiOSのVRT実行できるように開発環境を進めたのですが、Appiumを動かす環境を作るのが手間だったというのがありました。

`appium-doctor --ios` が通ることが最小限ですがiOSシミュレータのSafariを使用するぐらいなら [appium-safari-driver](https://github.com/appium/appium-safari-driver) を使えば良いという結論になったのも情報が少ないながらも頑張ったなと思いました。

シミュレータ起動して作成したStoryのものが画面に表示したときは感動しました。
