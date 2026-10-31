/**
 * Hastanın QR/bağlantıyla getirdiği ev dönemi raporunun okunur özeti (içe aktarma ekranı ve muayene raporu kullanır).
 */
import type { HomeReport } from '../../../core/reportShare';
import { sideName } from '../../../core/protocols';
import { Icon } from '../../components/Icon';
import {
  homeEpisodeTitle,
  homeManeuverText,
  homePeriodText,
  homeReportHeadline,
  homeRetestText,
  homeSideTestText,
  homeStepText,
  homeTruncationText,
  shortDate
} from './examReport';

const time = (t: number) =>
  new Date(t).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export function HomeReportView({ report, rxNote, testId = 'home-report' }: { report: HomeReport; rxNote?: string | null; testId?: string }) {
  const trunc = homeTruncationText(report);
  return (
    <div className="card stack home-report" data-testid={testId}>
      <h3>Ev dönemi · {homePeriodText(report)}</h3>
      <dl className="kv">
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
        <dt>Rapor oluşturma</dt>
        <dd>{shortDate(new Date(report.generatedAt))}</dd>
      </dl>
      <p data-testid={`${testId}-headline`}>
        <strong>{homeReportHeadline(report)}</strong>
      </p>
      {trunc && (
        <div className="notice info" data-testid={`${testId}-truncated`}>
          <Icon name="info" />
          <span>{trunc}</span>
        </div>
      )}
      {report.episodes.map((e, i) => (
        <div key={`${e.startedAt}-${i}`} className="stack" style={{ gap: 4 }}>
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
            {e.sideTests.length + e.maneuvers.length + e.retests.length === 0 && <li>Test ya da manevra kaydı yok.</li>}
          </ul>
        </div>
      ))}
      <p className="small muted">Hastanın kendi telefonundaki kayıttır (hasta beyanı); klinik muayene bulgusu yerine geçmez.</p>
    </div>
  );
}
