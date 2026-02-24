const express = require("express");
const line = require("@line/bot-sdk");
const { Pool } = require("pg");

const app = express();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// PostgreSQL接続
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    const results = await Promise.all(req.body.events.map(handleEvent));
    res.json(results);
  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(500).end();
  }
});

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  const text = event.message.text;
  const client = new line.Client(config);

  let diagnosis = "判定中";

  if (text.includes("既読無視") || text.includes("不安")) {
    diagnosis = "承認欲求モード";
  } else if (text.includes("冷められた") || text.includes("嫉妬")) {
    diagnosis = "執着モード";
  } else if (text.includes("自信ない") || text.includes("振られた")) {
    diagnosis = "自信喪失モード";
  }

  try {
    // ユーザー取得
    const result = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [userId]
    );

    let replyText = "";

    if (result.rows.length === 0) {
      // 新規ユーザー
      await pool.query(
        "INSERT INTO users (user_id, last_diagnosis, count) VALUES ($1, $2, $3)",
        [userId, diagnosis, 1]
      );

      replyText =
        "診断：" + diagnosis + "\n\n今日から兄貴が伴走する。";

    } else {
      const previous = result.rows[0].last_diagnosis;
      const newCount = result.rows[0].count + 1;

      await pool.query(
        "UPDATE users SET last_diagnosis = $1, count = $2 WHERE user_id = $3",
        [diagnosis, newCount, userId]
      );

      replyText =
        "前回：" + previous + "\n" +
        "今回：" + diagnosis + "\n\n" +
        "改善できているか確認しろ。";
    }

    return client.replyMessage(event.replyToken, {
      type: "text",
      text: replyText,
    });

  } catch (dbError) {
    console.error("DB Error:", dbError);

    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "DB接続エラーが発生している。兄貴が調整中だ。",
    });
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
