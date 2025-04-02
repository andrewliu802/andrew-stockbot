export default async function handler(req, res) {
  if (req.method === 'POST') {
    const body = req.body;
    const chatId = body.message?.chat.id;
    const text = body.message?.text;

    if (!chatId || !text) return res.status(200).send('No message');

    try {
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '你是一位專業投資顧問，請用中文分析股票問題，風格精簡但有深度，偏向技術分析與產業邏輯。',
            },
            {
              role: 'user',
              content: text,
            },
          ],
        }),
      });

      const openaiJson = await openaiRes.json();

      // 加入偵錯 log
      console.log('GPT 回傳：', JSON.stringify(openaiJson, null, 2));

      const reply = openaiJson.choices?.[0]?.message?.content || 
                    openaiJson.error?.message || 
                    '抱歉，GPT 回應異常';

      await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: reply,
        }),
      });

      res.status(200).send('OK');
    } catch (err) {
      console.error('錯誤：', err.message);
      await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `⚠️ 系統錯誤：${err.message}`,
        }),
      });
      res.status(500).send('Error');
    }
  } else {
    res.status(405).send('Method not allowed');
  }
}
