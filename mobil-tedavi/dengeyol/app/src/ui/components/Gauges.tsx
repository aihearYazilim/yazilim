/**
 * Baş yönü göstergesi.
 * Telefon alında, ekran dışa bakar. Ekran düz dururken ona karşıdan bakan kişi için hastanın SAĞI ekranın SOLUNDADIR;
 * bu yüzden çizim de karşıdan bakış (ayna) olarak yapılır: etiketler ve burun oku telefonun fiziksel olarak durduğu yere
 * göre doğru yönü gösterir. Ekran 180° çevrildiğinde (başucundaki yardımcı/klinisyen) tepeden bakış kullanılır: döndürülmüş
 * ekranda bu da fiziksel olarak doğru yöne denk gelir.
 * Burun yönü θ'yı gösterir: yukarı = yüz tavana, hastanın sağına = sağ kulak altta, aşağı = yüz yere.
 * Oturur adımlar: yandan görünüm, çene eğimi ψ.
 */
import type { HeadPose } from '../../core/geometry';
import type { Target } from '../../core/protocols';

const C = 120;
const R_HEAD = 46;
const R_TARGET = 92;

function polar(angleDeg: number, r: number) {
  // 0° = yukarı, saat yönünde pozitif
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
}

function arcPath(from: number, to: number, r: number) {
  const p1 = polar(from, r);
  const p2 = polar(to, r);
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  return `M ${C} ${C} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y} Z`;
}

export function HeadGauge({
  target,
  pose,
  inRange,
  flipped = false
}: {
  target: Target;
  pose: HeadPose | null;
  inRange: boolean;
  /** Ekran 180° çevrik mi (tepeden bakış). Değilse karşıdan bakış: hastanın sağı ekranın solu. */
  flipped?: boolean;
}) {
  if (target.kind === 'sitting') return <SittingGauge target={target} pose={pose} inRange={inRange} />;
  const lying = pose && pose.tiltFromUpright >= 45;
  // Çizim açısı: tepeden bakışta θ, karşıdan bakışta (ayna) −θ.
  const k = flipped ? 1 : -1;
  const rawTheta = lying ? pose!.theta : null;
  const theta = rawTheta !== null ? k * rawTheta : null;
  const tgtFrom = Math.min(k * (target.theta - target.thetaTol), k * (target.theta + target.thetaTol));
  const tgtTo = Math.max(k * (target.theta - target.thetaTol), k * (target.theta + target.thetaTol));
  const nose = theta !== null ? polar(theta, R_HEAD + 18) : null;
  const noseL = theta !== null ? polar(theta - 16, R_HEAD - 2) : null;
  const noseR = theta !== null ? polar(theta + 16, R_HEAD - 2) : null;
  const earR = theta !== null ? polar(theta + 90, R_HEAD) : null;
  const earL = theta !== null ? polar(theta - 90, R_HEAD) : null;
  const tgtMark = polar(k * target.theta, R_TARGET + 4);
  const turn = (t: number) => (Math.abs(t) <= 3 ? 'düz' : `${t > 0 ? 'sağa' : 'sola'} ${Math.round(Math.abs(t))}°`);
  const rightX = flipped ? 232 : 8;
  const leftX = flipped ? 8 : 232;
  return (
    <svg
      viewBox="0 0 240 240"
      width="100%"
      style={{ maxWidth: 260 }}
      role="img"
      aria-label={`Baş yönü: ${rawTheta !== null ? turn(rawTheta) : 'ölçülmüyor'}; hedef ${turn(target.theta)}`}
    >
      <circle cx={C} cy={C} r={R_TARGET + 18} fill="var(--gauge-bg)" />
      <path d={arcPath(tgtFrom, tgtTo, R_TARGET + 14)} fill="var(--gauge-target)" />
      <line x1={C} y1={C} x2={tgtMark.x} y2={tgtMark.y} stroke="var(--gauge-target-line)" strokeWidth={2} strokeDasharray="4 5" />
      {/* Yön etiketleri */}
      <text x={C} y={18} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--muted)">YÜZ TAVANA</text>
      <text x={C} y={234} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--muted)">YÜZ YERE</text>
      <text x={rightX} y={C - 4} textAnchor={flipped ? 'end' : 'start'} fontSize="10" fontWeight="700" fill="var(--muted)">HASTANIN</text>
      <text x={rightX} y={C + 9} textAnchor={flipped ? 'end' : 'start'} fontSize="12" fontWeight="800" fill="var(--text)">SAĞI</text>
      <text x={leftX} y={C - 4} textAnchor={flipped ? 'start' : 'end'} fontSize="10" fontWeight="700" fill="var(--muted)">HASTANIN</text>
      <text x={leftX} y={C + 9} textAnchor={flipped ? 'start' : 'end'} fontSize="12" fontWeight="800" fill="var(--text)">SOLU</text>
      {theta !== null && nose && noseL && noseR && earL && earR ? (
        <g>
          <circle cx={earL.x} cy={earL.y} r={9} fill="var(--gauge-head)" stroke="var(--gauge-head-line)" strokeWidth={2} />
          <circle cx={earR.x} cy={earR.y} r={9} fill="var(--gauge-head)" stroke="var(--gauge-head-line)" strokeWidth={2} />
          <circle cx={C} cy={C} r={R_HEAD} fill="var(--gauge-head)" stroke={inRange ? 'var(--ok)' : 'var(--gauge-head-line)'} strokeWidth={3} />
          <path
            d={`M ${noseL.x} ${noseL.y} L ${nose.x} ${nose.y} L ${noseR.x} ${noseR.y} Z`}
            fill={inRange ? 'var(--ok)' : 'var(--warn)'}
          />
          <text x={C} y={C + 6} textAnchor="middle" fontSize="15" fontWeight="800" fill="var(--text)">
            {turn(rawTheta!)}
          </text>
        </g>
      ) : (
        <g>
          <circle cx={C} cy={C} r={R_HEAD} fill="var(--gauge-head)" stroke="var(--gauge-head-line)" strokeWidth={3} strokeDasharray="6 6" />
          <text x={C} y={C + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--muted)">
            {pose ? 'Yatın' : 'Sensör yok'}
          </text>
        </g>
      )}
    </svg>
  );
}

