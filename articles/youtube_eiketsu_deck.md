---
title: "[ImageHash] YouTubeのサムネから英傑大戦のデッキを作成する"
emoji: "⚔️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["youtube", "imagehash", "nodejs"]
published: true
---

# この記事について

![youtube_playlist](/images/youtube_eiketsu_deck/tyojo_taiketsu_playlist.png)

[英傑大戦 公式チャンネルの【英傑大戦】頂上対決プレイリスト](https://www.youtube.com/playlist?list=PLvy-GrTTg3WxIPplHPm5GYOfgX8Hw8uMu)という英傑大戦の全国上位のリプレイが公開されているものがあり、ここのプレイリストのサムネイル画像が対戦前に表示される使用するカードの画面の画像であったため、サムネイルからデッキの情報を取得できないかと実践してみたものです。

その際にImageHashのライブラリを使用したら、結構試行錯誤しながら画像検出してカードの情報を取得できたので、その方法を共有します。

ImageHashとは
画像のハッシュ値を取得するライブラリで、画像の類似度を比較することができます。

# 作成したコード

https://github.com/igara/eiketsu-taisen-tool/blob/main/data/import.ts

1つのファイルに3つの関数を記載しているため役割として3つありますので順番に説明していきます。

## 関数説明

### main

```bash
node --experimental-strip-types import.ts --mainExec
```

より実行される関数で、英傑大戦公式のデータベースのAPIからカードの情報を取得しています。  

:::details 武将データ・カード画像取得処理
```typescript
	for (const general of generals) {
		const dirName = `data/generals/${general.color.name}/${general.no}_${general.name}`;
		fs.mkdirSync(dirName, { recursive: true });

		fs.writeFileSync(`${dirName}/index.json`, JSON.stringify(general, null, 2));

		const imageUrl = `https://image.eiketsu-taisen.net/general/card_ds/${general.detailImageId}.jpg`;

		const imageRes = await fetch(imageUrl);
		const imageArrayBuffer = await imageRes.arrayBuffer();
		const imageBuffer = Buffer.from(imageArrayBuffer);
		fs.writeFileSync(`${dirName}/1.jpg`, imageBuffer);

		const image = await sharp(imageBuffer);
		const { width, height } = await image.metadata();
		if (!(width && height)) continue;

		await image
			.clone()
			.extract({
				left: 0,
				top: 0,
				width: width / 2,
				height: height,
			})
			.toFile(`${dirName}/2.jpg`);

		await image
			.clone()
			.extract({
				left: width / 2,
				top: 0,
				width: width / 2,
				height: height,
			})
			.toFile(`${dirName}/3.jpg`);

		const thumbnailUrl = `https://image.eiketsu-taisen.net/general/card_small/${general.id}.jpg`;
		const thumbnailRes = await fetch(thumbnailUrl);
		const thumbnailArrayBuffer = await thumbnailRes.arrayBuffer();
		const thumbnailBuffer = Buffer.from(thumbnailArrayBuffer);
		fs.writeFileSync(`${dirName}/4.jpg`, thumbnailBuffer);

		const thumbnail = await sharp(thumbnailBuffer);
		const t5 = thumbnail.clone().extract({
			left: 10,
			top: 11,
			width: 140,
			height: 215,
		});
		await t5.toFile(`${dirName}/5.jpg`);

		const publicDir = `../app/public/images/generals/${general.no}_${general.name}`;
		fs.mkdirSync(publicDir, { recursive: true });
		await t5.toFile(`${publicDir}/5.jpg`);
	}
