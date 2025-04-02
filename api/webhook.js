export default async function handler(req, res) {
  if (req.method === 'POST') {
    const body = req.body;

    const chatId = body.message?.chat.id;
    const text = body.message?.text;

    if (!chatId || !text) {
      return res.status(200).send('No message');
    }

    // 回傳 GPT 文字
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
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
    const reply = openaiJson.choices?.[0]?.message?.content || '抱歉，我暫時無法回應';

    // 傳送回 Telegram
    await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: reply,
      }),
    });

    res.status(200).send('OK');
  } else {
    res.status(405).send('Method not allowed');
  }
}
