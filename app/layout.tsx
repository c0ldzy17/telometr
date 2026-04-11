import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";

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
      <body className={inter.className}>
        {children}

        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=108499203', 'ym');

            ym(108499203, 'init', {
              ssr:true, webvisor:true, clickmap:true, trackLinks:true, accurateTrackBounce:true
            });
          `}
        </Script>
        <noscript>
          <div>
            <img 
              src="https://mc.yandex.ru/watch/108499203" 
              style={{ position: "absolute", left: "-9999px" }} 
              alt="" 
            />
          </div>
        </noscript>

        {/* Пиксель VK (Top.Mail.Ru) */}
        <Script id="vk-pixel" strategy="afterInteractive">
        {`
          var _tmr = window._tmr || (window._tmr = []);
          _tmr.push({id: "3757597", type: "pageView", start: (new Date()).getTime()});
          (function (d, w, id) {
            if (d.getElementById(id)) return;
            var ts = d.createElement("script"); ts.type = "text/javascript"; ts.async = true; ts.id = id;
            ts.src = "https://top-fwz1.mail.ru/js/code.js";
            var f = function () {var s = d.getElementsByTagName("script")[0]; s.parentNode.insertBefore(ts, s);};
            if (w.opera == "[object Opera]") { d.addEventListener("DOMContentLoaded", f, false); } else { f(); }
          })(document, window, "tmr-code");
        `}
      </Script>
      <noscript>
        <div>
          <img src="https://top-fwz1.mail.ru/counter?id=3757597;js=na" style={{ position: 'absolute', left: '-9999px' }} alt="Top.Mail.Ru" />
        </div>
      </noscript>

      </body>
    </html>
  );
}