---
title: "Blenderで作成した3DモデルをAnkerMake M5で印刷する"
emoji: "🖨️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["3dプリンター", "blender"]
published: true
---

この記事は、[Lancers（ランサーズ） Advent Calendar 2023](https://qiita.com/advent-calendar/2023/lancers) の13日目の記事です。

## 概要

Amazon ブラックフライデーで[AnkerMake M5](https://www.ankerjapan.com/pages/anker-make)を購入し、色々3Dモデルも作ってみて実際にプリントしてみたTipsです。

Blenderでモデルを作成してstlファイルに出力すれば結構色々作れることがわかったので色々試してみました。

## ボルトを作成する

Blenderの拡張で[Bolt Factory](https://docs.blender.org/manual/en/latest/addons/add_mesh/boltfactory.html)というのがあります。

BlenderのメニューからEdit -> Preferences -> Add-onsから「bolt」と検索すると「Bolt Factory」をインストールすることで使えるようになります。

![blender_preferences](/images/beginner_3d_printer/blender_preferences.png)

インストール後はObject ModeでAdd -> Mesh -> Boltでボルトが追加されます。

![add_bolt](/images/beginner_3d_printer/add_bolt.png)

追加後はモデルを右クリックすることで「Change Bolt」を選択することで変更が可能になります。

ボルト以外にナットや「Operator Presets」からm3やm4などのボルトの規格にあったモデルに変更が可能だったり、独自に変更できることがわかりました。

![bolt_print](/images/beginner_3d_printer/bolt_print.png)

## ソフトダーツのフライトを作成する

色々試してみたのですがフィラメントの強度的に諦めました。

### 試作1

シャフトとフライトを分けて作りました。

![test_1_flight](/images/beginner_3d_printer/test_1_flight.png)

フライトは4つキューブの追加してScaleや座標を変えてそれっぽく作りました。

![test_1_shaft](/images/beginner_3d_printer/test_1_shaft.png)

シャフトはネジの箇所はBot Factoryで作成し、[2BA](https://www.dartshive.jp/html/page361.html)という規格なのでそれっぽく編集しました。

あとは細長い円柱を追加し、フライト箇所の凹部分は[Booleanモディファイアー](https://docs.blender.org/manual/ja/dev/modeling/modifiers/generate/booleans.html))を適応して作りました。

凹部分が衝撃に弱く1回投げただけで破壊しました。

### 試作2

試作1の反省から今度はフライトとシャフトが一体化したものを作成しました。

![test_2](/images/beginner_3d_printer/test_2.png)

![test_2_print](/images/beginner_3d_printer/test_2_print.png)

プリントするときに上の方が出来上がってくると段々バランスが崩れて倒れるので途中木工用ボンドで固定して印刷しました。

投げた結果ですが多様は耐久性は上がったのですが4~5回ぐらいでネジ箇所が弱りネジのとこで折れ、バレルに詰まりました。

### 試作3 未完成

今度はネジ山箇所の強度が課題になったので印刷面を変更してネジ箇所を横にして印刷を試みました。

![test_3_1](/images/beginner_3d_printer/test_3_1.png)

![test_3_2](/images/beginner_3d_printer/test_3_2.png)

という半分にしたようなモデルを作成しましたが、実際に印刷するとネジ山の箇所のギザギザの精度がだいぶ荒くなり諦めました。

![test_3_print](/images/beginner_3d_printer/test_3_print.png)

## 456賽を作成する

4・5・6の目しかない[チンチロリン](https://ja.wikipedia.org/wiki/%E3%83%81%E3%83%B3%E3%83%81%E3%83%AD%E3%83%AA%E3%83%B3)で絶対役が出るサイコロです。

https://blender-cg.net/dice/

こちらの記事を参考にして作成しました。

面取り、ループカット、面の差し込み、押し出し、細分割曲面などチュートリアルとしては最初にやりたかったことが多く勉強になりました。

![456](/images/beginner_3d_printer/456.png)

## ダーツケース作成中

これまでの知識を活かしてダーツケースを作成中です。

![case](/images/beginner_3d_printer/case.gif)

強度面が課題になっていますが印刷するときに[AnkerMake Studio](https://www.ankermake.com/ankermake-studio)をあまり意識していないとこもあるので見直していき色々考えた上で良いものを作り上げたいと思います。
