import Link from "next/link";

const features = [
  {
    icon: "📸",
    title: "Загрузи до 4 фото",
    desc: "Несколько ракурсов — перед, бок, спина, расслабленная поза. Чем больше - тем точнее результат",
  },
  {
    icon: "🧠",
    title: "ИИ анализ тела",
    desc: "Нейросеть оценивает пропорции, процент жира, мышечный баланс и симметрию.",
  },
  {
    icon: "📊",
    title: "Подробный отчёт",
    desc: "Рейтинг, сравнение с твоей возрастной группой, сильные и слабые стороны.",
  },
  {
    icon: "🎯",
    title: "Цели и план",
    desc: "Узнай что качать, чтобы приблизиться к идеальным пропорциям.",
  },
  {
    icon: "📈",
    title: "Прогресс",
    desc: "Отслеживай изменения тела от оценки к оценке на графиках.",
  },
  {
    icon: "🏆",
    title: "Рейтинг",
    desc: "Топ 3%? Топ 10%? Узнай где ты среди всех и среди своего возраста.",
  },
];

const metrics = [
  { label: "Плечи / Талия", value: 92, color: "from-green-500 to-emerald-400" },
  { label: "Процент жира", value: 74, color: "from-yellow-500 to-amber-400" },
  { label: "V-taper", value: 88, color: "from-green-500 to-emerald-400" },
  { label: "Симметрия", value: 65, color: "from-yellow-500 to-orange-400" },
  { label: "Масса ног", value: 45, color: "from-red-500 to-rose-400" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#08080a] text-white selection:bg-indigo-500/30">
      {/* ===== NAV ===== */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-2xl bg-[#08080a]/70 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold">
              Т
            </div>
            <span className="text-lg font-bold tracking-tight">ТЕЛОМЕТР</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#how" className="text-gray-400 hover:text-white transition">
              Как работает
            </a>
            <a href="#demo" className="text-gray-400 hover:text-white transition">
              Пример
            </a>
            <a
              href="#cta"
              className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg transition font-medium"
            >
              Начать
            </a>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] pointer-events-none">
          <div className="absolute inset-0 bg-indigo-600/[0.07] rounded-full blur-[120px]" />
          <div className="absolute top-20 -left-20 w-72 h-72 bg-purple-600/[0.05] rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-sm text-gray-400 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Бета — бесплатный доступ
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
            Нейросеть
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              оценит твоё тело
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Загрузи фото — узнай процент жира, пропорции
            <br />
            и свой уровень среди <span className="text-white font-medium">тысяч мужчин</span>.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="#cta"
              className="group px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-semibold text-lg transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/25"
            >
              Оценить себя
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </a>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            За 30 секунд • Без регистрации • Фото под защитой
          </p>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="max-w-5xl mx-auto px-6 py-28">
        <p className="text-center text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-4">
          Как работает
        </p>
        <h2 className="text-center text-3xl sm:text-4xl font-bold mb-16 tracking-tight">
          Три шага — одна минута
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Заполни данные",
              desc: "Возраст, рост, вес — нужно для точного сравнения с твоей группой",
            },
            {
              step: "02",
              title: "Загрузи 4 фото",
              desc: "Перед, бок, спина, расслабленная поза. Можно в зеркале с телефона",
            },
            {
              step: "03",
              title: "Получи отчёт",
              desc: "Рейтинг, пропорции, процент жира, план улучшений и прогресс",
            },
          ].map((s) => (
            <div key={s.step} className="relative">
              <span className="text-6xl font-black text-white/[0.03] absolute -top-4 -left-2">
                {s.step}
              </span>
              <div className="relative pt-8">
                <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                <p className="text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="group p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:border-indigo-500/30 transition-all duration-300 hover:bg-white/[0.04]"
            >
              <span className="text-2xl mb-4 block">{f.icon}</span>
              <h3 className="font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== DEMO REPORT ===== */}
      <section id="demo" className="max-w-2xl mx-auto px-6 py-28">
        <p className="text-center text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-4">
          Пример отчёта
        </p>
        <h2 className="text-center text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
          Вот что ты получишь
        </h2>
        <p className="text-center text-gray-400 mb-12">
          Демо-результат для парня, 24 года, 182 см, 78 кг
        </p>

        {/* Score card */}
        <div className="p-8 bg-white/[0.02] border border-white/[0.06] rounded-3xl mb-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm text-gray-400 mb-1">Общий рейтинг</p>
              <p className="text-5xl font-black">
                78
                <span className="text-lg text-gray-400 font-normal">/100</span>
              </p>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-green-500/10 text-green-400 text-sm font-medium rounded-full">
                Топ 12%
              </div>
              <p className="text-sm text-gray-500 mt-1">среди мужчин 20-25</p>
            </div>
          </div>

          {/* Metric bars */}
          <div className="space-y-4">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-300">{m.label}</span>
                  <span className="text-gray-500">{m.value}/100</span>
                </div>
                <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${m.color}`}
                    style={{ width: `${m.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insight cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 bg-green-500/[0.05] border border-green-500/10 rounded-2xl">
            <p className="text-green-400 text-sm font-medium mb-1">💪 Сильная сторона</p>
            <p className="text-sm text-gray-300">V-taper и ширина плеч лучше чем у 88% людей</p>
          </div>
          <div className="p-5 bg-red-500/[0.05] border border-red-500/10 rounded-2xl">
            <p className="text-red-400 text-sm font-medium mb-1">🎯 Зона роста</p>
            <p className="text-sm text-gray-300">Ноги отстают — добавь приседания и выпады</p>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section id="cta" className="px-6 py-28">
        <div className="relative max-w-lg mx-auto p-10 sm:p-14 bg-white/[0.02] border border-white/[0.06] rounded-3xl text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/[0.05] to-transparent pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl font-bold mb-3">Готов узнать свой уровень?</h2>
            <p className="text-gray-400 mb-8">
              Оставь email — отправим приглашение в бету
            </p>
            <form
              className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mx-auto"
              action="https://formspree.io/f/mzdkknwg"
              method="POST"
            >
              <input
                type="email"
                name="email"
                required
                placeholder="your@email.com"
                className="min-w-0 flex-1 px-4 py-3.5 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition"
              />
              <button
                type="submit"
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition shrink-0 cursor-pointer"
              >
                Получить доступ
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-4">
              Детальные оценки и рейтинг
            </p>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/[0.06] py-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold">
            Т
          </div>
          <span className="font-semibold text-sm">ТЕЛОМЕТР</span>
        </div>
        <p className="text-sm text-gray-500">© 2026 Телометр. Все права защищены.</p>
      </footer>
    </div>
  );
}
