import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "ТЕЛОМЕТР - ИИ оценка тела",
  description:
    "Загрузи фото - узнай свой рейтинг, пропорции и процент жира. Бесплатно.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
