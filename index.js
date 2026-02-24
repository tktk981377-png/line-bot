const express = require("express");
const line = require("@line/bot-sdk");

const app = express();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const userState = {}; // ← ユーザー記録用

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

  const userId = event.source.userId;
  const text = event.message.text;
  const client = new line.Client(config);

  if (!userState[userId]) {
    userState[userId] = {
      lastDiagnosis: null,
      count: 0,
    };
  }

  let replyText = "";
  let diagnosis = "";

  if (text.includes("既読無視") || text.includes("不安")) {
    diagnosis = "承認欲求モード";
  } else if (text.includes("冷められた") || text.includes("嫉妬")) {
    diagnosis = "執着モード";
  } else if (text.includes("自信ない") || text.includes("振られた")) {
    diagnosis = "自信喪失モード";
  } else {
    diagnosis = "判定中";
  }

  userState[userId].count += 1;

  const previous = userState[userId].lastDiagnosis;
  userState[userId].lastDiagnosis = diagnosis;

  if (previous) {
    replyText =
      "前回の診断：" + previous + "\n" +
      "今回の診断：" + diagnosis + "\n\n" +
      "逃げるな。\n改善できているか確認しろ。";
  } else {
    replyText =
      "診断：" + diagnosis + "\n\n" +
      "今日から兄貴が伴走する。\n報告を続けろ。";
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
