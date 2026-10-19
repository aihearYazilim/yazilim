"""VİOP option premium-selling simulator (daily MTM on settlement prices).
Positions: list of legs {key:(exp,cp,K), q (units of underlying, +long/-short)}.
Equity = cash + sum(q*px). Cash earns ON deposit net (deposit_v5) on (equity - margin*(1-nema)).
"""
import numpy as np, pandas as pd, lib
from scipy.stats import norm
OOS0 = pd.Timestamp('2025-10-17'); OOS1 = pd.Timestamp('2026-10-16')
MULT = {'XU030': 10.0, 'USDTRY': 1000.0}  # TL per unit-of-price per contract (post-2020 XU030 scale)
A = {'XU030': 0.12, 'USDTRY': 0.11}        # scan range for margin approx
FUTCOST = 0.0004  # futures half-spread + commission per side

class Data:
    def __init__(self, root):
        self.root = root
        o = pd.read_pickle(lib.D / f'data/opt_{root}.pkl')
        o = o[o.date >= '2017-03-01']
        self.o = o
        self.dates = pd.DatetimeIndex(sorted(o.date.unique()))
        self.px = {(d, e, c, k): p for d, e, c, k, p in zip(o.date, o.exp, o.cp, o.K, o.px)}
        self.byday = {d: g for d, g in o.groupby('date')}
        fut = o[['date', 'exp', 'F']].drop_duplicates(['date', 'exp'])
        self.F = {(d, e): f for d, e, f in zip(fut.date, fut.exp, fut.F)}
        # traded in last 5 days flag
        o2 = o[['date', 'exp', 'cp', 'K', 'qty']].copy()
        o2['di'] = self.dates.get_indexer(o2.date)
        tr = o2[o2.qty > 0]
        self.traded = {}
        for di, e, c, k in zip(tr.di, tr.exp, tr.cp, tr.K):
            for j in range(di, di + 5): self.traded[(j, e, c, k)] = True
        atm = pd.read_pickle(lib.D / f'data/atm_{root}.pkl')['iv'].reindex(self.dates).ffill()
        self.atm = atm
        self.atm_med = atm.rolling(252, min_periods=120).median()
        # trailing realized vol of front futures (20d)
        front = fut[fut.exp > fut.date].sort_values(['date', 'exp']).groupby('date').first()
        pf = o[['date', 'exp', 'F']].drop_duplicates(['date', 'exp']).set_index(['date', 'exp']).F
        lr = []
        prevd = None
        for d, r in front.iterrows():
            if prevd is not None and (prevd, r.exp) in pf.index: lr.append(np.log(r.F / pf[(prevd, r.exp)]))
            else: lr.append(np.nan)
            prevd = d
        self.lr = pd.Series(lr, index=front.index).reindex(self.dates)
        self.rv20 = np.sqrt((self.lr ** 2).rolling(20, min_periods=15).mean() * 252)
        self.Ffront = front.F.reindex(self.dates)
        self.trend = (self.Ffront / self.Ffront.rolling(50, min_periods=40).mean())  # within-roll noise small vs 50d
        pan = pd.read_csv('/home/user/yazilim/research/try_carry/data/panel.csv', index_col=0, parse_dates=True)
        self.real = (pan.pol - pan.cpi).reindex(self.dates, method='ffill')
        self.on = lib.dep.on_bday(self.dates).values
        self.on_shift = {s: lib.dep.on_bday(self.dates, s).values for s in (-3.0, 3.0)}

def bval(F, K, T, s, cp, dfac):
    return float(lib.b76(np.array([F]), np.array([K]), np.array([T]), np.array([s]), np.array([cp]), dfac)[0])

