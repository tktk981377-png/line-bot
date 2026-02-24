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
  } else {
    replyText = "感情に飲まれるな。\n状況を具体的に送れ。";
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
