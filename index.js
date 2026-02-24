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

  if (text.includes("既読無視")) {
    replyText = "追撃するな。\n既読無視で焦る男はモテない。\n今は沈黙だ。";

  } else if (text.includes("振られた")) {
    replyText = "負けたわけじゃない。\nタイミングが合わなかっただけだ。\n次に備えろ。";

  } else if (text.includes("好き")) {
    replyText = "好きは武器じゃない。\n価値が武器だ。";

  } else if (text.includes("不安")) {
    replyText = "不安になるのは暇だからだ。\n動け。";

  } else if (text.includes("嫉妬")) {
    replyText = "嫉妬は弱さのサインだ。\n比較するな。\n自分を磨け。";

  } else if (text.includes("LINE返ってこない")) {
    replyText = "追うな。\n返信が来ない時点で今は攻めるターンじゃない。\n引け。";

  } else if (text.includes("デート")) {
    replyText = "楽しませようとするな。\nお前が楽しめ。\n余裕が空気を作る。";

  } else if (text.includes("告白")) {
    replyText = "告白は最終確認だ。\n勝てる状況を作ってから言え。";

  } else if (text.includes("脈あり")) {
    replyText = "脈を探すな。\n作れ。\n行動で確かめろ。";

  } else if (text.includes("冷められた")) {
    replyText = "追えば完全に終わる。\n距離を取れ。\n沈黙が唯一の逆転札だ。";

  } else if (text.includes("嫉妬された")) {
    replyText = "それは好意の証拠だ。\nだが調子に乗るな。\n余裕を崩すな。";

  } else if (text.includes("会えない")) {
    replyText = "会えない時間で差がつく。\n自分を上げろ。\nそれが最短ルートだ。";

  } else if (text.includes("自信ない")) {
    replyText = "自信は待っても来ない。\n積み上げた奴にしか宿らない。";

  } else {
    replyText = "感情に飲まれるな。\n状況を具体的に送れ。";
  }

  return client.replyMessage(event.replyToken, {
    type: "text",
    text: replyText,
  });
}
