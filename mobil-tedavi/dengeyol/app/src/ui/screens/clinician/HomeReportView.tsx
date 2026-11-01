/**
 * Hastanın QR/bağlantıyla getirdiği ev dönemi raporunun okunur özeti (içe aktarma ekranı ve muayene raporu kullanır).
 */
import { homeReportHasResearch, type HomeReport } from '../../../core/reportShare';
import { sideName } from '../../../core/protocols';
import { Icon } from '../../components/Icon';
import { RESEARCH_GROUP_TITLE, researchLineText } from '../patient/reportText';
import {
  homeContraText,
  homeEpisodeTitle,
  homeManeuverText,
  homePeriodText,
  homeRedFlagText,
  homeReportAdvice,
  homeReportHeadline,
  homeResearchEntries,
  homeRetestText,
  homeSideTestText,
  homeStepText,
  homeTestStopText,
  homeTruncationText,
  homeVersionText,
  shortDate
} from './examReport';

const time = (t: number) =>
  new Date(t).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export function HomeReportView({
  report,
  rxNote,
  testId = 'home-report',
  printCompact = false
}: {
  report: HomeReport;
  rxNote?: string | null;
  testId?: string;
  /**
   * Basılı muayene raporunda kısa özet: atak/test/manevra ayrıntısı yazdırılmaz (ekranda ve HBYS notunda kalır). Ev dönemi
   * ekliyken rapor tek sayfada kalsın; reçete, QR ve imza 2. sayfaya yalnız düşmesin (kullanıcı turu 4, k08).
   */
  printCompact?: boolean;
}) {
  const trunc = homeTruncationText(report);
  const advice = homeReportAdvice(report);
  return (
    <div className="card stack home-report" data-testid={testId}>
      <h3>Ev dönemi · {homePeriodText(report)}</h3>
      {printCompact && (
        // Basılı özet: kodlar tek satırda (reçete ayrıntısı raporun reçete bölümünde zaten var).
        <p className="small print-only" data-testid={`${testId}-print-codes`}>
          Rapordaki hasta kodu: {report.pid ?? '—'}
          {report.rxCode ? ` · reçete kodu: ${report.rxCode}${rxNote ? ` (${rxNote})` : ''}` : ''}
        </p>
      )}
      <dl className={`kv${printCompact ? ' no-print' : ''}`}>
        <dt>Rapordaki hasta kodu</dt>
        <dd className="exam-code-value">{report.pid ?? '— (reçetesiz ya da kodsuz)'}</dd>
        {report.rxCode && (
          <>
            <dt>Reçete kodu</dt>
            <dd>
              {report.rxCode}
              {rxNote ? <span className="small muted"> · {rxNote}</span> : null}
            </dd>
          </>
        )}
        {report.rx && (
          <>
            <dt>Reçete</dt>
            <dd>
              {sideName(report.rx.side).toLocaleUpperCase('tr-TR')} · {report.rx.maneuver === 'epley' ? 'Epley' : 'Semont'} · günde en fazla{' '}
              {report.rx.perDay}, {report.rx.days} gün · {report.rx.date.split('-').reverse().join('.')}
            </dd>
          </>
        )}
        {report.studyId && (
          <>
            <dt>Çalışma katılımcı no</dt>
            <dd data-testid={`${testId}-study-id`}>{report.studyId}</dd>
          </>
        )}
        <dt>Rapor oluşturma</dt>
        <dd>{shortDate(new Date(report.generatedAt))}</dd>
      </dl>
      <p data-testid={`${testId}-headline`}>
        <strong>{homeReportHeadline(report)}</strong>
      </p>
      {/* Tek cümle klinik öneri (yeni kullanıcı turu 1, y08 #3): karar desteği, hasta beyanına dayanır. */}
      <div className="notice info" data-testid={`${testId}-advice`}>
        <Icon name="info" />
        <span>
          <strong>Öneri:</strong> {advice}
        </span>
      </div>
      {trunc && (
        <div className="notice info" data-testid={`${testId}-truncated`}>
          <Icon name="info" />
          <span>{trunc}</span>
        </div>
      )}
      {printCompact && (
        <p className="small print-only" data-testid={`${testId}-print-note`}>
          Hasta beyanıdır; muayene bulgusu yerine geçmez. Atak/test/manevra ayrıntısı uygulamadaki raporda ve HBYS notunda.
        </p>
      )}
      {report.episodes.map((e, i) => (
        <div key={`${e.startedAt}-${i}`} className={`stack${printCompact ? ' home-report-detail' : ''}`} style={{ gap: 4 }}>
          <strong>
            {homeEpisodeTitle(e)}
            {e.rxShortcut ? ' · reçeteli kısa yol (taraf testi yapılmadı)' : ''}
          </strong>
          <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
            {e.sideTests.map((t, j) => (
              <li key={`t${j}`}>
                Taraf testi {time(t.at)}: {homeSideTestText(t)}
              </li>
            ))}
            {e.maneuvers.map((m, j) => (
              <li key={`m${j}`}>
                Manevra {time(m.at)}: {homeManeuverText(m)}
                {m.steps && m.steps.length > 0 && (
                  <table className="table" data-testid={`${testId}-steps`}>
                    <tbody>
                      {m.steps.map((st, k) => (
                        <tr key={k}>
                          <td>{st.title}</td>
                          <td>{homeStepText(st)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </li>
            ))}
            {e.retests.map((r, j) => (
              <li key={`r${j}`}>
                Tekrar test {time(r.at)}: {homeRetestText(r)}
              </li>
            ))}
            {(e.testStops ?? []).map((t, j) => (
              // Biçim v2 (kullanıcı turu 6): "Kendimi kötü hissediyorum" ile durdurulan test; yarım test sonuç sayılmaz.
              <li key={`y${j}`} data-testid={`${testId}-test-stop`}>
                Testte durdurma {time(t.at)}: {homeTestStopText(t)}
              </li>
            ))}
            {e.sideTests.length + e.maneuvers.length + e.retests.length + (e.testStops?.length ?? 0) === 0 && <li>Test ya da manevra kaydı yok.</li>}
          </ul>
        </div>
      ))}
      <ResearchSection report={report} testId={testId} printCompact={printCompact} />
      <p className={`small muted${printCompact ? ' no-print' : ''}`}>
        Hastanın kendi telefonundaki kayıttır (hasta beyanı); klinik muayene bulgusu yerine geçmez.
      </p>
    </div>
  );
}

/**
 * Araştırma kaydı (biçim v3; yeni kullanıcı turu 1, y04 #1, y05 #7): kayıt kaynağı (sürüm, demo), kontrendikasyonlar,
 * işaretlenen güvenlik soruları, kullanıcının aştığı uyarılar, uygulamanın kararları, seçimler ve bilgi kayıtları. Eski
 * uygulamanın raporunda (sürüm yok) kaydın bilinmediği açıkça yazılır.
 */
function ResearchSection({ report, testId, printCompact }: { report: HomeReport; testId: string; printCompact: boolean }) {
  const cls = `stack${printCompact ? ' home-report-detail' : ''}`;
  if (!homeReportHasResearch(report)) {
    return (
      <div className={cls} style={{ gap: 4 }} data-testid={`${testId}-research`}>
        <strong>Araştırma kaydı</strong>
        <p className="small muted" data-testid={`${testId}-research-none`}>
          Bu rapor araştırma kaydı taşımayan eski bir uygulama sürümüyle üretildi: aşılan uyarılar ve güvenlik yanıtları bilinmiyor.
          Hastadan uygulamasını güncelleyip raporu yeniden göstermesini isteyin.
        </p>
      </div>
    );
  }
  const ver = homeVersionText(report);
  const contra = homeContraText(report);
  const demo = report.episodes.filter((e) => e.simulation).length;
  return (
    <div className={cls} style={{ gap: 6 }} data-testid={`${testId}-research`}>
      <strong>Araştırma kaydı</strong>
      <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
        {ver && <li data-testid={`${testId}-version`}>Kayıt: {ver}</li>}
        {demo > 0 && (
          <li data-testid={`${testId}-demo`}>
            <strong>DEMO MODU</strong> (sanal sensör): {demo === report.episodes.length ? 'bütün ataklar' : `${demo} atak`}; eğitim/deneme kaydı, gerçek tedavi
            değil.
          </li>
        )}
        <li data-testid={`${testId}-contra`}>Kurulumda işaretlenen sağlık durumu: {contra ?? 'yok'}</li>
        {report.overrideDetailsDropped && <li>QR kodu küçük kalsın diye kayıt açıklamaları çıkarıldı (kodlar duruyor).</li>}
      </ul>
      {report.episodes.map((e, i) => {
        const entries = homeResearchEntries(e);
        const flags = e.redFlags ?? [];
        const ov = entries.filter((x) => x.group === 'override');
        const n = ov.reduce((k, x) => k + x.count, 0);
        return (
          <div key={`r${e.startedAt}-${i}`} className="stack" style={{ gap: 2 }} data-testid={`${testId}-research-episode`}>
            <span className="small">
              <strong>Atak {time(e.startedAt)}</strong>
              {e.simulation ? ' · demo' : ''}
              {e.appVersion || e.rulesVersion ? ` · ${[e.appVersion, e.rulesVersion].filter(Boolean).join(' / ')}` : ''}
            </span>
            <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
              {flags.map((f, j) => (
                <li key={`f${j}`} data-testid={`${testId}-redflag`}>
                  Güvenlik sorusu {time(f.at)}: {homeRedFlagText(f)}
                </li>
              ))}
              <li data-testid={`${testId}-override-count`}>
                {RESEARCH_GROUP_TITLE.override}: {n || 'yok'}
              </li>
              {ov.map((x, j) => (
                <li key={`o${j}`} data-testid={`${testId}-override`} style={{ listStyle: 'none' }}>
                  – {researchLineText(x)}
                </li>
              ))}
              {(['decision', 'info'] as const).map((g) => {
                const xs = entries.filter((x) => x.group === g);
                if (!xs.length) return null;
                return (
                  <li key={g} data-testid={`${testId}-research-${g}`}>
                    {RESEARCH_GROUP_TITLE[g]}:
                    <ul style={{ margin: 0, paddingLeft: 14 }}>
                      {xs.map((x, j) => (
                        <li key={j}>{researchLineText(x)}</li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
