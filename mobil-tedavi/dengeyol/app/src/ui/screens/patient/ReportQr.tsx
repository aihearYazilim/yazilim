/**
 * Hasta raporunun sonundaki ağsız QR (kullanıcı turu 3, F4; k09 Y2, k10 #12): reçete dönemindeki atakların kısa özeti
 * kodun içindedir (core/reportShare.ts). Hekim kendi telefonunun kamerasıyla okutur; klinisyen modunda
 * `/odyolog/ev-raporu/:token` açılır ve rapor aynı hasta koduyla muayeneye "ev dönemi" olarak eklenir. Hiçbir veri bir
 * sunucuya gönderilmez.
 *
 * Kullanım: <ReportQr data={useData()} episodeId={e.id} /> — odaktaki atak reçete dönemindeyse dönemin bütün atakları,
 * değilse yalnız o atak; `episodes` verilirse tam olarak onlar. Raporlanacak atak yoksa hiçbir şey çizmez.
 */
import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';
import { buildHomeReport, encodeHomeReport, homeReportUrl } from '../../../core/reportShare';
import { formatDate } from '../../../state/episodes';
import type { AppData, Episode } from '../../../state/types';
import { Icon } from '../../components/Icon';

export interface ReportQrProps {
  data: AppData;
  /** Rapor sayfasındaki atak (dönem bu atağa göre seçilir). */
  episodeId?: string;
  /** Verilirse dönem seçimi yapılmaz, yalnız bu ataklar kodlanır. */
  episodes?: Episode[];
  /** Testler için sabit zaman. */
  now?: number;
}

export function ReportQr({ data, episodeId, episodes, now }: ReportQrProps) {
  const enc = useMemo(() => {
    const report = buildHomeReport(data, { now: now ?? Date.now(), focusEpisodeId: episodeId, episodes });
    if (report.episodes.length === 0) return null;
    return encodeHomeReport(report);
  }, [data, episodeId, episodes, now]);
  const url = enc ? homeReportUrl(window.location.href, enc.token) : null;
  const [svg, setSvg] = useState<string | null>(null);
  const [big, setBig] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSvg(null);
    if (!url) return;
    let alive = true;
    // Hata düzeltme "L": ekrandan okunan kodda en çok veri sığar (kod büyük ve sık kalmasın).
    QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'L' })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(null));
    return () => {
      alive = false;
    };
  }, [url]);

  if (!enc || !url) return null;
  const r = enc.report;
  const n = r.episodes.length;
  const ms = r.episodes.reduce((k, e) => k + e.maneuvers.length, 0);
  const period = data.patient?.prescription && r.rx ? 'Reçete dönemi' : 'Dönem';
  const cut: string[] = [];
  if (r.stepsDropped) cut.push('adım ayrıntıları');
  if (r.episodesOmitted) cut.push(`en eski ${r.episodesOmitted} atak`);
  if (r.maneuversOmitted) cut.push(`en eski ${r.maneuversOmitted} manevra`);

  return (
    <div className="card stack center" data-testid="report-qr">
      <div className="card-title">
        <Icon name="qr" />
        <h3>Hekiminize QR kodla gösterin</h3>
      </div>
      <p className="small">
        Muayenede hekiminize gösterin; internet gerekmez. Hekiminiz bu kodu kendi telefonunun kamerasıyla okutur. Rapor kodun içindedir, hiçbir
        yere gönderilmez.
      </p>
      <p className="small muted" data-testid="report-qr-summary">
        {period} {formatDate(r.period.from)} – {formatDate(r.period.to)}: {n} atak, {ms} manevra
        {r.pid ? ` · hasta kodu ${r.pid}` : ''}
      </p>
      {svg ? (
        <div
          className="qr"
          style={{ width: big ? '100%' : 'min(320px, 100%)' }}
          dangerouslySetInnerHTML={{ __html: svg }}
          role="img"
          aria-label="Hekim için rapor QR kodu"
          data-testid="report-qr-code"
        />
      ) : null}
      {svg && (
        <button className="btn ghost" onClick={() => setBig((b) => !b)} data-testid="report-qr-zoom">
          {big ? 'Kodu küçült' : 'Kodu büyüt'}
        </button>
      )}
      {cut.length > 0 && (
        <p className="small muted" data-testid="report-qr-truncated">
          Kod okunabilir kalsın diye {cut.join(', ')} koda konmadı. Ayrıntılı raporu metin olarak da gönderebilirsiniz.
        </p>
      )}
      <div className="row wrap" style={{ justifyContent: 'center' }}>
        <button
          className="btn secondary"
          onClick={() => {
            void navigator.clipboard?.writeText(url).then(() => setCopied(true));
          }}
          data-testid="report-qr-copy"
        >
          <Icon name="copy" /> {copied ? 'Kopyalandı' : 'Hekim bağlantısını kopyala'}
        </button>
        {'share' in navigator && (
          <button className="btn secondary" onClick={() => void navigator.share({ title: 'DengeYol ev dönemi raporu', url }).catch(() => undefined)}>
            <Icon name="share" /> Paylaş
          </button>
        )}
      </div>
    </div>
  );
}
