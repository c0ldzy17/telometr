import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("photo") as File;
    const age = formData.get("age") as string;
    const height = formData.get("height") as string;
    const weight = formData.get("weight") as string;
    const gender = (formData.get("gender") as string) || "male";

    if (!file || !age || !height || !weight) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Жесткая серверная валидация границ
    const numAge = parseInt(age, 10);
    const numHeight = parseInt(height, 10);
    const numWeight = parseInt(weight, 10);

    if (
      isNaN(numAge) || numAge < 14 || numAge > 150 ||
      isNaN(numHeight) || numHeight < 10 || numHeight > 250 ||
      isNaN(numWeight) || numWeight < 20 || numWeight > 500
    ) {
      return NextResponse.json({ error: "Invalid parameters out of bounds" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;

    // === ПЕРЕКЛЮЧАТЕЛЬ ИНТЕЛЛЕКТА ===
    // 0 = базовый дешевый режим (отработка на рефлексах)
    // 500-1000 = режим раздумий (повышает Elo, но работает чуть дольше)
    const thinkingTokens = 0;

    // === ДИНАМИЧЕСКИЙ ПРОМПТ ===
    const systemPromptMale = `Ты — строгий эксперт по оценке мужского телосложения.
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
- ЗАПРЕТ НА ЦИФРЫ: В текстах "strong" и "weak" КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО писать баллы, оценки или любые цифры (не пиши "на 96/100" или "оценка 80"). Используй ТОЛЬКО качественные прилагательные (например: "выдающаяся ширина", "отличный рельеф").

ПРОВЕРКА НА АДЕКВАТНОСТЬ (КРИТИЧНО):
Если на фото НЕТ человека (это животное, предмет, пустая комната), или фигуру абсолютно невозможно разглядеть:

Выдай всем 5 метрикам оценку строго 0.

В поле "strong" напиши: "Ошибка сканирования."

В поле "weak" напиши: "На фото сложно оценить параметры. Пожалуйста, загрузи нормальную фотографию."

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
}`;

    const systemPromptFemale = `Ты — строгий эксперт по оценке женской фигуры.
Тебе дают фото девушки и её параметры (возраст, рост, вес).
Оцени 5 базовых эстетических метрик по шкале от 0 до 100.

ЖЕСТКИЕ ГАЙДЛАЙНЫ ПО ОЦЕНКАМ (ВНИМАНИЕ: Ключи JSON остаются техническими, но оценивай их по женским стандартам):
1. shoulders_waist (Талия к бедрам): 90-100 = идеальное соотношение "песочные часы" (узкая талия, выразительные бедра), 70-89 = спортивные и подтянутые пропорции, 40-69 = обычная фигура (прямоугольник), 0-39 = талия шире бедер.
2. body_fat (Процент жира/Тонус): 90-100 = фитнес-модель (виден рельеф живота, 16-20%), 70-89 = стройная и подтянутая (21-24%), 40-69 = обычная норма (25-30%), 0-39 = лишний вес. Выдавай балл эстетичности, а не сам процент жира!
3. v_taper (Силуэт Песочные часы): 90-100 = ярко выраженные женственные изгибы, 40-69 = обычный силуэт, 0-39 = отсутствие изгибов.
4. symmetry (Симметрия): 90-100 = идеальный баланс и осанка, 40-69 = есть асимметрии.
5. legs (Ноги и ягодицы): 90-100 = стройные, подтянутые ноги и эстетичные ягодицы, 40-69 = обычные ноги, 0-39 = проблемные зоны.

ПРАВИЛА ДЛЯ ТЕКСТА (СТРОГО):
- "strong": Найди метрику с САМЫМ ВЫСОКИМ баллом. Напиши 1 предложение с похвалой именно этого аспекта. Никаких противоречий.
- "weak": Найди метрику с САМЫМ НИЗКИМ баллом. Напиши 1 предложение с мягким советом, как именно это улучшить. Не хвали в этом поле!
- ЗАПРЕТ НА ЦИФРЫ: В текстах "strong" и "weak" КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО писать баллы, оценки или любые цифры. Используй ТОЛЬКО качественные прилагательные (например: "изящная талия", "отличный тонус").

ПРОВЕРКА НА АДЕКВАТНОСТЬ (КРИТИЧНО):
Если на фото НЕТ человека, выдай всем метрикам 0. В "strong" напиши: "Ошибка сканирования." В "weak" напиши: "На фото сложно оценить параметры. Пожалуйста, загрузи нормальную фотографию."

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
}`;

    const activeSystemPrompt = gender === "female" ? systemPromptFemale : systemPromptMale;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://telometr.vercel.app",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite-preview-09-2025",
        temperature: 0,
        response_format: { type: "json_object" },
        // Спред-оператор: добавит max_tokens_for_reasoning только если thinkingTokens > 0
        ...(thinkingTokens > 0 && { max_tokens_for_reasoning: thinkingTokens }),
        messages: [
          {
            role: "system",
            content: activeSystemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `${gender === "female" ? "Девушка" : "Мужчина"}, ${age} лет, рост ${height} см, вес ${weight} кг. Оцени телосложение:`,
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
        max_tokens: 500, // Лимит на сам JSON-ответ
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      console.error("OpenRouter error:", JSON.stringify(data));
      return NextResponse.json({ error: "AI error" }, { status: 500 });
    }

    const content = data.choices[0].message.content;

    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      
      const roundTo5 = (val: number) => Math.round(Number(val) / 5) * 5;
      
      // Сначала определяем, есть ли ошибка
      const isScanError = parsed.strong.includes("Ошибка") || parsed.weak.includes("распознан");

      // Умный генератор шума
      const getNoise = (base64Str: string, salt: number, isError: boolean) => {
        const mod = (base64Str.length + salt) % 5;
        return isError ? mod : mod - 2; 
      };

      const clamp = (val: number) => Math.max(0, Math.min(100, val));

      // Формируем метрики с новым умным шумом
      const m = {
        shoulders_waist: clamp((isScanError ? 0 : roundTo5(parsed.metrics.shoulders_waist)) + getNoise(base64, 1, isScanError)),
        body_fat: clamp((isScanError ? 0 : roundTo5(parsed.metrics.body_fat)) + getNoise(base64, 2, isScanError)),
        v_taper: clamp((isScanError ? 0 : roundTo5(parsed.metrics.v_taper)) + getNoise(base64, 3, isScanError)),
        symmetry: clamp((isScanError ? 0 : roundTo5(parsed.metrics.symmetry)) + getNoise(base64, 4, isScanError)),
        legs: clamp((isScanError ? 0 : roundTo5(parsed.metrics.legs)) + getNoise(base64, 5, isScanError))
      };

      const overall = Math.round(
        (m.shoulders_waist + m.body_fat + m.v_taper + m.symmetry + m.legs) / 5
      );

      // -----------------------------------------------------
      // ТОЧНЫЙ РАСЧЕТ ПЕРЦЕНТИЛЯ (Abramowitz & Stegun 7.1.26)
      // Максимальная погрешность: 1.5 * 10^-7 (0.000015%)
      // -----------------------------------------------------
      const mu = 50;
      const sigma = 15;
      const z = (overall - mu) / sigma;

      const sign = z < 0 ? -1 : 1;
      const absZ = Math.abs(z) / Math.sqrt(2);
      const t = 1.0 / (1.0 + 0.3275911 * absZ);
      
      const erf = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-absZ * absZ);

      // p - точная вероятность (CDF нормального распределения)
      const p = 0.5 * (1.0 + sign * erf);
      
      // Переводим в процент людей, которые ХУЖЕ (например, 99.6%)
      // И вычитаем из 100, чтобы получить "Топ X%" (например, Топ 0.4%)
      const topRaw = (1 - p) * 100;
      
      let topFormatted;

      // Динамическое форматирование для максимальной информативности
      if (topRaw >= 10) {
        // Для основной массы: Топ 12%, Топ 45% (десятые доли не нужны)
        topFormatted = Math.round(topRaw).toString();
      } else if (topRaw >= 1) {
        // Для элиты: Топ 5.4%, Топ 1.2% (одна цифра после запятой)
        topFormatted = topRaw.toFixed(1);
      } else if (topRaw >= 0.01) {
        // Для генетических мутантов: Топ 0.43%, Топ 0.05% (сохраняем ту самую разницу в 0.01%)
        topFormatted = topRaw.toFixed(2);
      } else {
        // Жесткий кап снизу, чтобы не показывать 0.00%
        topFormatted = "<0.01"; 
      }
      // -----------------------------------------------------

      const finalResult = {
        overall: overall,
        percentile: Math.round(p * 100),
        topPercentage: topFormatted,
        metrics: m,
        strong: parsed.strong,
        weak: parsed.weak
      };

      // --- ОТПРАВКА ДЕТАЛЬНОГО ОТЧЕТА В TELEGRAM ---
      if (BOT_TOKEN && CHAT_ID) {
        const tgMessage = `📊 Новый анализ!
Пол: ${gender === "male" ? "Мужчина" : "Девушка"}
Возраст: ${age} | Рост: ${height} | Вес: ${weight}

🏆 Рейтинг: ${overall}/100 (Топ ${topFormatted}%)
- ${gender === "male" ? "Плечи/Талия" : "Талия/Бедра"}: ${m.shoulders_waist}
- Процент жира: ${m.body_fat}
- ${gender === "male" ? "V-taper" : "Песочные часы"}: ${m.v_taper}
- Симметрия: ${m.symmetry}
- Ноги: ${m.legs}

💪 Сильная: ${parsed.strong}
🎯 Слабая: ${parsed.weak}`;

        // Используем публичный прокси для обхода блокировок Timeweb
        const TG_API = process.env.TG_PROXY || "https://api.telegram.org";

        // Отправляем асинхронно, чтобы не задерживать ответ юзеру
        fetch(`${TG_API}/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text: tgMessage,
          }),
        }).catch(err => console.error("TG Log Error:", err));
      }
      // ----------------------------------------------

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