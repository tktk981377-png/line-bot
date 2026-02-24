const express = require("express");
const line = require("@line/bot-sdk");

const app = express();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

app.post("/webhook", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  const text = event.message.text;
  const client = new line.Client(config);

  let replyText = "";
  let diagnosis = "";

  // ===== 承認欲求モード =====
  if (
    text.includes("既読無視") ||
    text.includes("返ってこない") ||
    text.includes("返信ない") ||
    text.includes("不安")
  ) {
    diagnosis = "承認欲求モード";
    replyText =
      "診断：" + diagnosis + "\n" +
      "返事に価値を預けるな。\n沈黙が最適解だ。";

  // ===== 執着モード =====
  } else if (
    text.includes("冷められた") ||
    text.includes("追いLINE") ||
    text.includes("ブロック") ||
    text.includes("嫉妬")
  ) {
    diagnosis = "執着モード";
    replyText =
      "診断：" + diagnosis + "\n" +
      "失う恐怖で動くな。\n距離を取れ。";

  // ===== 自信喪失モード =====
  } else if (
    text.includes("自信ない") ||
    text.includes("無理") ||
    text.includes("どうせ") ||
    text.includes("振られた")
  ) {
    diagnosis = "自信喪失モード";
    replyText =
      "診断：" + diagnosis + "\n" +
      "価値は作れる。\n今は積み上げろ。";

  // ===== 依存モード =====
  } else if (
    text.includes("会いたい") ||
    text.includes("いないと無理") ||
    text.includes("ずっと一緒")
  ) {
    diagnosis = "依存モード";
    replyText =
      "診断：" + diagnosis + "\n" +
      "相手中心で動くな。\n軸を自分に戻せ。";

  // ===== 攻めすぎモード =====
  } else if (
    text.includes("毎日LINE") ||
    text.includes("電話したい") ||
    text.includes("今すぐ会いたい")
  ) {
    diagnosis = "攻めすぎモード";
    replyText =
      "診断：" + diagnosis + "\n" +
      "押しすぎは価値を下げる。\n引きを覚えろ。";

  // ===== 受け身モード =====
  } else if (
    text.includes("どうすれば") ||
    text.includes("向こうから") ||
    text.includes("待つべき")
  ) {
    diagnosis = "受け身モード";
    replyText =
      "診断：" + diagnosis + "\n" +
      "待つな。\n状況は作るものだ。";

  // ===== 迷走モード =====
  } else if (
    text.includes("分からない") ||
    text.includes("もう無理") ||
    text.includes("正解")
  ) {
    diagnosis = "迷走モード";
    replyText =
      "診断：" + diagnosis + "\n" +
      "感情が先走っている。\n一度止まれ。";

  } else {
    replyText =
      "診断：判定中\n" +
      "具体的に状況を書け。\n兄貴が読む。";
  }

  return client.replyMessage(event.replyToken, {
    type: "text",
    text: replyText,
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
