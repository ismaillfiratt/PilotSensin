import DbTani from "@/components/ayarlar/DbTani";
import BildirimAyarlari from "@/components/ayarlar/BildirimAyarlari";
import TemaAyarlari from "@/components/ayarlar/TemaAyarlari";
import SifreDegistir from "@/components/ayarlar/SifreDegistir";
import TehlikeZonu from "@/components/ayarlar/TehlikeZonu";
import YasalBilgiler from "@/components/ayarlar/YasalBilgiler";
import SSSAyarlari from "@/components/ayarlar/SSSAyarlari";

export default function AyarlarPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Ayarlar</h1>
        <p className="text-sm text-[#94a3b8] mt-1">
          Bildirim, güvenlik ve uygulama tercihlerini yönet
        </p>
      </div>

      {/* Bildirimler */}
      <BildirimAyarlari />

      {/* Tema */}
      <TemaAyarlari />

      {/* Şifre */}
      <SifreDegistir />

      {/* Sıkça Sorulan Sorular */}
      <SSSAyarlari />

      {/* Yasal & KVKK */}
      <YasalBilgiler />

      {/* Veritabanı tanı */}
      <DbTani />

      {/* Tehlike zonu */}
      <TehlikeZonu />
    </div>
  );
}
