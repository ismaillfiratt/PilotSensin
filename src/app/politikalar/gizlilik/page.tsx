export const metadata = { title: "Gizlilik Politikası – Pilot Sensin" };

export default function GizlilikPage() {
  return (
    <article className="prose-custom">
      <h1>Gizlilik Politikası</h1>
      <p className="lead">
        Pilot Sensin olarak gizliliğinize önem veriyoruz. Bu politika, Platform&apos;u
        kullanırken verilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu
        açıklamaktadır.
      </p>

      <section>
        <h2>1. Toplanan Veriler</h2>
        <p>
          <strong>Hesap verileri:</strong> Kayıt olurken sağladığınız ad, soyad,
          e-posta adresi ve işletme bilgileri.
        </p>
        <p>
          <strong>Kullanım verileri:</strong> Platform ile etkileşimleriniz,
          sayfa görüntülemeleri, oturum süreleri ve özellik kullanımı gibi
          anonim istatistikler.
        </p>
        <p>
          <strong>Teknik veriler:</strong> IP adresi, tarayıcı türü ve versiyonu,
          işletim sistemi, referans URL.
        </p>
        <p>
          <strong>İşletme verileri:</strong> Nakit akışı, stok, görevler ve
          prosedürler gibi siz giren tüm veriler yalnızca size aittir.
        </p>
      </section>

      <section>
        <h2>2. Verileri Nasıl Kullanıyoruz</h2>
        <ul>
          <li>Platform hizmetlerini sağlamak ve sürdürmek</li>
          <li>Hesabınızı yönetmek ve kimliğinizi doğrulamak</li>
          <li>Teknik destek ve müşteri hizmetleri sunmak</li>
          <li>Hizmet kalitesini iyileştirmek</li>
          <li>
            Açık rızanız olması halinde ürün güncellemeleri ve duyurular göndermek
          </li>
          <li>Yasal yükümlülükleri yerine getirmek</li>
        </ul>
      </section>

      <section>
        <h2>3. Veri Güvenliği</h2>
        <p>
          Verileriniz şifrelenmiş bağlantılar (TLS/HTTPS) üzerinden iletilir.
          Supabase altyapısı, endüstri standardı güvenlik önlemleriyle korunmaktadır.
          Şifreniz hiçbir zaman düz metin olarak saklanmaz; güvenli hash
          algoritmaları kullanılır.
        </p>
        <p>
          Güvenlik ihlali şüphesi halinde, ilgili mevzuat kapsamında sizi
          derhal bilgilendireceğiz.
        </p>
      </section>

      <section>
        <h2>4. Çerezler ve Yerel Depolama</h2>
        <p>
          Platform, temel işlevselliği sağlamak amacıyla oturum çerezleri ve
          tarayıcının yerel depolama alanını (localStorage) kullanır.
          Bu veriler; tema tercihiniz, bildirim ayarlarınız ve oturum durumunuz
          gibi bilgileri içerir. Üçüncü taraf reklamcılık çerezi kullanılmaz.
        </p>
      </section>

      <section>
        <h2>5. Üçüncü Taraf Hizmetler</h2>
        <p>
          Platform, aşağıdaki üçüncü taraf altyapılarından yararlanmaktadır:
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> – Kimlik doğrulama ve veri depolama
          </li>
          <li>
            <strong>Vercel</strong> – Platform barındırma
          </li>
        </ul>
        <p>
          Bu hizmetlerin kendi gizlilik politikaları mevcuttur. Verileriniz
          bu sağlayıcılar aracılığıyla işlenmekte ancak üçüncü taraflara
          satılmamaktadır.
        </p>
      </section>

      <section>
        <h2>6. Veri Sahipliği</h2>
        <p>
          Platform&apos;a girdiğiniz tüm işletme verileri (nakit akışı, stok,
          görevler, prosedürler vb.) <strong>yalnızca size aittir</strong>.
          Bu verileri analiz, pazarlama veya üçüncü taraflarla paylaşım amacıyla
          kullanmıyoruz.
        </p>
      </section>

      <section>
        <h2>7. Veri Silme</h2>
        <p>
          Hesabınızı istediğiniz zaman silebilirsiniz. Silme işlemi, kişisel
          verilerinizi kalıcı olarak kaldırır. Yasal saklama yükümlülüğü
          gerektiren veriler ilgili süre sonunda silinir.
        </p>
      </section>

      <section>
        <h2>8. Politika Değişiklikleri</h2>
        <p>
          Bu politikada önemli değişiklik yapıldığında, kayıtlı e-posta
          adresinize bildirim gönderilecektir. Güncellenmiş politika, yayın
          tarihinden itibaren geçerli olacaktır.
        </p>
      </section>

      <section>
        <h2>9. İletişim</h2>
        <p>
          Gizlilik konusundaki sorularınız için:{" "}
          <a href="mailto:gizlilik@pilotsensin.com">gizlilik@pilotsensin.com</a>
        </p>
      </section>

      <p className="meta">Son güncelleme: Mayıs 2025</p>
    </article>
  );
}
