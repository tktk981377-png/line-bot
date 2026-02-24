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

  // ===== 承認欲求モード =====
  if (
    text.includes("既読無視") ||
    text.includes("返ってこない") ||
    text.includes("返信ない") ||
    text.includes("不安")
  ) {
    replyText =
      "診断：承認欲求モード\n\n" +
      "原因：\n返事＝自分の価値になっている。\n\n" +
      "やるべき行動：\n24時間追撃禁止。\n自分の時間を埋めろ。\n\n" +
      "今日の指示：\nSNSを見ない。連絡しない。";

  // ===== 執着モード =====
  } else if (
    text.includes("冷められた") ||
    text.includes("追いLINE") ||
    text.includes("ブロック") ||
    text.includes("嫉妬")
  ) {
    replyText =
      "診断：執着モード\n\n" +
      "原因：\n失う恐怖で動いている。\n\n" +
      "やるべき行動：\n距離を取る。\n連絡頻度を下げる。\n\n" +
      "今日の指示：\n何も送るな。";

  // ===== 自信喪失モード =====
  } else if (
    text.includes("自信ない") ||
    text.includes("無理") ||
    text.includes("どうせ") ||
    text.includes("振られた")
  ) {
    replyText =
      "診断：自信喪失モード\n\n" +
      "原因：\n自分を下に見ている。\n\n" +
      "やるべき行動：\n小さく勝て。\n運動・勉強・外見改善。\n\n" +
      "今日の指示：\n何か一つ積み上げろ。";

  // ===== 依存モード =====
  } else if (
    text.includes("会いたい") ||
    text.includes("いないと無理") ||
    text.includes("ずっと一緒")
  ) {
    replyText =
      "診断：依存モード\n\n" +
      "原因：\n相手中心で思考している。\n\n" +
      "やるべき行動：\n自分の予定を優先。\n趣味を増やせ。\n\n" +
      "今日の指示：\n1人の時間を作れ。";

  // ===== 攻めすぎモード =====
  } else if (
    text.includes("毎日LINE") ||
    text.includes("電話したい") ||
    text.includes("今すぐ会いたい")
  ) {
    replyText =
      "診断：攻めすぎモード\n\n" +
      "原因：\n押せば近づくと思っている。\n\n" +
      "やるべき行動：\n連絡頻度を半分に。\n余白を作れ。\n\n" +
      "今日の指示：\n先に連絡するな。";

  // ===== 受け身モード =====
  } else if (
    text.includes("どうすれば") ||
    text.includes("向こうから") ||
    text.includes("待つべき")
  ) {
    replyText =
      "診断：受け身モード\n\n" +
      "原因：\n他人任せ思考。\n\n" +
      "やるべき行動：\n提案しろ。\n主導権を取れ。\n\n" +
      "今日の指示：\n具体的な一文を送れ。";

  // ===== 迷走モード =====
  } else if (
    text.includes("分からない") ||
    text.includes("もう無理") ||
    text.includes("正解")
  ) {
    replyText =
      "診断：迷走モード\n\n" +
      "原因：\n感情で判断している。\n\n" +
      "やるべき行動：\n一度距離を取る。\n紙に書き出せ。\n\n" +
      "今日の指示：\n今日は何もしない。";

  } else {
    replyText =
      "診断：判定中\n\n状況を具体的に書け。\n兄貴が分析する。";
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
