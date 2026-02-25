const express = require("express");
const line = require("@line/bot-sdk");
const { Pool } = require("pg");

const app = express();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
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
  let columnName = "";

  // ===== 診断判定 =====
  if (text.includes("既読無視") || text.includes("不安")) {
    diagnosis = "承認欲求モード";
    columnName = "approval_count";
  } else if (text.includes("冷められた") || text.includes("嫉妬")) {
    diagnosis = "執着モード";
    columnName = "attachment_count";
  } else if (text.includes("自信ない") || text.includes("振られた")) {
    diagnosis = "自信喪失モード";
    columnName = "confidence_count";
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [userId]
    );

    let replyText = "";

    // ===== 新規ユーザー =====
    if (result.rows.length === 0) {
      await pool.query(
        "INSERT INTO users (user_id, last_diagnosis, approval_count, attachment_count, confidence_count) VALUES ($1, $2, $3, $4, $5)",
        [
          userId,
          diagnosis,
          diagnosis === "承認欲求モード" ? 1 : 0,
          diagnosis === "執着モード" ? 1 : 0,
          diagnosis === "自信喪失モード" ? 1 : 0,
        ]
      );

      replyText =
        "診断：" + diagnosis + "\n\n" +
        "今日から兄貴が伴走する。\n" +
        "明日も報告しろ。";

    } else {
      const user = result.rows[0];
      let newEmotionCount = 0;

      if (columnName) {
        newEmotionCount = (user[columnName] || 0) + 1;

        await pool.query(
          `UPDATE users 
           SET last_diagnosis = $1,
               ${columnName} = $2
           WHERE user_id = $3`,
          [diagnosis, newEmotionCount, userId]
        );
      }

      // ===== 推移分析 =====
      let analysis = "";

      if (user.last_diagnosis === diagnosis) {
        analysis = "同じ感情パターンを継続している。根本原因を直視しろ。";
      } else {
        analysis =
          user.last_diagnosis + " から " + diagnosis +
          " に移行している。\n感情の形は違うが、源は同じ可能性が高い。";
      }

      // ===== トーン変化 =====
      let tone = "";

      if (newEmotionCount <= 2) {
        tone = "まだ修正可能だ。落ち着いてやれ。";
      } else if (newEmotionCount <= 5) {
        tone = "この感情パターンを繰り返している。行動を変えろ。";
      } else {
        tone = "何回同じ感情に支配される？本気で変わる気あるか？";
      }

      replyText =
        "前回：" + user.last_diagnosis + "\n" +
        "今回：" + diagnosis + "\n" +
        "このモード通算：" + newEmotionCount + "回\n\n" +
        analysis + "\n\n" +
        tone + "\n\n" +
        "明日も報告しろ。";
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
