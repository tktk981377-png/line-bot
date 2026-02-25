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

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  const text = event.message.text;
  const client = new line.Client(config);

  // 🔥 覚悟確認分岐
  if (text === "できる") {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "覚悟を確認した。\n明日、結果だけ報告しろ。"
    });
  }

  let diagnosis = "判定中";
  let columnName = "";
  let actionPlan = "";

  if (text.includes("既読無視") || text.includes("不安")) {
    diagnosis = "承認欲求モード";
    columnName = "approval_count";
    actionPlan =
      "今日やること：\n" +
      "① 返信を最低3時間待て\n" +
      "② SNSを見ない\n" +
      "③ 30分自己投資（筋トレ・作業）";
  } else if (text.includes("冷められた") || text.includes("嫉妬")) {
    diagnosis = "執着モード";
    columnName = "attachment_count";
    actionPlan =
      "今日やること：\n" +
      "① 相手のSNSを見ない\n" +
      "② 24時間連絡するな\n" +
      "③ 自分の予定を1つ入れろ";
  } else if (text.includes("自信ない") || text.includes("振られた")) {
    diagnosis = "自信喪失モード";
    columnName = "confidence_count";
    actionPlan =
      "今日やること：\n" +
      "① 姿勢を直せ\n" +
      "② 小さな成功を1つ作れ\n" +
      "③ LINEを追うな";
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [userId]
    );

    const today = todayStr();
    const yesterday = yesterdayStr();
    let replyText = "";

    if (result.rows.length === 0) {
      await pool.query(
        "INSERT INTO users (user_id, last_diagnosis, approval_count, attachment_count, confidence_count, streak_count, last_report_date) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [
          userId,
          diagnosis,
          diagnosis === "承認欲求モード" ? 1 : 0,
          diagnosis === "執着モード" ? 1 : 0,
          diagnosis === "自信喪失モード" ? 1 : 0,
          1,
          today
        ]
      );

      replyText =
        "診断：" + diagnosis + "\n" +
        "継続：1日目\n\n" +
        actionPlan + "\n\n" +
        "今日の行動、実行できるか？\n「できる」と送れ。";

    } else {
      const user = result.rows[0];

      // 継続ロジック
      let newStreak = user.streak_count || 0;
      let streakMessage = "";

      if (user.last_report_date === today) {
        streakMessage = "継続：" + newStreak + "日目";
      } else if (user.last_report_date === yesterday) {
        newStreak += 1;
        streakMessage = "継続：" + newStreak + "日目（習慣化ラインだ）";
      } else {
        newStreak = 1;
        streakMessage = "連続は途切れたが、今日からまた積み上げろ。";
      }

      let newEmotionCount = 0;

      if (columnName) {
        newEmotionCount = (user[columnName] || 0) + 1;

        await pool.query(
          `UPDATE users 
           SET last_diagnosis=$1,
               ${columnName}=$2,
               streak_count=$3,
               last_report_date=$4
           WHERE user_id=$5`,
          [diagnosis, newEmotionCount, newStreak, today, userId]
        );
      }

      let analysis = "";

      if (user.last_diagnosis === diagnosis) {
        analysis = "同じ感情パターンを継続している。根本原因を直視しろ。";
      } else {
        analysis =
          user.last_diagnosis + " から " + diagnosis +
          " に移行している。\n改善の兆しだ。";
      }

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
        "このモード通算：" + newEmotionCount + "回\n" +
        streakMessage + "\n\n" +
        analysis + "\n\n" +
        actionPlan + "\n\n" +
        tone + "\n\n" +
        "今日の行動、実行できるか？\n「できる」と送れ。";
    }

    return client.replyMessage(event.replyToken, {
      type: "text",
      text: replyText
    });

  } catch (err) {
    console.error("DB Error:", err);
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "DB接続エラーが発生している。兄貴が調整中だ。"
    });
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