def run(D, struct='P', delta=0.2, wing=None, L=1.0, mode='hold', mindte=20, filt='none', h=0.10, comm=0.01,
        liq='oi', nema=1.0, tax=0.10, entry_day=0, a_mult=1.0, shift=0.0, maxdte=75, ret_trades=False):
    dates = D.dates; n = len(dates); a = A[D.root] * a_mult
    on = D.on if shift == 0 else D.on_shift[shift]
    cash = 1.0; legs = []  # dict(exp,cp,K,q,iv)
    eq = np.ones(n); trades = []; qpnl = 0.0; marg = np.zeros(n); lev = np.zeros(n)
    month_entry_idx = set()
    s = pd.Series(range(n), index=dates)
    for (y, m), g in s.groupby([dates.year, dates.month]):
        if len(g) > entry_day: month_entry_idx.add(int(g.iloc[entry_day]))
    prev_val = 0.0
    def val(i):
        d = dates[i]; v = 0.0
        for lg in legs:
            p = D.F.get((d, lg['exp'])) if lg['cp'] == 'F' else D.px.get((d, lg['exp'], lg['cp'], lg['K']))
            if p is None or np.isnan(p): p = lg['last']
            lg['last'] = p; v += lg['q'] * p
        return v
    def margin(i):
        if not legs: return 0.0
        d = dates[i]; F = D.F.get((d, legs[0]['exp']), legs[0]['Flast']); T = max((legs[0]['exp'] - d).days / 365, 1 / 365)
        worst = 0.0
        for sc in (1 - a, 1, 1 + a):
            v = 0.0
            for lg in legs:
                v += lg['q'] * (F * sc - F if lg['cp'] == 'F' else bval(F * sc, lg['K'], T, lg['iv'] * 1.25, lg['cp'], 1.0))
            worst = min(worst, v)
        return -worst
    def close_all(i, frac=1.0, reason=''):
        nonlocal cash, legs, qpnl
        d = dates[i]; c = 0.0
        for lg in legs:
            p = lg['last']; q = lg['q'] * frac
            if d >= lg['exp']: pay = q * p          # cash settlement at intrinsic, no spread
            else: pay = q * p - abs(q) * p * ((h + comm) if lg['cp'] != 'F' else FUTCOST)
            cash += pay
            lg['q'] -= q
        if frac >= 1.0 - 1e-12: legs = []
        trades.append((d, 'close', reason))
    for i in range(n):
        d = dates[i]
        # accrue interest on yesterday's equity
        if i > 0:
            e_prev = eq[i - 1]
            base = e_prev - marg[i - 1] * (1 - nema)
            cash += max(base, 0) * on[i]
        v = val(i)
        # expiry settlement
        if legs and d >= legs[0]['exp']:
            close_all(i, reason='expiry'); v = 0.0
        # roll mode: close at entry day
        if legs and mode == 'roll' and i in month_entry_idx:
            close_all(i, reason='roll'); v = 0.0
        # entry
        if not legs and i in month_entry_idx and i < n - 1:
            ok = True
            if filt == 'ivhi': ok = D.atm.iloc[i] > D.atm_med.iloc[i]
            elif filt == 'ivlo': ok = D.atm.iloc[i] <= D.atm_med.iloc[i]
            elif filt == 'vrp': ok = D.atm.iloc[i] > D.rv20.iloc[i]
            elif filt == 'trend': ok = D.trend.iloc[i] > 1.0
            elif filt == 'real': ok = D.real.iloc[i] > 5
            elif filt == 'real_ivhi': ok = D.real.iloc[i] > 5 and D.atm.iloc[i] > D.atm_med.iloc[i]
            elif filt == 'trend_vrp': ok = D.trend.iloc[i] > 1.0 and D.atm.iloc[i] > D.rv20.iloc[i]
            if ok and not (isinstance(ok, (bool, np.bool_)) and not ok) and not pd.isna(ok):
                legs = open_pos(D, i, struct, delta, wing, mindte, maxdte, liq)
                if legs:
                    E = cash + 0.0
                    F = legs[0]['Flast']
                    q0 = L * E / F
                    for lg in legs: lg['q'] *= q0
                    m0 = margin(i)
                    if m0 > E:  # cap by margin
                        sc = E / m0
                        for lg in legs: lg['q'] *= sc
                    for lg in legs:
                        cash -= lg['q'] * lg['last'] + abs(lg['q']) * lg['last'] * ((h + comm) if lg['cp'] != 'F' else FUTCOST)
                    trades.append((d, 'open', [(lg['cp'], lg['K'], lg['q'] / E, lg['last'], lg['delta'], lg['qty'], lg['oi'], lg['Flast']) for lg in legs]))
                    v = val(i)
        mg = margin(i) if legs else 0.0
        e = cash + v
        # forced liquidation if margin > equity
        if legs and mg > e:
            frac = min(1.0, (mg - 0.8 * e) / mg) if e > 0 else 1.0
            close_all(i, frac, reason='margin'); v = val(i) if legs else 0.0; mg = margin(i) if legs else 0.0
            e = cash + v
        # quarterly tax on positive option P&L (MTM) - approximation
        if tax > 0 and i > 0:
            pass
        eq[i] = e; marg[i] = mg
        lev[i] = sum(abs(lg['q']) for lg in legs if lg['q'] < 0) * (legs[0]['Flast'] if legs else 0) / max(e, 1e-9)
        if e <= 0:
            eq[i:] = 0; break
    eq = pd.Series(eq, index=dates)
    if tax > 0: eq = apply_tax(eq, D, tax, shift)
    if ret_trades: return eq, trades, pd.Series(marg, index=dates), pd.Series(lev, index=dates)
    return eq