function SittingGauge({ target, pose, inRange }: { target: Extract<Target, { kind: 'sitting' }>; pose: HeadPose | null; inRange: boolean }) {
  const upright = pose && pose.tiltFromUpright <= 55;
  const psi = upright ? pose!.psi : null;
  // Yandan görünüm: baş öne eğildikçe saat yönünde döner
  const from = target.psiMin;
  const to = target.psiMax;
  return (
    <svg viewBox="0 0 240 240" width="100%" style={{ maxWidth: 260 }} role="img" aria-label="Oturuş ve çene eğimi göstergesi">
      <circle cx={C} cy={C} r={R_TARGET + 18} fill="var(--gauge-bg)" />
      <path d={arcPath(from, to, R_TARGET + 14)} fill="var(--gauge-target)" />
      <text x={C} y={18} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--muted)">DİK</text>
      <text x={228} y={C + 4} textAnchor="end" fontSize="11" fontWeight="700" fill="var(--muted)">ÇENE AŞAĞI</text>
      <text x={12} y={C + 4} textAnchor="start" fontSize="11" fontWeight="700" fill="var(--muted)">YUKARI</text>
      {psi !== null ? (
        <g transform={`rotate(${psi} ${C} ${C})`}>
          <ellipse cx={C} cy={C} rx={40} ry={R_HEAD} fill="var(--gauge-head)" stroke={inRange ? 'var(--ok)' : 'var(--gauge-head-line)'} strokeWidth={3} />
          <path d={`M ${C + 36} ${C - 6} L ${C + 54} ${C + 6} L ${C + 34} ${C + 14} Z`} fill={inRange ? 'var(--ok)' : 'var(--warn)'} />
          <line x1={C} y1={C - R_HEAD} x2={C} y2={C - R_HEAD - 22} stroke="var(--gauge-head-line)" strokeWidth={3} strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <ellipse cx={C} cy={C} rx={40} ry={R_HEAD} fill="var(--gauge-head)" stroke="var(--gauge-head-line)" strokeWidth={3} strokeDasharray="6 6" />
          <text x={C} y={C + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--muted)">
            {pose ? 'Oturun' : 'Sensör yok'}
          </text>
        </g>
      )}
    </svg>
  );
}

/** Sarkıklık (ekstansiyon) çubuğu: −60° (çene göğse) … +60° (baş sarkık). */
export function HangBar({ target, pose }: { target: Target; pose: HeadPose | null }) {
  if (target.kind !== 'lying') return null;
  const lo = -60;
  const hi = 60;
  const pct = (v: number) => ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * 100;
  const phi = pose && pose.tiltFromUpright >= 45 ? pose.phi : null;
  const inBand = phi !== null && phi >= target.phiMin && phi <= target.phiMax;
  return (
    <div aria-label="Baş sarkıklığı" style={{ width: '100%' }}>
      <div className="row small muted" style={{ justifyContent: 'space-between' }}>
        <span>Çene göğse</span>
        <span>Baş sarkıklığı</span>
        <span>Geriye sarkık</span>
      </div>
      <div style={{ position: 'relative', height: 16, background: 'var(--gauge-bg)', borderRadius: 999, marginTop: 4 }}>
        <div
          style={{
            position: 'absolute',
            left: `${pct(target.phiMin)}%`,
            width: `${pct(target.phiMax) - pct(target.phiMin)}%`,
            top: 0,
            bottom: 0,
            background: 'var(--gauge-target)',
            borderRadius: 999
          }}
        />
        {phi !== null && (
          <div
            style={{
              position: 'absolute',
              left: `calc(${pct(phi)}% - 9px)`,
              top: -3,
              width: 18,
              height: 22,
              borderRadius: 7,
              background: inBand ? 'var(--ok)' : 'var(--warn)',
              boxShadow: 'var(--shadow)'
            }}
          />
        )}
      </div>
    </div>
  );
}

export function HoldRing({ value, max, label, sub }: { value: number; max: number; label: string; sub?: string }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const frac = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <svg viewBox="0 0 120 120" width={116} height={116} role="img" aria-label={`${label} ${sub ?? ''}`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--gauge-bg)" strokeWidth="11" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray={`${circ * frac} ${circ}`}
        transform="rotate(-90 60 60)"
      />
      <text x="60" y="62" textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--text)">
        {label}
      </text>
      {sub && (
        <text x="60" y="82" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--muted)">
          {sub}
        </text>
      )}
    </svg>
  );
}
