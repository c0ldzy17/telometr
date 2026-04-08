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

    // Логируем в Telegram факт загрузки
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
        temperature: 0,
        seed: 42,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Ты — строгий эксперт по оценке мужского телосложения.
Тебе дают фото мужчины и его параметры (возраст, рост, вес).
Оцени 5 базовых метрик по шкале от 0 до 100.

ЖЕСТКИЕ ГАЙДЛАЙНЫ ПО ОЦЕНКАМ:
1. shoulders_waist (Плечи/Талия): 90-100 = экстремально широкие плечи и узкая талия, 70-89 = атлетичные пропорции, 40-69 = обычный человек (прямоугольник), 0-39 = талия шире плеч.
2. body_fat (Процент жира): 90-100 = ниже 10% (секущийся пресс, вены), 70-89 = 11-15% (пресс четко виден), 40-69 = 16-22% (норма, пресса нет), 0-39 = 25%+ (лишний вес, живот). ВНИМАНИЕ: выдавай балл крутости, а не сам процент жира!
3. v_taper (Спина/Широчайшие): 90-100 = огромная спина (кобра), 40-69 = обычная, 0-39 = узкая спина.
4. symmetry (Симметрия): 90-100 = идеальный баланс лево/право и верх/низ, 40-69 = есть асимметрии.
5. legs (Масса ног): 90-100 = мощные квадрицепсы, 40-69 = обычные ноги, 0-39 = слишком худые (скипал день ног).

ПРАВИЛА ДЛЯ ТЕКСТА (СТРОГО):
- "strong": Найди метрику с САМЫМ ВЫСОКИМ баллом. Напиши 1 предложение с похвалой именно этого аспекта. Никаких противоречий.
- "weak": Найди метрику с САМЫМ НИЗКИМ баллом. Напиши 1 предложение с советом, как именно это улучшить. Не хвали в этом поле!

ОБЯЗАТЕЛЬНО верни ТОЛЬКО валидный JSON без markdown:
{
  "metrics": {
    "shoulders_waist": число 0-100,
    "body_fat": число 0-100,
    "v_taper": число 0-100,
    "symmetry": число 0-100,
    "legs": число 0-100
  },
  "strong": "текст",
  "weak": "текст"
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
      const parsed = JSON.parse(cleaned);
      
      // 1. Убиваем джиттер нейросети (квантуем до 5)
      const roundTo5 = (val: number) => Math.round(Number(val) / 5) * 5;

      // 2. Генерируем "органический" детерминированный шум (от -2 до +2)
      const getNoise = (base64Str: string, salt: number) => {
        return ((base64Str.length + salt) % 5) - 2; 
      };

      // Защита от выхода за границы 0-100
      const clamp = (val: number) => Math.max(0, Math.min(100, val));

      // 3. Формируем красивые, "живые", но 100% стабильные метрики
      const m = {
        shoulders_waist: clamp(roundTo5(parsed.metrics.shoulders_waist) + getNoise(base64, 1)),
        body_fat: clamp(roundTo5(parsed.metrics.body_fat) + getNoise(base64, 2)),
        v_taper: clamp(roundTo5(parsed.metrics.v_taper) + getNoise(base64, 3)),
        symmetry: clamp(roundTo5(parsed.metrics.symmetry) + getNoise(base64, 4)),
        legs: clamp(roundTo5(parsed.metrics.legs) + getNoise(base64, 5))
      };

      // 4. Считаем честное среднее по УЖЕ ЖИВЫМ метрикам
      const overall = Math.round(
        (m.shoulders_waist + m.body_fat + m.v_taper + m.symmetry + m.legs) / 5
      );

      // 5. Считаем честный перцентиль (Нормальное распределение)
      const mu = 50;
      const sigma = 15;
      const z = (overall - mu) / sigma;
      const p = 1 / (1 + Math.exp(-1.702 * z));
      
      // Считаем сырой "Топ X%"
      const topRaw = (1 - p) * 100;
      let topFormatted;

      // Динамическое форматирование
      if (topRaw > 10) {
        topFormatted = Math.round(topRaw).toString();
      } else if (topRaw > 1) {
        topFormatted = topRaw.toFixed(1);
      } else {
        topFormatted = Math.max(0.01, topRaw).toFixed(2);
      }

      // 6. Формируем финальный объект
      const finalResult = {
        overall: overall,
        percentile: Math.round(p * 100),
        topPercentage: topFormatted,
        metrics: m,
        strong: parsed.strong,
        weak: parsed.weak
      };

      return NextResponse.json(finalResult);
    } catch {
      console.error("Parse error, raw:", content);
      return NextResponse.json({ error: "Parse error" }, { status: 500 });
    }
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
