"use client";

import { useState, useRef, useEffect } from "react";
import imageCompression from 'browser-image-compression';

const features = [
  {
    icon: "📸",
    title: "Загрузи фото",
    desc: "Подбери хороший ракурс. Чем лучше видно тело - тем точнее результат",
  },
  {
    icon: "🧠",
    title: "ИИ анализ тела",
    desc: "Нейросеть оценивает пропорции, процент жира и мышечный баланс",
  },
  {
    icon: "📊",
    title: "Подробный отчёт",
    desc: "Рейтинг, текстовое описание сильных и слабых сторон",
  },
  {
    icon: "🎯",
    title: "Цели и план",
    desc: "Советы, над чем работать для улучшения оценки",
  },
  {
    icon: "📈",
    title: "Прогресс",
    desc: "Отслеживай изменения тела от оценки к оценке на графиках",
  },
  {
    icon: "🏆",
    title: "Рейтинг",
    desc: "Топ 5%? Топ 30%? Узнай, где ты среди людей своего возраста",
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

const metricLabelsMale: Record<string, string> = {
  shoulders_waist: "Плечи / Талия",
  body_fat: "Процент жира",
  v_taper: "V-taper",
  symmetry: "Симметрия",
  legs: "Масса ног",
};

const metricLabelsFemale: Record<string, string> = {
  shoulders_waist: "Талия / Бедра",
  body_fat: "Процент жира",
  v_taper: "Песочные часы",
  symmetry: "Симметрия",
  legs: "Ноги и ягодицы",
};

// Динамический цвет для полосок: на белом фоне (мужчины) берем чуть более темный оттенок (-600), 
// на черном фоне (девушки) оставляем оригинальный (-500) для лучшего контраста.
// Строгая инверсия светлоты (Lightness) для светлого фона.
// В Tailwind инверсия оттенка X -> (1000 - X). 
// 500 остается 500, 400 становится 600.
function getColor(value: number, gender: "male" | "female") {
  // Для девушек (темный фон) - оригинальные цвета
  if (gender === "female") {
    if (value >= 75) return "from-green-500 to-emerald-400";
    if (value >= 50) return "from-yellow-500 to-amber-400";
    return "from-red-500 to-rose-400";
  }
  
  // Для парней (светлый фон) - математическая инверсия оттенков
  if (value >= 75) return "from-green-500 to-emerald-600";
  if (value >= 50) return "from-yellow-500 to-amber-600";
  return "from-red-500 to-rose-600";
}

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function Home() {
  const [gender, setGender] = useState<"male" | "female">("male");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlGender = params.get("gender");
    if (urlGender === "female") setGender("female");
    else if (urlGender === "male") setGender("male");
  }, []);

  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<"form" | "analyzing" | "result">("form");

  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  
  const [errors, setErrors] = useState({ age: "", height: "", weight: "" });

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [unlockEmail, setUnlockEmail] = useState("");

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      fileType: "image/jpeg"
    };

    try {
      const compressedBlob = await imageCompression(file, options);
      const compressedFile = new File([compressedBlob], file.name, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
      setPhoto(compressedFile);
    } catch (error) {
      console.error("Compression error:", error);
      setPhoto(file);
    }
  };

  const handleAnalyze = async () => {
    if (!photo || !age || !height || !weight) return;

    let newErrors = { age: "", height: "", weight: "" };
    let isValid = true;

    const numAge = parseInt(age, 10);
    const numHeight = parseInt(height, 10);
    const numWeight = parseInt(weight, 10);

    if (!numAge || numAge < 14 || numAge > 150) {
      newErrors.age = "Укажи возраст от 14 до 150 лет";
      isValid = false;
    }
    if (!numHeight || numHeight < 10 || numHeight > 250) {
      newErrors.height = "Укажи рост от 10 до 250 см";
      isValid = false;
    }
    if (!numWeight || numWeight < 20 || numWeight > 500) {
      newErrors.weight = "Укажи вес от 20 до 500 кг";
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) return;

    setStep("analyzing");

    const formData = new FormData();
    formData.append("photo", photo);
    formData.append("age", age);
    formData.append("height", height);
    formData.append("weight", weight);
    formData.append("gender", gender);

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

  const currentLabels = gender === "male" ? metricLabelsMale : metricLabelsFemale;

  return (
    <div className={`min-h-screen selection:bg-indigo-500/30 ${
      gender === "male" ? "bg-[#f7f7f5] text-slate-900" : "bg-[#08080a] text-white"
    }`}>
      {/* ===== NAV ===== */}
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-2xl border-b ${
        gender === "male" ? "bg-[#f7f7f5]/80 border-black/[0.06]" : "bg-[#08080a]/70 border-white/[0.06]"
      }`}>
        {/* Добавили relative, чтобы абсолютно центрировать свитчер */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center relative">
          
          {/* ЛОГОТИП */}
          <div className="flex items-center gap-2.5 z-10">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
              gender === "male" ? "bg-gradient-to-br from-[#9c990e] to-[#6ccc15] text-black" : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
            }`}>
              Т
            </div>
            {/* Прячем текст на мобилках (hidden), показываем начиная от планшетов (sm:block) */}
            <span className="text-lg font-bold tracking-tight hidden sm:block">ТЕЛОМЕТР</span>
          </div>

          {/* === СВИТЧЕР ПОЛА (Идеально по центру) === */}
          <div className={`absolute left-1/2 -translate-x-1/2 flex p-1 rounded-full z-10 ${gender === "male" ? "bg-black/5" : "bg-white/10"}`}>
            <button 
              onClick={() => { setGender("male"); setResult(null); setStep("form"); }}
              className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                gender === "male" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-white"
              }`}
            >
              Мужчины
            </button>
            <button 
              onClick={() => { setGender("female"); setResult(null); setStep("form"); }}
              className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                gender === "female" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
              }`}
            >
              Девушки
            </button>
          </div>

          {/* МЕНЮ СПРАВА */}
          <div className="hidden md:flex items-center gap-8 text-sm z-10">
            <a href="#how" className={gender === "male" ? "text-gray-500 hover:text-black" : "text-gray-400 hover:text-white"}>Как работает</a>
            <a href="#demo" className={gender === "male" ? "text-gray-500 hover:text-black" : "text-gray-400 hover:text-white"}>Пример</a>
            <button
              onClick={() => { setShowModal(true); setStep("form"); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                gender === "male" ? "bg-black/5 hover:bg-black/10 text-black" : "bg-white/10 hover:bg-white/15 text-white"
              }`}
            >
              Начать
            </button>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[800px] h-[400px] sm:h-[600px] pointer-events-none">
          <div className={`absolute inset-0 rounded-full blur-[70px] sm:blur-[120px] transform-gpu ${
            gender === "male" ? "bg-[#b0b91a]/[0.07]" : "bg-indigo-600/[0.07]"
          }`} />
          <div className={`absolute top-10 -left-10 sm:top-20 sm:-left-20 w-48 sm:w-72 h-48 sm:h-72 rounded-full blur-[50px] sm:blur-[100px] transform-gpu ${
            gender === "male" ? "bg-[#6ccc15]/[0.05]" : "bg-purple-600/[0.05]"
          }`} />
        </div>

        <div className="relative z-10 max-w-3xl -mt-12 sm:-mt-20">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm mb-8 ${
            gender === "male" ? "border-black/10 bg-black/[0.03] text-gray-600" : "border-white/10 bg-white/[0.03] text-gray-400"
          }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              gender === "male" ? "bg-[#dd3aa1]" : "bg-green-500"
            }`} />
            Бета — бесплатный доступ
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
            Нейросеть
            <br />
            <span className={`bg-clip-text text-transparent bg-gradient-to-r ${
              gender === "male" ? "from-[#7e7307] via-[#3f7b03] to-[#0b8d49]" : "from-indigo-400 via-purple-400 to-pink-400"
            }`}>
              оценит твоё&nbsp;тело
            </span>
          </h1>

          <p className={`text-lg sm:text-xl max-w-xl mx-auto mb-14 leading-relaxed px-2 ${
            gender === "male" ? "text-gray-600" : "text-gray-400"
          }`}>
            Загрузи фото — узнай процент жира, пропорции{" "}
            <br className="hidden sm:block" />
            и свой уровень среди <span className={`font-medium whitespace-nowrap ${gender === "male" ? "text-black" : "text-white"}`}>тысяч {gender === "male" ? "мужчин" : "девушек"}</span>.
          </p>

          <button
            onClick={() => { setShowModal(true); setStep("form"); }}
            className={`group px-8 py-4 rounded-2xl font-semibold text-lg transition hover:-translate-y-0.5 hover:shadow-xl ${
              gender === "male" 
                ? "bg-[#b0b91a] hover:bg-[#9c990e] text-black hover:shadow-[#b0b91a]/25" 
                : "bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-600/25"
            }`}
          >
            Оценить себя
            <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </button>

          <div className={`mt-6 flex flex-wrap justify-center gap-x-2 gap-y-1 text-sm ${
            gender === "male" ? "text-gray-500" : "text-gray-500"
          }`}>
            <span className="whitespace-nowrap">За 30 секунд</span>
            <span>•</span>
            <span className="whitespace-nowrap">Без регистрации</span>
            <span>•</span>
            <span className="whitespace-nowrap">Фото под защитой</span>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="max-w-5xl mx-auto px-6 pb-28 pt-10 -mt-12 sm:-mt-24 relative z-20">
        <p className={`text-center text-sm font-semibold uppercase tracking-widest mb-4 ${
          gender === "male" ? "text-[#7e7307]" : "text-indigo-400"
        }`}>Как работает</p>
        <h2 className="text-center text-3xl sm:text-4xl font-bold mb-16 tracking-tight">Три шага — одна минута</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Заполни данные", desc: "Возраст, рост, вес — нужно для точного сравнения с твоей группой" },
            { step: "02", title: "Загрузи фото", desc: "Фото, на котором видно форму. Можно в зеркале с телефона" },
            { step: "03", title: "Получи отчёт", desc: "Рейтинг, пропорции, процент жира, советы и прогресс" },
          ].map((s) => (
            <div key={s.step} className="relative">
              <span className={`text-6xl font-black absolute -top-4 -left-2 ${
                gender === "male" ? "text-black/[0.03]" : "text-white/[0.03]"
              }`}>{s.step}</span>
              <div className="relative pt-8">
                <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                <p className={`leading-relaxed ${gender === "male" ? "text-gray-600" : "text-gray-400"}`}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className={`group p-6 rounded-2xl transition-colors ${
              gender === "male" 
                ? "bg-black/[0.02] border border-black/[0.06] hover:border-[#b0b91a]/30 hover:bg-black/[0.04]" 
                : "bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/30 hover:bg-white/[0.04]"
            }`}>
              <span className="text-2xl mb-4 block">{f.icon}</span>
              <h3 className="font-semibold mb-1.5">{f.title}</h3>
              <p className={`text-sm leading-relaxed ${gender === "male" ? "text-gray-600" : "text-gray-400"}`}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== DEMO REPORT ===== */}
      <section id="demo" className="max-w-2xl mx-auto px-6 py-28">
        <p className={`text-center text-sm font-semibold uppercase tracking-widest mb-4 ${
          gender === "male" ? "text-[#7e7307]" : "text-indigo-400"
        }`}>Пример отчёта</p>
        <h2 className="text-center text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Вот что ты получишь</h2>
        <p className={`text-center mb-12 ${gender === "male" ? "text-gray-600" : "text-gray-400"}`}>
          Демо-результат для {gender === "male" ? "парня" : "девушки"}, 24 года, {gender === "male" ? "182 см, 78 кг" : "168 см, 55 кг"}
        </p>
        <div className={`p-8 rounded-3xl mb-6 ${
          gender === "male" ? "bg-black/[0.02] border border-black/[0.06]" : "bg-white/[0.02] border border-white/[0.06]"
        }`}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className={`text-sm mb-1 ${gender === "male" ? "text-gray-600" : "text-gray-400"}`}>Общий рейтинг</p>
              <p className="text-5xl font-black">78<span className={`text-lg font-normal ${gender === "male" ? "text-gray-500" : "text-gray-400"}`}>/100</span></p>
            </div>
            <div className="text-right">
              <div className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                gender === "male" ? "bg-green-600/10 text-green-700" : "bg-green-500/10 text-green-400"
              }`}>Топ 12%</div>
              <p className={`text-sm mt-1 ${gender === "male" ? "text-gray-500" : "text-gray-500"}`}>
                среди {gender === "male" ? "мужчин" : "девушек"} 20-25
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: currentLabels.shoulders_waist, value: 92, color: getColor(92, gender) },
              { label: currentLabels.body_fat, value: 74, color: getColor(74, gender) },
              { label: currentLabels.v_taper, value: 88, color: getColor(88, gender) },
              { label: currentLabels.symmetry, value: 65, color: getColor(65, gender) },
              { label: currentLabels.legs, value: 45, color: getColor(45, gender) },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className={`${gender === "male" ? "text-slate-700" : "text-gray-300"}`}>{m.label}</span>
                  <span className={`${gender === "male" ? "text-gray-600" : "text-gray-500"}`}>{m.value}/100</span>
                </div>
                <div className={`h-2.5 rounded-full overflow-hidden ${gender === "male" ? "bg-black/10" : "bg-white/[0.06]"}`}>
                  <div className={`h-full rounded-full bg-gradient-to-r ${m.color}`} style={{ width: `${m.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-5 rounded-2xl ${
            gender === "male" ? "bg-green-600/[0.05] border border-green-600/10" : "bg-green-500/[0.05] border border-green-500/10"
          }`}>
            <p className={`text-sm font-medium mb-1 ${gender === "male" ? "text-green-700" : "text-green-400"}`}>💪 Сильная сторона</p>
            <p className={`text-sm ${gender === "male" ? "text-slate-700" : "text-gray-300"}`}>
              {gender === "male" ? "V-taper и ширина плеч лучше чем у 88% людей" : "Отличное соотношение талии и бедер"}
            </p>
          </div>
          <div className={`p-5 rounded-2xl ${
            gender === "male" ? "bg-red-600/[0.05] border border-red-600/10" : "bg-red-500/[0.05] border border-red-500/10"
          }`}>
            <p className={`text-sm font-medium mb-1 ${gender === "male" ? "text-red-700" : "text-red-400"}`}>🎯 Зона роста</p>
            <p className={`text-sm ${gender === "male" ? "text-slate-700" : "text-gray-300"}`}>
              {gender === "male" ? "Ноги отстают — добавь приседания и выпады" : "Можно немного поработать над тонусом ног"}
            </p>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section id="cta" className="px-6 py-28">
        <div className={`relative max-w-lg mx-auto p-10 sm:p-14 rounded-3xl text-center overflow-hidden ${
          gender === "male" ? "bg-black/[0.02] border border-black/[0.06]" : "bg-white/[0.02] border border-white/[0.06]"
        }`}>
          <div className={`absolute inset-0 bg-gradient-to-b pointer-events-none ${
            gender === "male" ? "from-[#b0b91a]/[0.05] to-transparent" : "from-indigo-600/[0.05] to-transparent"
          }`} />
          <div className="relative">
            <h2 className="text-3xl font-bold mb-3">Готов узнать свой уровень?</h2>
            <p className={`mb-8 ${gender === "male" ? "text-gray-600" : "text-gray-400"}`}>Оставь email — отправим приглашение в бету</p>
            {emailStatus === "success" && !showModal ? (
              <div className={`p-4 rounded-xl text-sm font-medium ${
                gender === "male" ? "bg-green-600/10 border border-green-600/20 text-green-700" : "bg-green-500/10 border border-green-500/20 text-green-400"
              }`}>
                🎉 Спасибо! Мы пришлем приглашение.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mx-auto">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" disabled={emailStatus === "loading"}
                  className={`min-w-0 flex-1 px-4 py-3.5 border rounded-xl outline-none disabled:opacity-50 ${
                    gender === "male" 
                      ? "bg-black/[0.03] border-black/10 text-slate-900 placeholder-gray-500 focus:border-[#b0b91a]" 
                      : "bg-white/[0.05] border-white/10 text-white placeholder-gray-500 focus:border-indigo-500"
                  }`} />
                <button type="submit" disabled={!isValidEmail(email) || emailStatus === "loading"}
                  className={`px-6 py-3.5 rounded-xl font-semibold transition hover:-translate-y-0.5 shrink-0 cursor-pointer disabled:opacity-30 flex justify-center items-center min-w-[160px] ${
                    gender === "male" ? "bg-[#b0b91a] hover:bg-[#9c990e] text-black" : "bg-indigo-600 hover:bg-indigo-500 text-white"
                  }`}>
                  {emailStatus === "loading" ? <span className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${gender === "male" ? "border-black/30 border-t-black" : "border-white/30 border-t-white"}`} /> : "Получить доступ"}
                </button>
              </form>
            )}
            <p className={`text-xs mt-4 ${gender === "male" ? "text-gray-500" : "text-gray-500"}`}>Детальные оценки и рейтинг</p>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className={`border-t py-10 text-center ${
        gender === "male" ? "border-black/[0.06]" : "border-white/[0.06]"
      }`}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
            gender === "male" ? "bg-gradient-to-br from-[#9c990e] to-[#6ccc15] text-black" : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
          }`}>Т</div>
          <span className="font-semibold text-sm">ТЕЛОМЕТР</span>
        </div>
        <p className={`text-sm ${gender === "male" ? "text-gray-500" : "text-gray-500"}`}>© 2026 Телометр. Все права защищены.</p>
      </footer>

      {/* ===== MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className={`relative rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 ${
            gender === "male" ? "bg-[#f7f7f5] border border-black/[0.08]" : "bg-[#111113] border border-white/[0.08]"
          }`}>
            <button onClick={() => setShowModal(false)} className={`absolute top-4 right-4 text-2xl ${
              gender === "male" ? "text-gray-500 hover:text-black" : "text-gray-500 hover:text-white"
            }`}>×</button>

            {/* STEP: FORM */}
            {step === "form" && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Оценить {gender === "male" ? "телосложение" : "фигуру"}</h2>
                <div className="space-y-4">
                  
                  {/* ВОЗРАСТ */}
                  <div>
                    <label className={`text-sm mb-1 block ${gender === "male" ? "text-gray-600" : "text-gray-400"}`}>Возраст</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      maxLength={3}
                      value={age} 
                      onChange={(e) => {
                        setAge(e.target.value.replace(/\D/g, ""));
                        setErrors({ ...errors, age: "" });
                      }} 
                      placeholder="24"
                      className={`w-full px-4 py-3 border rounded-xl outline-none ${
                        gender === "male" 
                          ? "bg-black/[0.03] text-slate-900 placeholder-gray-500" 
                          : "bg-white/[0.05] text-white placeholder-gray-500"
                      } ${
                        errors.age 
                          ? (gender === "male" ? "border-red-500 focus:border-red-600" : "border-red-500/60 focus:border-red-500") 
                          : (gender === "male" ? "border-black/10 focus:border-[#b0b91a]" : "border-white/10 focus:border-indigo-500")
                      }`}
                    />
                    {errors.age && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.age}</p>}
                  </div>

                  {/* РОСТ */}
                  <div>
                    <label className={`text-sm mb-1 block ${gender === "male" ? "text-gray-600" : "text-gray-400"}`}>Рост (см)</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      maxLength={3}
                      value={height} 
                      onChange={(e) => {
                        setHeight(e.target.value.replace(/\D/g, ""));
                        setErrors({ ...errors, height: "" });
                      }} 
                      placeholder={gender === "male" ? "182" : "168"}
                      className={`w-full px-4 py-3 border rounded-xl outline-none ${
                        gender === "male" 
                          ? "bg-black/[0.03] text-slate-900 placeholder-gray-500" 
                          : "bg-white/[0.05] text-white placeholder-gray-500"
                      } ${
                        errors.height 
                          ? (gender === "male" ? "border-red-500 focus:border-red-600" : "border-red-500/60 focus:border-red-500") 
                          : (gender === "male" ? "border-black/10 focus:border-[#b0b91a]" : "border-white/10 focus:border-indigo-500")
                      }`}
                    />
                    {errors.height && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.height}</p>}
                  </div>

                  {/* ВЕС */}
                  <div>
                    <label className={`text-sm mb-1 block ${gender === "male" ? "text-gray-600" : "text-gray-400"}`}>Вес (кг)</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      maxLength={3}
                      value={weight} 
                      onChange={(e) => {
                        setWeight(e.target.value.replace(/\D/g, ""));
                        setErrors({ ...errors, weight: "" });
                      }} 
                      placeholder={gender === "male" ? "78" : "55"}
                      className={`w-full px-4 py-3 border rounded-xl outline-none ${
                        gender === "male" 
                          ? "bg-black/[0.03] text-slate-900 placeholder-gray-500" 
                          : "bg-white/[0.05] text-white placeholder-gray-500"
                      } ${
                        errors.weight 
                          ? (gender === "male" ? "border-red-500 focus:border-red-600" : "border-red-500/60 focus:border-red-500") 
                          : (gender === "male" ? "border-black/10 focus:border-[#b0b91a]" : "border-white/10 focus:border-indigo-500")
                      }`}
                    />
                    {errors.weight && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.weight}</p>}
                  </div>

                  <div>
                    <label className={`text-sm mb-1 block ${gender === "male" ? "text-gray-600" : "text-gray-400"}`}>Фото</label>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    {photoPreview ? (
                      <div className="relative">
                        <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                        <button onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                          className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80">×</button>
                      </div>
                    ) : (
                      <button onClick={() => fileRef.current?.click()}
                        className={`w-full py-8 border-2 border-dashed rounded-xl transition ${
                          gender === "male" 
                            ? "border-black/10 text-gray-600 hover:border-[#b0b91a]/50 hover:text-black" 
                            : "border-white/10 text-gray-400 hover:border-indigo-500/50 hover:text-white"
                        }`}>
                        📸 Нажми чтобы загрузить фото
                      </button>
                    )}
                  </div>

                  <button onClick={handleAnalyze} disabled={!photo || !age || !height || !weight}
                    className={`w-full py-4 rounded-xl font-semibold text-lg transition disabled:opacity-30 disabled:cursor-not-allowed ${
                      gender === "male" ? "bg-[#b0b91a] hover:bg-[#9c990e] text-black" : "bg-indigo-600 hover:bg-indigo-500 text-white"
                    }`}>
                    Анализировать →
                  </button>
                </div>
              </div>
            )}

            {/* STEP: ANALYZING */}
            {step === "analyzing" && (
              <div className="text-center py-16">
                <div className={`w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-6 ${
                  gender === "male" ? "border-[#b0b91a]/30 border-t-[#b0b91a]" : "border-indigo-500/30 border-t-indigo-500"
                }`} />
                <h2 className="text-2xl font-bold mb-2">Анализируем...</h2>
                <p className={`${gender === "male" ? "text-gray-600" : "text-gray-400"}`}>
                  Нейросеть оценивает {gender === "male" ? "твоё телосложение" : "твою фигуру"}
                </p>
              </div>
            )}

            {/* STEP: RESULT */}
            {step === "result" && result && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Твой результат</h2>

                {/* Overall — always visible */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className={`text-sm mb-1 ${gender === "male" ? "text-gray-600" : "text-gray-400"}`}>Общий рейтинг</p>
                    <p className="text-5xl font-black">
                      {result.overall}<span className={`text-lg font-normal ${gender === "male" ? "text-gray-500" : "text-gray-400"}`}>/100</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                      gender === "male" ? "bg-green-600/10 text-green-700" : "bg-green-500/10 text-green-400"
                    }`}>
                      Топ {result.topPercentage}%
                    </div>
                  </div>
                </div>

                {/* Metrics — blurred unless unlocked */}
                <div className={`space-y-4 ${!unlocked ? "blur-md select-none pointer-events-none" : ""}`}>
                  {Object.entries(result.metrics).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className={`${gender === "male" ? "text-slate-700" : "text-gray-300"}`}>{currentLabels[key] || key}</span>
                        <span className={`${gender === "male" ? "text-gray-600" : "text-gray-500"}`}>{value}/100</span>
                      </div>
                      <div className={`h-2.5 rounded-full overflow-hidden ${gender === "male" ? "bg-black/10" : "bg-white/[0.06]"}`}>
                        <div className={`h-full rounded-full bg-gradient-to-r ${getColor(value, gender)}`} style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <div className={`p-4 rounded-xl ${
                      gender === "male" ? "bg-green-600/[0.05] border border-green-600/10" : "bg-green-500/[0.05] border border-green-500/10"
                    }`}>
                      <p className={`text-sm font-medium mb-1 ${gender === "male" ? "text-green-700" : "text-green-400"}`}>💪 Сильная сторона</p>
                      <p className={`text-sm ${gender === "male" ? "text-slate-700" : "text-gray-300"}`}>{result.strong}</p>
                    </div>
                    <div className={`p-4 rounded-xl ${
                      gender === "male" ? "bg-red-600/[0.05] border border-red-600/10" : "bg-red-500/[0.05] border border-red-500/10"
                    }`}>
                      <p className={`text-sm font-medium mb-1 ${gender === "male" ? "text-red-700" : "text-red-400"}`}>🎯 Зона роста</p>
                      <p className={`text-sm ${gender === "male" ? "text-slate-700" : "text-gray-300"}`}>{result.weak}</p>
                    </div>
                  </div>
                </div>

                {/* Email gate */}
                {!unlocked && (
                  <div className={`mt-8 p-6 rounded-2xl text-center ${
                    gender === "male" ? "bg-black/[0.02] border border-black/[0.06]" : "bg-white/[0.03] border border-white/[0.08]"
                  }`}>
                    <p className="font-semibold mb-1">Разблокируй полный отчёт</p>
                    <p className={`text-sm mb-4 ${gender === "male" ? "text-gray-600" : "text-gray-400"}`}>Оставь email — покажем все метрики и рекомендации</p>
                    <div className="flex gap-2">
                      <input type="email" value={unlockEmail} onChange={(e) => setUnlockEmail(e.target.value)} placeholder="your@email.com"
                        className={`flex-1 px-4 py-3 border rounded-xl outline-none transition ${
                          gender === "male" 
                            ? "bg-black/[0.03] border-black/10 text-slate-900 placeholder-gray-500 focus:border-[#b0b91a]" 
                            : "bg-white/[0.05] border-white/10 text-white placeholder-gray-500 focus:border-indigo-500"
                        }`} />
                      <button onClick={handleUnlock} disabled={!isValidEmail(unlockEmail) || emailStatus === "loading"}
                        className={`px-6 py-3 rounded-xl font-semibold transition hover:-translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed ${
                          gender === "male" ? "bg-[#b0b91a] hover:bg-[#9c990e] text-black" : "bg-indigo-600 hover:bg-indigo-500 text-white"
                        }`}>
                        Открыть
                      </button>
                    </div>
                  </div>
                )}

                {/* Try again */}
                <button onClick={() => { setStep("form"); setResult(null); setUnlocked(false); setPhoto(null); setPhotoPreview(null); }}
                  className={`w-full mt-4 py-3 rounded-xl transition ${
                    gender === "male" ? "bg-black/[0.03] hover:bg-black/[0.06] text-slate-700" : "bg-white/[0.05] hover:bg-white/[0.08] text-gray-300"
                  }`}>
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