```
:::

上記の処理より、[武将データ・カード画像](https://github.com/igara/eiketsu-taisen-tool/tree/main/data/data/generals/%E7%8E%84/%E7%8E%84127_%E4%BC%8A%E9%81%94%E6%94%BF%E5%AE%97)を取得しています。

最初は4.jpgの画像を使用して画像の比較を行っていましたが、カードのフレーム部分が含まれているため、比較がうまくいかなかったため、5.jpgという武将の箇所のみを切り取った画像を後の関数で使用しています。

![4_5PNG](/images/youtube_eiketsu_deck/4_5.png)

### youtubeImport

```bash
GOOGLE_KEY=xxxxxxx node --experimental-strip-types import.ts --youtubeImportExec
```

この関数ではYouTubeのプレイリストの情報とサムネイル画像を取得しています。
Google Cloud PlatformのAPIを使用するため、APIキーが必要で、YouTube Data API v3を有効にしておく必要があります。

YouTubeのプレイリストのAPIは取得できる動画の上限が50件までなので、50件以上の場合はdo-while文で繰り返し取得しています。

[youtube.json](https://github.com/igara/eiketsu-taisen-tool/blob/main/data/data/json/youtube.json)というのを作成しましたが、`"version": (3, 2, 1)`というのがありますが英傑大戦のアップデートでUIが変わっていたので独自にバージョンを管理しています。
YouTubeのサムネイルの画像もバージョンによって変わっているため、バージョンによって画像の取得方法を変えています。

version: 1 (2022/03/11~2022/12/20)

![version_1](/images/youtube_eiketsu_deck/version_1.jpg)

version: 2 (2022/12/22~2023/10/31)

![version_2](/images/youtube_eiketsu_deck/version_2.jpg)

version: 3 (2023/11/02~現在)

![version_3](/images/youtube_eiketsu_deck/version_3.jpg)

サムネイル画像からmain関数で生成したカードの画像の5.jpgと同じようにカードの武将の箇所のみを切り取り、red_(1~8).jpg、blue_(1~8).jpgという名前で保存しています。

![version_3](/images/youtube_eiketsu_deck/red_blue_card.jpg)

カードの設定されていない箇所も生成します。

### youtubeDeckImport

```bash
# 新規でsqliteのデータベースを作成する場合
node --experimental-strip-types import.ts --youtubeDeckImportExec --youtubeDeckTableCreate
# 作成済みのsqlite3のデータベースにデッキ情報を追加する場合
node --experimental-strip-types import.ts --youtubeDeckImportExec
```

main関数で生成したカードの画像の5.jpgとyoutubeImport関数で生成したred_(1~8).jpg、blue_(1~8).jpgを使用して、ImageHashを使用して画像の比較を行った結果をsqliteに保存しています。

![sqlite](/images/youtube_eiketsu_deck/sqlite.png)

こんな感じのテーブルでYouTubeから撮れる情報と武将のデータを保存しています。

``data/dummy/dummy/${i}.jpg``という記載がありますが、red_(1~8).jpg、blue_(1~8).jpgで武将が設置されていない場合も何かしらの武将として誤検知されてしまったため、武将が設置されていな箇所のダミー画像も保存しています。
ダミー画像も誤検知される度に手動で追加していった結果、[100枚以上のダミー画像](https://github.com/igara/eiketsu-taisen-tool/tree/main/data/data/dummy/dummy)を保存することになりました。

誤検知してるか確認する作業も目視でやっており、検知結果がsqliteに保存されているので、`dist`という列が検知結果の画像のパスが保存しているのでCSVに出力し、`data/youtube/` -> `<img src="data/youtube/`、`.jpg` -> `.jpg">`と置換してCSVファイルをHTMLに保存してブラウザで確認する作業を頻繁にしてました。

## さらに最適化できそうな点

- ループが多いため、処理が遅い
  - プレイリスト全体のデッキ構成するために、プレイリストの動画(1260件) * (武将のデータ(864件) + ダミー(120件)) * プレイヤーのカード(8 * 2件)のループがあるため、処理が遅い
    - 英傑大戦の仕様上、使用できる武将はコスト合計9までなのでコスト9に達した時点でループを抜ければ多少処理が速くなりそう
  - 適切にPromise.allでできそうなとこを増やす
- 誤検知を確認しやすくするために、確認用の画面を作る
  - [英傑大戦ツール](https://igara.github.io/eiketsu-taisen-tool/)に対応検討中です
