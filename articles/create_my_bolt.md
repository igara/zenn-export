---
title: "理想のボルト・ネジ 2BA(British Association)の作成"
emoji: "🔩"
type: "idea" # tech: 技術記事 / idea: アイデア
topics: ["blender", "darts", "3Dプリンター"]
published: true
---

# 記事の目的

昔に[Blenderで作成した3DモデルをAnkerMake M5で印刷する](https://zenn.dev/igara/articles/beginner_3d_printer)を書いて当初はネジの厳密な規格のサイズで作ってなかったということで改めて記事化してみた

前書いた記事のときはBAをBritish Associationの略称であることを知らず、とりあえず4mmサイズでそれっぽく作ってどのみち3Dプリンターの精度の誤差(FDM熱溶解積層方式は±0.1～0.3mm、LCD光造形方式は±0.05～0.1mmぐらいといわれている)は発生するので厳密に作ることはしなかった

予備知識としてダーツの矢の構成として、バレル、フライト、シャフト、チップの構成になっている

![darts](/images/create_my_bolt/darts.jpg)

ちなみに右側にあるフライトは自作

# 2BAとは

BA規格というのはイギリスの規格でウィットネジともいわれている
日本では1968年にJIS規格から外されISO規格に統一されたため、なぜかダーツ界隈で残っているネジ規格である

ヤードポンド法の闇って感じ

[wiki](https://en.wikipedia.org/wiki/British_Association_screw_threads)と[Ring & Plug Screw Thread Gages](https://www.ring-plug-thread-gages.com/PDChart/BA-thread-data.html)の情報からの引用で

| BA | Thread pitch / ネジ山の間隔 (mm) | Major diameter / Outside diameter / 外径 (mm) | Minor Diameter / 内径 (mm) |
|-----|-------------------------------|---------------------------------------------|---------------------------|
| 2BA | 0.81                          | 4.70                                        | 3.73                      |

というサイズになる

# BlenderのBolt Factoryで2BAを作成

![blender](/images/create_my_bolt/blender.png)

上記の2BAサイズの情報を元に

- Thread
  - Major Dia (mm): 4.5
  - Minor Dia (mm): 3.50
  - Pitch (mm): 0.81

で作成

±0.1〜0.2mmぐらいの誤差は発生すると思ったのでPitch以外の数値はずらしている

Lengthを高めに作っていたのはどのバレルでどのぐらいの穴の深さあるか調べるために高めにしていた

# 他のソフトウェアで2BA作成できるのか？

多分編集の仕方や選択できる規格としてある気はするのだが見当たらなかった

## OpenSCAD

### Easy Bolt

[Easy Bolt](https://www.thingiverse.com/thing:6308320)

UNC(ユニファイ)やM(メートル)規格はあるがBA規格は見当たらなかった

![Easy Bolt](/images/create_my_bolt/EasyBolt.png)


## FreeCAD

UNCや一部ISO規格はあるがBA規格は見当たらなかった

![FreeCAD](/images/create_my_bolt/freecad.png)