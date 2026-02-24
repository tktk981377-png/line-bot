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
      "今お前は“返事＝自分の価値”と勘違いしている。\n" +
      "焦るな。沈黙しろ。";

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
      "失う恐怖で動いている。\n" +
      "追うな。距離を取れ。";

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
      "自分を下に見ている限り勝てない。\n" +
      "価値を積み上げろ。";

  } else {
    replyText =
      "診断：判定中\n" +
      "状況を具体的に送れ。\n" +
      "兄貴が見極める。";
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
