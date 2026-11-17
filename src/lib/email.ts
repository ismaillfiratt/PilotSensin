import { Resend } from "resend";

const FROM    = process.env.RESEND_FROM    ?? "PilotSensin Destek <destek@pilotsensin.com>";
const DESTEK  = process.env.DESTEK_EMAIL   ?? "destek@pilotsensin.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://pilotsensin.com";

// Lazy init — build sırasında env boş olabilir, runtime'da key zorunlu
function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY env değişkeni tanımlı değil");
  return new Resend(key);
}

async function gonder(opts: Parameters<Resend["emails"]["send"]>[0], deneme = 1): Promise<void> {
  try {
    await getResend().emails.send(opts);
  } catch (err) {
    if (deneme < 3) {
      await new Promise(r => setTimeout(r, 1000 * 2 ** deneme));
      return gonder(opts, deneme + 1);
    }
    console.error("[email] gönderilemedi:", err);
  }
}

/* ── Şablonlar ─────────────────────────────────────────────────────────── */

function sarmalayici(icerik: string) {
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#0e172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fff}
  .wrap{max-width:560px;margin:0 auto;padding:32px 16px}
  .logo{font-size:20px;font-weight:800;color:#fbc024;margin-bottom:24px}
  .kart{background:#1a2744;border-radius:16px;padding:24px;margin-bottom:16px}
  .baslik{font-size:18px;font-weight:700;color:#fff;margin:0 0 8px}
  .altyazi{font-size:13px;color:#94a3b8;margin:0 0 20px}
  .satir{display:flex;gap:8px;margin-bottom:8px}
  .etiket{font-size:11px;font-weight:600;color:#94a3b8;min-width:90px;text-transform:uppercase;letter-spacing:.05em}
  .deger{font-size:13px;color:#e2e8f0}
  .mesaj-kutu{background:#0e172a;border-left:3px solid #fbc024;border-radius:8px;padding:16px;margin:16px 0}
  .mesaj-kutu p{margin:0;font-size:14px;color:#cbd5e1;line-height:1.6;white-space:pre-wrap}
  .btn{display:inline-block;padding:12px 28px;background:#fbc024;color:#0e172a;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;margin-top:16px}
  .footer{font-size:12px;color:#475569;text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid rgba(255,255,255,.07)}
</style></head><body><div class="wrap">
<div class="logo">✈ PilotSensin</div>
${icerik}
<div class="footer">destek@pilotsensin.com · © 2026 PilotSensin</div>
</div></body></html>`;
}

/* ── Dışa aktarılan fonksiyonlar ───────────────────────────────────────── */

export async function destekYeniTalepBildir(p: {
  talepId:       string;
  konu:          string;
  kategori:      string;
  oncelik:       string;
  kullaniciAd:   string;
  kullaniciEmail: string;
  mesaj:         string;
}) {
  const kisaId  = p.talepId.slice(0, 8);
  const adminUrl = `${APP_URL}/admin/destek/${p.talepId}`;

  await gonder({
    from:    FROM,
    to:      DESTEK,
    replyTo: p.kullaniciEmail,
    subject: `[#${kisaId}] ${p.konu}`,
    html: sarmalayici(`
      <div class="kart">
        <p class="baslik">🆕 Yeni Destek Talebi</p>
        <p class="altyazi">Talep #${kisaId}</p>
        <div class="satir"><span class="etiket">Kullanıcı</span><span class="deger">${p.kullaniciAd}</span></div>
        <div class="satir"><span class="etiket">E-posta</span><span class="deger">${p.kullaniciEmail}</span></div>
        <div class="satir"><span class="etiket">Kategori</span><span class="deger">${p.kategori}</span></div>
        <div class="satir"><span class="etiket">Öncelik</span><span class="deger">${p.oncelik}</span></div>
        <div class="mesaj-kutu"><p>${p.mesaj}</p></div>
        <a href="${adminUrl}" class="btn">Talebi Görüntüle →</a>
      </div>`),
  });
}

export async function destekCevapBildir(p: {
  talepId:       string;
  konu:          string;
  kullaniciEmail: string;
  adminMesaj:    string;
}) {
  const kisaId = p.talepId.slice(0, 8);
  const url    = `${APP_URL}/iletisim/${p.talepId}`;

  await gonder({
    from:    FROM,
    to:      p.kullaniciEmail,
    replyTo: DESTEK,
    subject: `Re: [#${kisaId}] ${p.konu}`,
    html: sarmalayici(`
      <div class="kart">
        <p class="baslik">💬 Talebine Cevap Geldi</p>
        <p class="altyazi">Talep #${kisaId} · ${p.konu}</p>
        <div class="mesaj-kutu"><p>${p.adminMesaj}</p></div>
        <a href="${url}" class="btn">Talebi Aç →</a>
        <p style="font-size:12px;color:#64748b;margin-top:16px">
          Bu e-postaya cevap yazarak da yanıt verebilirsin.
        </p>
      </div>`),
  });
}

export async function destekYeniMesajAdminBildir(p: {
  talepId:       string;
  konu:          string;
  kullaniciAd:   string;
  kullaniciEmail: string;
  mesaj:         string;
}) {
  const kisaId   = p.talepId.slice(0, 8);
  const adminUrl = `${APP_URL}/admin/destek/${p.talepId}`;

  await gonder({
    from:    FROM,
    to:      DESTEK,
    replyTo: p.kullaniciEmail,
    subject: `[#${kisaId}] Yeni mesaj: ${p.konu}`,
    html: sarmalayici(`
      <div class="kart">
        <p class="baslik">📩 Kullanıcıdan Yeni Mesaj</p>
        <p class="altyazi">Talep #${kisaId} · ${p.kullaniciAd}</p>
        <div class="mesaj-kutu"><p>${p.mesaj}</p></div>
        <a href="${adminUrl}" class="btn">Cevapla →</a>
      </div>`),
  });
}

export async function destekDurumBildir(p: {
  talepId:       string;
  konu:          string;
  kullaniciEmail: string;
  yeniDurum:     string;
}) {
  if (!["cozuldu", "kapali"].includes(p.yeniDurum)) return;
  const url    = `${APP_URL}/iletisim/${p.talepId}`;
  const cozuldu = p.yeniDurum === "cozuldu";

  await gonder({
    from:    FROM,
    to:      p.kullaniciEmail,
    replyTo: DESTEK,
    subject: `${cozuldu ? "✅ Talebiniz çözüldü" : "📁 Talebiniz kapatıldı"} — ${p.konu}`,
    html: sarmalayici(`
      <div class="kart">
        <p class="baslik">${cozuldu ? "✅ Talebiniz Çözüldü" : "📁 Talebiniz Kapatıldı"}</p>
        <p class="altyazi">${p.konu}</p>
        <p style="font-size:14px;color:#94a3b8;margin:0 0 16px">
          ${cozuldu
            ? "Destek talebiniz çözüme kavuşturuldu. Memnuniyetinizi bildirmenizi rica ederiz."
            : "Destek talebiniz kapatıldı. Yeni bir sorunuz olursa her zaman bizimle iletişime geçebilirsiniz."}
        </p>
        <a href="${url}" class="btn">Talebi Görüntüle →</a>
      </div>`),
  });
}