def apply_tax(eq, D, tax, shift):
    """10% withholding on quarterly positive VİOP P&L (P&L in excess of deposit accrual)."""
    on = D.on if shift == 0 else D.on_shift[shift]
    r = eq.pct_change().fillna(0).values
    out = np.ones(len(eq)); v = 1.0; qp = 0.0; q = None
    idx = eq.index
    for i in range(len(eq)):
        if i > 0:
            g = v * r[i]; dep = v * on[i]
            v += g; qp += g - dep
        qq = (idx[i].year, (idx[i].month - 1) // 3)
        if i + 1 < len(eq):
            nq = (idx[i + 1].year, (idx[i + 1].month - 1) // 3)
            if nq != qq:
                if qp > 0: v -= tax * qp
                qp = 0.0
        out[i] = v
        if v <= 0: out[i:] = 0; break
    return pd.Series(out, index=idx)

def open_pos(D, i, struct, delta, wing, mindte, maxdte, liq):
    d = D.dates[i]; g = D.byday.get(d)
    if g is None: return []
    g = g[g.iv.notna() & (g.px > 0)]
    dte = (g.exp - d).dt.days
    g = g[(dte >= mindte) & (dte <= maxdte)]
    if g.empty: return []
    e = g.exp.min(); g = g[g.exp == e]
    def pick(cp, dl, need_liq=True):
        c = g[g.cp == cp]
        if need_liq and liq != 'any':
            if liq == 'oi': c = c[(c.oi > 0) | (c.qty > 0)]
            elif liq == 'vol5': c = c[[D.traded.get((i, ee, cc, kk), False) for ee, cc, kk in zip(c.exp, c.cp, c.K)]]
        if c.empty: return None
        r = c.iloc[(c.delta.abs() - dl).abs().argmin()]
        if abs(abs(r.delta) - dl) > 0.12: return None
        return dict(exp=e, cp=cp, K=r.K, q=-1.0, iv=r.iv, last=r.px, Flast=r.F, delta=r.delta, qty=r.qty, oi=r.oi)
    legs = []
    if struct in ('F', 'FC', 'FCS'):   # short futures (same expiry) [+ long call wing] [+ short call]
        F = g.F.iloc[0]
        legs.append(dict(exp=e, cp='F', K=0.0, q=-1.0, iv=0.0, last=F, Flast=F, delta=1.0, qty=0, oi=0))
        if struct in ('FC',):
            w = pick('C', wing, need_liq=True)
            if w is None: return []
            w['q'] = 1.0; legs.append(w)
        return legs
    if struct in ('P', 'S', 'PS', 'IC'):
        p = pick('P', delta); 
        if p is None: return []
        legs.append(p)
    if struct in ('C', 'S', 'CS', 'IC'):
        c = pick('C', delta)
        if c is None: return []
        legs.append(c)
    if struct in ('PS', 'IC'):
        w = pick('P', wing, need_liq=False)
        if w is None or w['K'] >= legs[0]['K']: return []
        w['q'] = 1.0; legs.append(w)
    if struct in ('CS', 'IC'):
        sc = [lg for lg in legs if lg['cp'] == 'C' and lg['q'] < 0][0]
        w = pick('C', wing, need_liq=False)
        if w is None or w['K'] <= sc['K']: return []
        w['q'] = 1.0; legs.append(w)
    return legs

def stats(eq, a=None, b=None):
    e = eq[(eq.index >= (a or eq.index[0])) & (eq.index <= (b or eq.index[-1]))]
    if len(e) < 20 or e.iloc[0] <= 0: return dict(geo=-1.0, dd=-1.0, worst=-1.0, negm=np.nan)
    months = (e.index[-1] - e.index[0]).days / 30.4375
    geo = (e.iloc[-1] / e.iloc[0]) ** (1 / months) - 1 if e.iloc[-1] > 0 else -1.0
    dd = (e / e.cummax() - 1).min()
    me = e.resample('ME').last(); mr = me.pct_change(); mr.iloc[0] = me.iloc[0] / e.iloc[0] - 1
    return dict(geo=geo, dd=dd, worst=mr.min(), negm=(mr < 0).mean())
