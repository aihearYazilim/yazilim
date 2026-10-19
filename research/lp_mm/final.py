"""Final evaluation: IS-only fixed picks, walk-forward chains, leverage/timing overlays, top-3 table."""
import numpy as np, pandas as pd
import evaluate as ev
from evaluate import OOS0, OOS1, period_returns, to_try, geo, maxdd, walk_forward, timed, lever

pd.set_option('display.width', 250); pd.set_option('display.max_columns', 30); pd.set_option('display.max_rows', 200)
E = ev.load_all()
exact = [c for c in E.columns if not c.startswith('SYN')]
synth_ok = [c for c in E.columns if c.startswith('SYN') and ('scaled' in c)]
# timing overlay on hedged configs (exact data)
T = {}
for c in exact:
    if c.endswith('h1'):
        for look in (7, 30):
            T[f'{c}|T{look}'] = timed(E[c].dropna(), look).reindex(E.index)
T = pd.DataFrame(T)
ALL = pd.concat([E[exact + synth_ok], T], axis=1)
S = ev.summarize(ALL)
# leverage overlay (monthly, on hedged only): rows computed from period returns
rows = []
for c in [c for c in S.index if '|h1' in c]:
    r = period_returns(ALL[c])
    for L in (2, 3):
        rl = lever(r, L)
        ri = rl[rl.index <= OOS0]; ro = rl[(rl.index > OOS0) & (rl.index <= OOS1)]
        rt = to_try(rl); eqo = (1 + ro).cumprod()
        rows.append(dict(cfg=f'{c}|L{L}', n_is=len(ri), is_usd=geo(ri), oos_usd=geo(ro), is_try=geo(rt[rt.index <= OOS0]),
                         oos_try=geo(rt[rt.index > OOS0]), oos_dd=min(0, (eqo / eqo.cummax() - 1).min()), oos_worst=ro.min(), is_dd=np.nan))
S = pd.concat([S, pd.DataFrame(rows).set_index('cfg')])
S.to_csv(f'{ev.HERE}/out/summary_all.csv')
print('TOTAL COMBOS', len(S), '(exact base configs', len(exact), ', synthetic', len(synth_ok), ', timed', T.shape[1], ')')

elig = S[(S.n_is >= 12)]
print('\n== Best by IS USD geo (n_is>=12), with OOS ==')
print(elig.sort_values('is_usd', ascending=False).head(15).round(4))
print('\n== Best hedged by IS ==')
print(elig[elig.index.str.contains(r'\|h1')].sort_values('is_usd', ascending=False).head(10).round(4))
print('\n== Best OOS (hindsight, for reference only) ==')
print(S.sort_values('oos_usd', ascending=False).head(10).round(4))

# walk-forward over exact-data base configs (+ timed), trailing 24 periods
for name, cands in (('WF exact (all)', exact), ('WF exact hedged + timed', [c for c in exact if c.endswith('h1')] + list(T.columns)),
                    ('WF incl. synthetic', exact + synth_ok)):
    s, picks = walk_forward(ALL, 24, 6, cands)
    ro = s[(s.index > OOS0) & (s.index <= OOS1)]; ri = s[s.index <= OOS0]
    rt = to_try(s)
    eq = (1 + ro).cumprod()
    print(f'\n== {name}: IS geo {geo(ri):.4f}  OOS USD geo {geo(ro):.4f}  OOS TRY geo {geo(rt[rt.index > OOS0]):.4f}  '
          f'OOS maxDD(monthly) {(eq/eq.cummax()-1).min():.4f} worst {ro.min():.4f}')
    print(picks[picks.index > OOS0].value_counts().head(5))

# IS-only pick per family: best IS hedged / unhedged
for lab, msk in (('unhedged', ~elig.index.str.contains(r'\|h1')), ('hedged', elig.index.str.contains(r'\|h1'))):
    best = elig[msk].sort_values('is_usd', ascending=False).head(1)
    print(f'\nIS-chosen {lab}:'); print(best.round(4).to_string())
