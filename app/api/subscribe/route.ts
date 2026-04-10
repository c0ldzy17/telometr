import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      console.error("Missing BOT_TOKEN or CHAT_ID");
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    const text = `🔥 Новая заявка в Телометр!\nEmail: ${email}`;

    // Используем публичный прокси для обхода блокировок Timeweb
    const TG_API = process.env.TG_PROXY || "https://api.telegram.org";

    fetch(`${TG_API}/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text }),
    })
    .catch(err => console.error("🌐 Сетевая ошибка:", err));

    // Мгновенно отдаем успех на фронтенд (никаких тормозов)
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}