---
title: "ブラウザから起動したカメラでTCGのカードを識別する方法"
emoji: "🎴"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["nodejs", "tensorflowjs", "canvas", "react", "tcg"]
published: true
---

# この記事について

最近、TCG(トレーディングカードゲーム)も遊戯王は[マスターデュエル](https://www.konami.com/yugioh/masterduel/jp/ja/)、ポケモンは[ポケポケ](https://www.pokemontcgpocket.com/ja/)とデジタル化されたカードゲームのものが増えてきましたね！

最近自分がハマってやっているカードゲームは[英傑大戦](https://www.eiketsu-taisen.com/)というゲームセンターのアーケード機で遊ぶカードゲームで、個人ツールとして[英傑大戦ツール](https://igara.github.io/eiketsu-taisen-tool/)というのを作っているのですが、デッキ構成するときにカメラから作成できるものもあったら便利そうと思い、実践してみたという記事になります。(このゲーム、[土方歳三](https://igara.github.io/eiketsu-taisen-tool/?searchWord=%E5%9C%9F%E6%96%B9%E6%AD%B3%E4%B8%89)がイラスト違いで複数あったり、姓が[源](https://igara.github.io/eiketsu-taisen-tool/?searchWord=%E3%81%BF%E3%81%AA%E3%82%82%E3%81%A8)、[平](https://igara.github.io/eiketsu-taisen-tool/?searchWord=%E3%81%9F%E3%81%84%E3%82%89)、[北条](https://igara.github.io/eiketsu-taisen-tool/?searchWord=%E5%8C%97%E6%9D%A1)、[島津](https://igara.github.io/eiketsu-taisen-tool/?searchWord=%E5%B3%B6%E6%B4%A5)が多くて画像で検索できるもの作った方が助かると思ったのもある)

# できたもの

[英傑カメラ](https://igara.github.io/eiketsu-taisen-tool/camera)

![自分のAndroidでの動作スクショ](/images/tcg_recognition_browser_camera/self_android.jpg)

上記は自分のPixel 8aで撮った最新の英傑カメラUIでのスクショになります。
黒が多いイラストの識別や、ERカードのようなホログラム印刷やスリーブやローダなどのカードのカバーで光沢のあるカードあっても識別できるようになっています。

![友人のiPhoneでの動作スクショ](/images/tcg_recognition_browser_camera/freand_iphone.jpg)

上記は友人のiPhoneのスクショで、古いUIの英傑カメラのバージョンになりますが、
暗い場合に試してもカード検出することに成功しました。

# 解説

ここからは画像認識するための実装を記載しますが、使用した学習モデル作成とWebフロントエンドの実装を分けて解説していきます。

## 学習モデル作成

学習モデル作成に必要なスクリプトとして[import_cardtfmodel.ts](https://github.com/igara/eiketsu-taisen-tool/blob/main/data/import_cardtfmodel.ts)を作成しました。

### 学習モデルに必要な画像データ作成

```bash
$ node --experimental-strip-types import_cardtfmodel.ts --cardImageTFModelForImage
```

というコマンドを実行を元に生成しています。

:::details グラデーションなどの画像加工処理
```typescript
for (const general of GeneralJSON) {
  const dirName = `data/generals/${general.color.name}/${general.no}_${general.name}`;
  const input2Path = `${dirName}/2.jpg`;

  let i = 6;

  await glossGradientHorizonTop({ dirName, inputPath: input2Path, i: i++ });
  ...省略
  await createDarkenedImageGlossGradientRightBottom({
    dirName,
    inputPath: input2Path,
    i: i++,
  });
}
```
:::

というコードからは元のカード画像に対して、いろんな角度で光があったかのようなグラデーションの付いた画像を[node-canvas](https://www.npmjs.com/package/canvas)で生成しています。

グラデーション画像としては以下のような、

![グラデーション画像](/images/tcg_recognition_browser_camera/gradetion_image.jpg)

縦、横、斜めにグラデーションを入れたような12枚のパターンを生成しています。
他には友人のiPhoneのスクショのように暗いカメラ環境考慮として、元のカードに黒でマスク化したものにグラデーションを入れた画像を生成しました。

[GitHubに保存されている画像](https://github.com/igara/eiketsu-taisen-tool/tree/main/data/data/generals/%E7%8E%84/EX002_%E7%9B%B8%E6%A5%BD%E7%B7%8F%E4%B8%89)の6~80.jpgは学習モデルの考慮によって生成された画像になります。

前回の[ImageHashを用いた画像識別の記事](https://zenn.dev/igara/articles/youtube_eiketsu_deck)とは違い、カメラの環境による入力の画像が異なるため、検出するためのカードの画像も多めになりました。

### 学習モデル作成

```bash
$ node --experimental-strip-types import_cardtfmodel.ts --cardImageTFModel
```

こちらの学習モデルは[@tensorflow/tfjs-node](https://www.npmjs.com/package/@tensorflow/tfjs-node)を使った学習モデルになります。

実装方法とか最初わかりませんでしたがChatGPTで聞きながら実装し、理解していきました。
 
:::details 画像データのテンソル化とラベル付け
```typescript
async function loadImageToTensor(imagePath: string) {
  const image = (await Canvas.loadImage(
    imagePath,
  )) as unknown as HTMLImageElement;
  const canvas = Canvas.createCanvas(
    image.width,
    image.height,
  ) as unknown as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(image, 0, 0);
  const tensor = tf.browser
    .fromPixels(canvas)
    .resizeNearestNeighbor([cardSize.width, cardSize.height])
    .toFloat()
    .div(tf.scalar(255.0));
  return tensor;
}

async function loadImagesFromDirectories() {
  const generalsJSON: General[] = JSON.parse(
    fs.readFileSync("data/json/generals.json", "utf8"),
  );

  const classNames = [];
  const images: tf.Tensor<tf.Rank>[] = [];
  const labels = [];

  for (const general of generalsJSON) {
    const className = `${general.color.name}_${general.no}_${general.name}`;
    classNames.push(className);

    // モデルに使用する画像の読み込みループ
    for (const i of Array(81).keys()) {
      // モデルに使用しない画像をスキップ
      if (i === 0) continue;
      if (i === 1) continue;
      if (i === 3) continue;

      const filePath = `data/generals/${general.color.name}/${general.no}_${general.name}/${i}.jpg`;
      const tensor = await loadImageToTensor(filePath);
      if (!tensor) continue;
      images.push(tensor);
      labels.push(classNames.indexOf(className));
    }
  }

  const xs = tf.stack(images);
  const ys = tf.tensor(labels, [labels.length, 1]);
  return { xs, ys, classNames };
}
```
:::

正直テンソル化の箇所はChatGPTのコピペですが必要な画像だけ読み込みしようとするための処理だけ追加しています。

:::details テンソル化後のモデル構築とトレーニング、保存処理
```typescript
const { xs, ys, classNames } = await loadImagesFromDirectories();

// モデルの構築
const model = tf.sequential();
model.add(
  tf.layers.conv2d({
    inputShape: [cardSize.width, cardSize.height, 3],
    filters: 8,
    kernelSize: 3,
    activation: "relu",
  }),
);
model.add(tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
model.add(
  tf.layers.conv2d({ filters: 16, kernelSize: 3, activation: "relu" }),
);
model.add(tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
model.add(tf.layers.flatten());
model.add(
  tf.layers.dense({ units: classNames.length, activation: "softmax" }),
);

// コンパイル
model.compile({
  optimizer: "adam",
  loss: "sparseCategoricalCrossentropy",
  metrics: ["accuracy"],
});

// トレーニング
await model.fit(xs, ys, { epochs: 10 });

// モデルを保存
await model.save("file://./general-image"); // ローカルファイルに保存
console.log("モデルのトレーニングが完了しました");
```
:::

:::message alert
ここで注意すべきなのがテンソル化する際にも、リサイズの処理でも`cardSize.width, cardSize.height`という記載がありましたがこのサイズがモデルの大きさにも影響するため、適切なサイズにする必要があります。

具体的には、最初（現在またカード増えたり、モデル作成考慮でモデル画像が少なかった時代）は

- width
  - 140(現在64)
- height
  - 215(現在102)

なカードのオリジナルの大きさを指定し、当初カード枚数868枚 * モデル画像30枚でモデルを作成したらモデルのサイズが`1GB`近くになり、Webフロントエンドでも読み込みの時間がかかるのと読み込みが終わってからも画像の比較のサイズが大きいため、モバイルでは解析に時間がかかるという問題がありましたので適切なリサイズのサイズ指定が必要です。

現在は20MBまでに落ち着き、解析もだいぶ速くなりました。
:::

### 学習モデルの分割
作成したモデルをWebフロントエンドでも使いやすく、Git LFSを使わずにGit管理するために分割しています。

分割するために[tensorflowjs_converter](https://github.com/tensorflow/tfjs/tree/master/tfjs-converter)をインストールします。

Pythonは3.6.8を使っており、
numpyに関しては

[AttributeError: module 'numpy' has no attribute 'XXX' エラーの解決ログ](https://qiita.com/yusuke_s_yusuke/items/bf7ce2deb6153ab0123b)にある問題があるため決まったバージョンによるインストールをしています。

```bash
$ pip install numpy==1.26.4
$ pip install tensorflowjs==3.18.0
```

必要なものをインストールした後は下記を実行してモデルを分割します。

```bash
$ tensorflowjs_converter --input_format=tfjs_layers_model --output_format=tfjs_layers_model --weight_shard_size_bytes=10485760 ./general-image/model.json ../app/public/tensorflow/general-image
```

`weight_shard_size_bytes`を変更することで好きなサイズに分割できます。


## Webフロントエンド実装

### 学習モデルの読み込みをContextにする

::: details Contextの作成
```typescript
"use client";

import * as tf from "@tensorflow/tfjs";
import React from "react";
import { createContext } from "react";

export interface GeneralCardImageTFModelProviderProps {
  children: React.ReactNode;
}

const GeneralCardImageTFModelContext = createContext<{
  generalCardImageTFModel: tf.LayersModel | null;
}>({
  generalCardImageTFModel: null,
});

function GeneralCardImageTFModelProvider({
  children,
}: GeneralCardImageTFModelProviderProps) {
  const [generalCardImageTFModel, setGeneralCardImageTFModel] =
    React.useState<tf.LayersModel | null>(null);

  React.useEffect(() => {
    const loadModel = async () => {
      const loadedModel = await tf.loadLayersModel(
        "/eiketsu-taisen-tool/tensorflow/general-image/model.json",
      );
      setGeneralCardImageTFModel(loadedModel);
    };
    loadModel();
  }, []);

  return (
    <GeneralCardImageTFModelContext.Provider
      value={{
        generalCardImageTFModel,
      }}
    >
      {children}
    </GeneralCardImageTFModelContext.Provider>
  );
}

export { GeneralCardImageTFModelContext, GeneralCardImageTFModelProvider };

```
:::

```typescript
const { generalCardImageTFModel } = React.useContext(
  GeneralCardImageTFModelContext,
);
```

から事前に読み込み済みの学習モデルを使いやすくします。

### ページのロジック実装

[index.tsx](https://github.com/igara/eiketsu-taisen-tool/blob/main/app/src/components/pages/camera/CameraAnalyze/index.tsx)、[logic.tsx](https://github.com/igara/eiketsu-taisen-tool/blob/main/app/src/components/pages/camera/CameraAnalyze/logic.tsx)の解説になります。

index.tsxは主にUIの実装、logic.tsxは雑に処理を記載しています。

#### 使用できるカメラ情報の取得

:::details カメラ情報取得
```typescript
const { generalCardImageTFModel } = React.useContext(
  GeneralCardImageTFModelContext,
);
const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);

React.useEffect(() => {
  if (!generalCardImageTFModel) return;

  const getDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      const enumerateDevices =
        await window.navigator.mediaDevices.enumerateDevices();
      setDevices(
        enumerateDevices.filter(
          (device) => device.kind === "videoinput" && device.label,
        ),
      );
    } catch (_) {}
  };
  getDevices();
}, [generalCardImageTFModel]);
```
:::

使用できるカメラの情報は全てセレクトボックスから選択できるように取得しています。
最初はOBS Virtual Cameraでテストしていたという開発ネタもありました。(色々ノイズのない画像でも正しく検知できるか確認したいときに便利)

:::details カメラ選択処理
```typescript
const refVideo = React.useRef<HTMLVideoElement>(null);
const [device, setDivice] = React.useState<MediaDeviceInfo | null>(null);
const [isVideo, setIsVideo] = React.useState(false);

React.useEffect(() => {
  if (!device) return;

  if (!refVideo) return;
  if (!refVideo.current) return;

  const video = refVideo.current;

  const check = async () => {
    try {
      if (!window.navigator.mediaDevices.getUserMedia) return;

      const stream = await window.navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          deviceId: device.deviceId,
        },
      });
      video.srcObject = stream;

      video.addEventListener("loadedmetadata", () => {
        setIsVideo(true);
      });
    } catch (e) {
      console.error(e);
    }
  };
  check();
}, [device]);
```
:::

`video.addEventListener("loadedmetadata")`して初めてカメラの映像がvideoに読み込まれるため別で`isVideo`を状態管理しています。

#### 選択したカメラの映像をcanvas化する

後にカメラの映像に対して選択範囲指定の枠を描画するためにcanvas化しています。

そのため、カメラの映像は`video`タグで映していますが、

```typescript
<video muted autoPlay playsInline ref={refVideo} className="h-0" />
```

と見えないようにしています。

:::details canvas化と選択範囲の描画
```typescript
const refVideoCanvas = React.useRef<HTMLCanvasElement>(null);
const [selectedVideoCanvasPosition, setSelectedVideoCanvasPosition] =
  React.useState({
    from: {
      x: 0,
      y: 0,
    },
    to: {
      x: 0,
      y: 0,
    },
  });

const detectAndResizeCard = () => {
  if (!generalCardImageTFModel) return;
  if (!isVideo) return;

  if (!refVideo.current) return;
  const video = refVideo.current;

  if (!refVideoCanvas.current) return;
  const videoCanvas = refVideoCanvas.current;
  const videoCanvasContext = videoCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (!videoCanvasContext) return;

  try {
    const frameWidth = video.videoWidth;
    const frameHeight = video.videoHeight;

    videoCanvas.width = frameWidth;
    videoCanvas.height = frameHeight;
    videoCanvasContext.drawImage(video, 0, 0, frameWidth, frameHeight);

    // 矩形選択に基づいた線を描画
    const { from, to } = selectedVideoCanvasPosition;
    videoCanvasContext.beginPath();
    videoCanvasContext.rect(from.x, from.y, to.x - from.x, to.y - from.y);
    videoCanvasContext.strokeStyle = "red"; // 線の色を設定
    videoCanvasContext.lineWidth = 2; // 線の太さを設定
    videoCanvasContext.stroke();
  } catch (e) {
    console.error(e);
  }
};

React.useEffect(() => {
  if (!isVideo) return;

  const intervalId = setInterval(detectAndResizeCard, 1000 / 120);
    return () => clearInterval(intervalId);
}, [isVideo, selectedVideoCanvasPosition]);
```
:::

`setInterval(detectAndResizeCard, 1000 / 120);`しているのは体感120fpsで処理してみようかなという意図です。
カメラの映像と共にcanvasの表示が変わるため、選択範囲の描画の処理も入れています。

#### 範囲選択の座標取得処理

![選択範囲](/images/tcg_recognition_browser_camera/select.gif)

カメラを映しているcanvas上をドラッグするとみょーんと選択範囲が指定されるやつです。

:::details 範囲選択の座標取得処理
```typescript
// キャンバス内の位置を実際の解像度に合わせるための関数
const adjustForCanvasScale = (clientX: number, clientY: number) => {
  if (!refVideoCanvas.current)
    return {
      x: 0,
      y: 0,
    };
  const videoCanvas = refVideoCanvas.current;

  const rect = videoCanvas.getBoundingClientRect();
  const scaleX = videoCanvas.width / rect.width;
  const scaleY = videoCanvas.height / rect.height;

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
};

/**
 * モバイルスクロール禁止処理
 */
const scrollNo = React.useCallback((e: TouchEvent) => {
  if (e.cancelable) {
    e.preventDefault();
  }
}, []);

const onTouchStartVideoCanvas: React.TouchEventHandler<HTMLCanvasElement> = (
  e,
) => {
  const touch = e.touches[0];
  const position = adjustForCanvasScale(touch.clientX, touch.clientY);
  document.addEventListener("touchmove", scrollNo, { passive: false });
  document.body.style.overflow = "hidden";

  setSelectedVideoCanvasPosition({
    from: position,
    to: position,
  });

  setIsSelectingVideoCanvasPosition(true);
};

const onMouseDownVideoCanvas: React.MouseEventHandler<HTMLCanvasElement> = (
  e,
) => {
  const position = adjustForCanvasScale(e.clientX, e.clientY);
  document.addEventListener("touchmove", scrollNo, { passive: false });
  document.body.style.overflow = "hidden";

  setSelectedVideoCanvasPosition({
    from: position,
    to: position,
  });

  setIsSelectingVideoCanvasPosition(true);
};

const onTouchMoveVideoCanvas: React.TouchEventHandler<HTMLCanvasElement> = (
  e,
) => {
  if (!isSelectingVideoCanvasPosition) return;

  const touch = e.touches[0];
  const position = adjustForCanvasScale(touch.clientX, touch.clientY);

  setSelectedVideoCanvasPosition((prevSelection) => ({
    ...prevSelection,
    to: position,
  }));
};

const onMouseMoveVideoCanvas: React.MouseEventHandler<HTMLCanvasElement> = (
  e,
) => {
  if (!isSelectingVideoCanvasPosition) return;

  const position = adjustForCanvasScale(e.clientX, e.clientY);

  setSelectedVideoCanvasPosition((prevSelection) => ({
    ...prevSelection,
    to: position,
  }));
};

const onTouchEndVideoCanvas: React.TouchEventHandler<
  HTMLCanvasElement
> = () => {
  document.body.style.overflow = "auto";
  document.removeEventListener("touchmove", scrollNo);
  setIsSelectingVideoCanvasPosition(false);
};

const onMouseUpVideoCanvas: React.MouseEventHandler<
  HTMLCanvasElement
> = () => {
  document.body.style.overflow = "auto";
  document.removeEventListener("touchmove", scrollNo);
  setIsSelectingVideoCanvasPosition(false);
};
```
:::

`onMouseDown`と`onTouchStart`と似たような処理がありますがPCのときはonMouse、スマホのときはonTouchでイベントが実行されるので2つの処理があります。
後はドラッグ中は妙なスクロールが発生しないようにする処理を記載しています。

#### 範囲選択から別のcanvasに描画と学習モデルによる識別処理

ここからがようやくWebフロントエンドで作成した学習モデルを使って画像認識する処理になります。

:::details 範囲選択から別のcanvasに描画と学習モデルによる識別処理
```typescript
const refSelectedCardCanvas = React.useRef<HTMLCanvasElement>(null);

const onClickSelectedCardButton: React.MouseEventHandler<
  HTMLButtonElement
> = async () => {
  if (!generalCardImageTFModel) return;

  if (!refSelectedCardCanvas.current) return;
  const selectedCardCanvas = refSelectedCardCanvas.current;
  const selectedCardCanvasContext = selectedCardCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (!selectedCardCanvasContext) return;

  if (!refVideoCanvas.current) return;
  const videoCanvas = refVideoCanvas.current;
  const videoCanvasContext = videoCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (!videoCanvasContext) return;

  // 矩形選択の箇所を取得
  const { from, to } = selectedVideoCanvasPosition;
  const width = from.x < to.x ? to.x - from.x : from.x - to.x;
  const height = from.y < to.y ? to.y - from.y : from.y - to.y;
  const x = from.x < to.x ? from.x : to.x;
  const y = from.y < to.y ? from.y : to.y;
  selectedCardCanvas.width = width;
  selectedCardCanvas.height = height;
  selectedCardCanvasContext.drawImage(
    videoCanvas,
    x,
    y,
    width,
    height,
    0,
    0,
    width,
    height,
  );

  if (width === 0 || height === 0) return;

  const imageData = selectedCardCanvasContext.getImageData(
    0,
    0,
    selectedCardCanvas.width,
    selectedCardCanvas.height,
  );

  setSelectedCard({
    loading: true,
    general: undefined,
  });

  await tf.setBackend("webgl");
  await tf.ready();

  tf.tidy(() => {
    const tensor = tf.browser
      .fromPixels(imageData)
      .resizeNearestNeighbor([cardSize.width, cardSize.height]) // モデルに合わせてリサイズ
      .toFloat()
      .div(tf.scalar(255.0))
      .expandDims(0);

    const prediction = generalCardImageTFModel.predict(tensor);
    // @ts-ignore
    const maxIndex = (prediction.argMax(-1) as tf.Tensor).dataSync()[0];

    const general = GeneralsJSON[maxIndex];

    setSelectedCard({
      loading: false,
      general,
    });
  });
};
```
:::

`await tf.setBackend("webgl");`と`await tf.ready();`はWebGLを使うための処理で、`tf.tidy`はメモリリークを防ぐための処理です。

`resizeNearestNeighbor([cardSize.width, cardSize.height])`は[学習モデル作成](#学習モデル作成-1)で指定したサイズにリサイズしています。

個人的にモヤっている実装として

```typescript
const prediction = generalCardImageTFModel.predict(tensor);
// @ts-ignore
const maxIndex = (prediction.argMax(-1) as tf.Tensor).dataSync()[0];

const general = GeneralsJSON[maxIndex];
```

の部分の検出結果の取得なのですが、indexじゃなくてモデル作成時に

```typescript
const { xs, ys, classNames } = await loadImagesFromDirectories();
```

とカードの名前をclassNamesに保存していたのでモデルの中にも組み入れて名前でできないかと考えています。
後は、TypeScriptで補完されている様で型がない変数があったりもするので、だいぶ疑心暗鬼なところがありますが、とりあえず動いているのでよしとしています。

# 感想

- 難しいと思った実装もChatGPTでできました。
- 初めてブラウザで学習モデルを使った画像認識をしたので他にも活用したいなと思いました。
- 学習モデルのモデリングの考慮が大変でした。
- ブラウザ上でもNode.js上でもcanvasが大活躍でした。
