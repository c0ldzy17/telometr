import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("photo") as File;
    const age = formData.get("age") as string;
    const height = formData.get("height") as string;
    const weight = formData.get("weight") as string;

    if (!file || !age || !height || !weight) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;

    // Логируем в Telegram
    if (BOT_TOKEN && CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: `📊 Новый анализ!\nВозраст: ${age}, Рост: ${height}, Вес: ${weight}`,
        }),
      });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://telometr.vercel.app",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Ты — эксперт по оценке мужского телосложения.
Тебе дают фото мужчины и его параметры.
Оцени по шкале 0-100 каждый параметр.
Будь строгим но справедливым. Не завышай. Средний мужчина без тренировок = 40-50.
Активно тренирующийся = 60-75. Соревновательный уровень = 85+.

ОБЯЗАТЕЛЬНО верни ТОЛЬКО валидный JSON без markdown без бэктиков:
{
  "overall": число 0-100,
  "percentile": число 1-99,
  "metrics": {
    "shoulders_waist": число 0-100,
    "body_fat": число 0-100,
    "v_taper": число 0-100,
    "symmetry": число 0-100,
    "legs": число 0-100
  },
  "strong": "текст на русском, 1 предложение что является сильной стороной",
  "weak": "текст на русском, 1 предложение что нужно улучшить"
}`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Мужчина, ${age} лет, рост ${height} см, вес ${weight} кг. Оцени телосложение:`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      console.error("OpenRouter error:", JSON.stringify(data));
      return NextResponse.json({ error: "AI error" }, { status: 500 });
    }

    const content = data.choices[0].message.content;

    // Убираем возможные markdown бэктики
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    try {
      const result = JSON.parse(cleaned);
      return NextResponse.json(result);
    } catch {
      console.error("Parse error, raw:", content);
      return NextResponse.json({ error: "Parse error" }, { status: 500 });
    }
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
