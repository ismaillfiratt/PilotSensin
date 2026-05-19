import Link from "next/link";
import { Trash2, ChevronRight, MessageCircle } from "lucide-react";
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
        <h1 className="text-2xl font-bold text-gray-800">Ayarlar</h1>
        <p className="text-sm text-gray-400 mt-1">
          Bildirim, güvenlik ve uygulama tercihlerini yönet
        </p>
      </div>

      {/* Çöp Kutusu */}
      <Link
        href="/ayarlar/cop-kutusu"
        className="flex items-center gap-4 px-5 py-4 card rounded-2xl hover:bg-gray-100 transition-colors group"
      >
        <div className="w-9 h-9 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] flex items-center justify-center shrink-0">
          <Trash2 className="w-4 h-4 text-[#ef4444]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">Çöp Kutusu</p>
          <p className="text-xs text-gray-500">Silinen kayıtları görüntüle ve geri yükle</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-400 transition-colors" />
      </Link>

      {/* İletişim & Destek */}
      <Link
        href="/iletisim"
        className="flex items-center gap-4 px-5 py-4 card rounded-2xl hover:bg-gray-100 transition-colors group"
      >
        <div className="w-9 h-9 rounded-xl bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] flex items-center justify-center shrink-0">
          <MessageCircle className="w-4 h-4 text-[#3b82f6]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">İletişim & Destek</p>
          <p className="text-xs text-gray-500">Soru, hata ve önerini bize ilet</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-400 transition-colors" />
      </Link>

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
