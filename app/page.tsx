"use client";

import { useState, useRef } from "react";
import imageCompression from 'browser-image-compression';

const features = [
  {
    icon: "📸",
    title: "Загрузи до 4 фото",
    desc: "Несколько ракурсов — перед, бок, спина, расслабленная поза. Чем больше - тем точнее результат.",
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

type AnalysisResult = {
  overall: number;
  percentile: number;
  topPercentage: string;
  metrics: {
    shoulders_waist: number;
    body_fat: number;
    v_taper: number;
    symmetry: number;
    legs: number;
  };
  strong: string;
  weak: string;
};

const metricLabels: Record<string, string> = {
  shoulders_waist: "Плечи / Талия",
  body_fat: "Процент жира",
  v_taper: "V-taper",
  symmetry: "Симметрия",
  legs: "Масса ног",
};

function getColor(value: number) {
  if (value >= 75) return "from-green-500 to-emerald-400";
  if (value >= 50) return "from-yellow-500 to-amber-400";
  return "from-red-500 to-rose-400";
}

export default function Home() {
  // Email state
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<"form" | "analyzing" | "result">("form");

  // Form state
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Result state
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [unlockEmail, setUnlockEmail] = useState("");

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Show the preview immediately so the user doesn't wait
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);

    // 2. Compress the file in the background before saving to state
    const options = {
      maxSizeMB: 1,           // Forces the file under 1MB
      maxWidthOrHeight: 1024, // Resizes to 1024px max. (Perfect for AI vision)
      useWebWorker: true,
      fileType: "image/jpeg"  // CRITICAL: Converts iPhone HEIC photos to standard JPEG
    };

    try {
      // Compress it
      const compressedBlob = await imageCompression(file, options);
      
      // Convert Blob back to File object so your FormData doesn't break
      const compressedFile = new File([compressedBlob], file.name, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
      
      setPhoto(compressedFile); // Save the lightweight file to state
    } catch (error) {
      console.error("Compression error:", error);
      setPhoto(file); // Fallback to original if compression fails
    }
  };

  const handleAnalyze = async () => {
    if (!photo || !age || !height || !weight) return;

    setStep("analyzing");

    const formData = new FormData();
    formData.append("photo", photo);
    formData.append("age", age);
    formData.append("height", height);
    formData.append("weight", weight);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("API error");

      const data = await response.json();
      setResult(data);
      setStep("result");
    } catch (error) {
      alert("Ошибка анализа. Попробуй другое фото.");
      setStep("form");
    }
  };

  const handleUnlock = async () => {
    if (!unlockEmail) return;
    setEmailStatus("loading");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unlockEmail }),
      });

      if (response.ok) {
        setUnlocked(true);
        setEmailStatus("success");
      } else {
        throw new Error();
      }
    } catch {
      try {
        const saved = JSON.parse(localStorage.getItem("pending_emails") || "[]");
        saved.push({ email: unlockEmail, timestamp: Date.now() });
        localStorage.setItem("pending_emails", JSON.stringify(saved));
      } catch {}
      setUnlocked(true);
      setEmailStatus("success");
    }
  };

  // Email submit for bottom CTA
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus("loading");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setEmailStatus("success");
        setEmail("");
      } else {
        throw new Error("API error");
      }
    } catch {
      try {
        const saved = JSON.parse(localStorage.getItem("pending_emails") || "[]");
        saved.push({ email, timestamp: Date.now() });
        localStorage.setItem("pending_emails", JSON.stringify(saved));
      } catch {}
      setEmailStatus("success");
      setEmail("");
    }
  };

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
            <a href="#how" className="text-gray-400 hover:text-white transition">Как работает</a>
            <a href="#demo" className="text-gray-400 hover:text-white transition">Пример</a>
            <button
              onClick={() => { setShowModal(true); setStep("form"); }}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg transition font-medium"
            >
              Начать
            </button>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[800px] h-[400px] sm:h-[600px] pointer-events-none">
          <div className="absolute inset-0 bg-indigo-600/[0.07] rounded-full blur-[70px] sm:blur-[120px] transform-gpu" />
          <div className="absolute top-10 -left-10 sm:top-20 sm:-left-20 w-48 sm:w-72 h-48 sm:h-72 bg-purple-600/[0.05] rounded-full blur-[50px] sm:blur-[100px] transform-gpu" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-sm text-gray-400 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Бета — бесплатный доступ
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
            Нейросеть
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              оценит твоё&nbsp;тело
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed px-2">
            Загрузи фото — узнай процент жира, пропорции{" "}
            <br className="hidden sm:block" />
            и свой уровень среди <span className="text-white font-medium whitespace-nowrap">тысяч мужчин</span>.
          </p>

          <button
            onClick={() => { setShowModal(true); setStep("form"); }}
            className="group px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-semibold text-lg transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/25"
          >
            Оценить себя
            <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </button>

          <div className="mt-6 flex flex-wrap justify-center gap-x-2 gap-y-1 text-sm text-gray-500">
            <span className="whitespace-nowrap">За 30 секунд</span>
            <span>•</span>
            <span className="whitespace-nowrap">Без регистрации</span>
            <span>•</span>
            <span className="whitespace-nowrap">Фото под защитой</span>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="max-w-5xl mx-auto px-6 py-28">
        <p className="text-center text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-4">Как работает</p>
        <h2 className="text-center text-3xl sm:text-4xl font-bold mb-16 tracking-tight">Три шага — одна минута</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Заполни данные", desc: "Возраст, рост, вес — нужно для точного сравнения с твоей группой" },
            { step: "02", title: "Загрузи фото", desc: "Перед, бок, спина, расслабленная поза. Можно в зеркале с телефона" },
            { step: "03", title: "Получи отчёт", desc: "Рейтинг, пропорции, процент жира, план улучшений и прогресс" },
          ].map((s) => (
            <div key={s.step} className="relative">
              <span className="text-6xl font-black text-white/[0.03] absolute -top-4 -left-2">{s.step}</span>
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
            <div key={i} className="group p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:border-indigo-500/30 transition-all duration-300 hover:bg-white/[0.04]">
              <span className="text-2xl mb-4 block">{f.icon}</span>
              <h3 className="font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== DEMO REPORT ===== */}
      <section id="demo" className="max-w-2xl mx-auto px-6 py-28">
        <p className="text-center text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-4">Пример отчёта</p>
        <h2 className="text-center text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Вот что ты получишь</h2>
        <p className="text-center text-gray-400 mb-12">Демо-результат для парня, 24 года, 182 см, 78 кг</p>
        <div className="p-8 bg-white/[0.02] border border-white/[0.06] rounded-3xl mb-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm text-gray-400 mb-1">Общий рейтинг</p>
              <p className="text-5xl font-black">78<span className="text-lg text-gray-400 font-normal">/100</span></p>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-green-500/10 text-green-400 text-sm font-medium rounded-full">Топ 12%</div>
              <p className="text-sm text-gray-500 mt-1">среди мужчин 20-25</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: "Плечи / Талия", value: 92, color: "from-green-500 to-emerald-400" },
              { label: "Процент жира", value: 74, color: "from-yellow-500 to-amber-400" },
              { label: "V-taper", value: 88, color: "from-green-500 to-emerald-400" },
              { label: "Симметрия", value: 65, color: "from-yellow-500 to-orange-400" },
              { label: "Масса ног", value: 45, color: "from-red-500 to-rose-400" },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-300">{m.label}</span>
                  <span className="text-gray-500">{m.value}/100</span>
                </div>
                <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${m.color}`} style={{ width: `${m.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
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
            <p className="text-gray-400 mb-8">Оставь email — отправим приглашение в бету</p>
            {emailStatus === "success" && !showModal ? (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-medium">
                🎉 Спасибо! Мы пришлем приглашение.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mx-auto">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" disabled={emailStatus === "loading"}
                  className="min-w-0 flex-1 px-4 py-3.5 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition disabled:opacity-50" />
                <button type="submit" disabled={emailStatus === "loading"}
                  className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition shrink-0 cursor-pointer disabled:opacity-50 flex justify-center items-center min-w-[160px]">
                  {emailStatus === "loading" ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Получить доступ"}
                </button>
              </form>
            )}
            <p className="text-xs text-gray-500 mt-4">Детальные оценки и рейтинг</p>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/[0.06] py-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold">Т</div>
          <span className="font-semibold text-sm">ТЕЛОМЕТР</span>
        </div>
        <p className="text-sm text-gray-500">© 2025 Телометр. Все права защищены.</p>
      </footer>

      {/* ===== MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#111113] border border-white/[0.08] rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl">×</button>

            {/* STEP: FORM */}
            {step === "form" && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Оценить телосложение</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Возраст</label>
                    <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="24"
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Рост (см)</label>
                    <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="182"
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Вес (кг)</label>
                    <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="78"
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Фото</label>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    {photoPreview ? (
                      <div className="relative">
                        <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                        <button onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                          className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80">×</button>
                      </div>
                    ) : (
                      <button onClick={() => fileRef.current?.click()}
                        className="w-full py-8 border-2 border-dashed border-white/10 rounded-xl text-gray-400 hover:border-indigo-500/50 hover:text-gray-300 transition">
                        📸 Нажми чтобы загрузить фото
                      </button>
                    )}
                  </div>
                  <button onClick={handleAnalyze} disabled={!photo || !age || !height || !weight}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-semibold text-lg transition">
                    Анализировать →
                  </button>
                </div>
              </div>
            )}

            {/* STEP: ANALYZING */}
            {step === "analyzing" && (
              <div className="text-center py-16">
                <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-2">Анализируем...</h2>
                <p className="text-gray-400">Нейросеть оценивает твоё телосложение</p>
              </div>
            )}

            {/* STEP: RESULT */}
            {step === "result" && result && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Твой результат</h2>

                {/* Overall — always visible */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Общий рейтинг</p>
                    <p className="text-5xl font-black">
                      {result.overall}<span className="text-lg text-gray-400 font-normal">/100</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="inline-block px-3 py-1 bg-green-500/10 text-green-400 text-sm font-medium rounded-full">
                      Топ {result.topPercentage}%
                    </div>
                  </div>
                </div>

                {/* Metrics — blurred unless unlocked */}
                <div className={`space-y-4 ${!unlocked ? "blur-md select-none pointer-events-none" : ""}`}>
                  {Object.entries(result.metrics).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-300">{metricLabels[key] || key}</span>
                        <span className="text-gray-500">{value}/100</span>
                      </div>
                      <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${getColor(value)}`} style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <div className="p-4 bg-green-500/[0.05] border border-green-500/10 rounded-xl">
                      <p className="text-green-400 text-sm font-medium mb-1">💪 Сильная сторона</p>
                      <p className="text-sm text-gray-300">{result.strong}</p>
                    </div>
                    <div className="p-4 bg-red-500/[0.05] border border-red-500/10 rounded-xl">
                      <p className="text-red-400 text-sm font-medium mb-1">🎯 Зона роста</p>
                      <p className="text-sm text-gray-300">{result.weak}</p>
                    </div>
                  </div>
                </div>

                {/* Email gate */}
                {!unlocked && (
                  <div className="mt-8 p-6 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-center">
                    <p className="font-semibold mb-1">Разблокируй полный отчёт</p>
                    <p className="text-sm text-gray-400 mb-4">Оставь email — покажем все метрики и рекомендации</p>
                    <div className="flex gap-2">
                      <input type="email" value={unlockEmail} onChange={(e) => setUnlockEmail(e.target.value)} placeholder="your@email.com"
                        className="flex-1 px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-indigo-500" />
                      <button onClick={handleUnlock} disabled={!unlockEmail}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 rounded-xl font-semibold transition">
                        Открыть
                      </button>
                    </div>
                  </div>
                )}

                {/* Try again */}
                <button onClick={() => { setStep("form"); setResult(null); setUnlocked(false); setPhoto(null); setPhotoPreview(null); }}
                  className="w-full mt-4 py-3 bg-white/[0.05] hover:bg-white/[0.08] rounded-xl text-gray-300 transition">
                  ← Попробовать ещё раз
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
