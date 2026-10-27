import { PROTOCOLS } from '../../core/protocols';
import { Screen } from '../components/Screen';

export function About() {
  const sources = Array.from(new Set(Object.values(PROTOCOLS).flatMap((p) => p.sources)));
  return (
    <Screen title="Hakkında" back={true}>
      <section className="card stack">
        <h2>DengeYol nedir?</h2>
        <p>
          DengeYol, iyi huylu paroksismal pozisyonel vertigo (BPPV) için yapılan repozisyon manevralarını telefonun hareket sensörüyle yönlendiren bir
          rehberdir. Telefon alına yaslandığında başın yerçekimine göre açısını ölçer; her adımda hedef açıya gelinince sesle ve titreşimle haber verir.
        </p>
        <p>
          <strong>Hasta modu</strong>, daha önce hekim ya da odyolog tarafından BPPV tanısı konmuş kişilerin atak tekrarladığında evde manevrayı doğru yapmasına
          yardım eder. <strong>Odyolog modu</strong>, klinikte pozisyon testlerini ve manevraları açı ölçümüyle yapmayı, bulguları kaydetmeyi ve hastaya ev
          reçetesi vermeyi sağlar.
        </p>
      </section>
      <section className="card tint-warn stack">
        <h3>Önemli uyarılar</h3>
        <ul style={{ margin: 0, paddingLeft: 20 }} className="stack">
          <li>DengeYol tanı koymaz; hekim muayenesinin yerine geçmez.</li>
          <li>Sürekli baş dönmesi, çift görme, konuşma bozukluğu, güçsüzlük, şiddetli baş ağrısı ya da göğüs ağrısında uygulamayı kullanmayın; 112'yi arayın.</li>
          <li>Manevra sırasında baş dönmesi ve bulantı olabilir. Düşmemek için yatakta, yanınızda biri varken yapmanız önerilir.</li>
          <li>Bu yazılım bir araştırma prototipidir; tıbbi cihaz olarak onaylanmamıştır. Klinik kullanım öncesinde klinik doğrulama ve yasal uygunluk değerlendirmesi gerekir.</li>
        </ul>
      </section>
      <section className="card stack">
        <h3>Gizlilik</h3>
        <p className="small">
          Uygulama hiçbir veriyi internete göndermez. Sensör verileri yalnızca anlık açı hesabı için kullanılır, kaydedilmez. Manevra özetleri ve yanıtlarınız
          yalnızca bu cihazın tarayıcı deposunda tutulur; Ayarlar'dan silebilirsiniz.
        </p>
      </section>
      <section className="card stack">
        <h3>Klinik kaynaklar</h3>
        <ul style={{ margin: 0, paddingLeft: 20 }} className="small stack">
          {sources.map((s) => (
            <li key={s}>{s}</li>
          ))}
          <li>Kim HJ ve ark. JAMA Neurol 2023;80:244–250 (kendi kendine manevra, randomize kontrollü çalışma).</li>
        </ul>
      </section>
      <p className="small muted center">DengeYol sürüm {__APP_VERSION__}</p>
    </Screen>
  );
}
