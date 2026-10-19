"""Ortak: special_sit paneli + düzeltilmiş seri (bedelsiz/bölünme çarpanı), maliyetler, portföy motoru (special_sit/common_ss)."""
import sys, pathlib, numpy as np, pandas as pd
H = pathlib.Path(__file__).parent
sys.path.insert(0, str(H.parent/"special_sit"))
from common_ss import panel, days, entry_idx, simulate, report, FEE, SLIP, OOS_START, OOS_END, IS_START, cash_rate_daily, stats
_S = {}
def adj_series(sym):
    """sym (örn. 'KAPLM') -> DataFrame[c,v,lo,hi,val,mult,traded]. c<=0 günleri işlem yok sayılır (fiyat ileri taşınır).
    mult: 1 orijinal payın bugünkü pay adedi (pc/önceki geçerli kapanış ile bedelsiz/bölünme tespiti; |log f|>%3 ise uygulanır).
    Nakit temettü düzeltmesi (küçük f) yok sayılır -> muhafazakâr."""
    if sym in _S: return _S[sym]
    P = panel(); d = P[P.code == sym + ".E"].set_index("date").sort_index()
    d = d[~d.index.duplicated()].copy()
    if len(d) == 0: _S[sym] = d; return d
    d["traded"] = (d.c > 0) & (d.v > 0) & (d.val > 0)
    lastc = d.c.where(d.c > 0).ffill()
    # Bültende bedelsiz/bedelli günlerinde (ca 01/03) önceki kapanış düzeltilmiyor: düzeltme oranını
    # gün AOF'u / önceki geçerli kapanış ile tahmin et (fiyat limiti ±%10 olduğundan ±%12 dışı = sermaye işlemi).
    f1 = (d.pc / lastc.shift()).where(d.pc > 0)
    rv = (d.v.where(d.traded) / lastc.shift())
    caday = d.ca.fillna("").astype(str).str.contains("01|03")
    big = (rv < 0.88) | (rv > 1.12)
    f = pd.Series(1.0, index=d.index)
    f[(f1 < 0.97) | (f1 > 1.03)] = f1
    f[(caday | (rv < 0.8) | (rv > 1.25)) & big & rv.notna()] = rv
    f = f.fillna(1.0)
    d["mult"] = (1.0 / f).cumprod()
    d["c"] = lastc; d["v"] = d.v.where(d.traded); d["lo"] = d.lo.where(d.traded); d["hi"] = d.hi.where(d.traded)
    d["val"] = d.val.where(d.traded, 0.0)
    _S[sym] = d; return d
def avg6(s, t):
    """SPK II-26.1 m.17: ilk kamuya açıklama tarihinden önceki 6 ayın düzeltilmiş günlük AOF'larının aritmetik ortalaması
    (bugünkü pay adedine göre, t'deki çarpana göre ölçeklenmiş)."""
    w = s[(s.index < t) & (s.index >= t - pd.DateOffset(months=6)) & s.traded]
    if len(w) < 20: return np.nan
    m_t = s.mult[s.index < t].iloc[-1]
    return float((w.v * w.mult / m_t).mean())
_M = None
def chain(code):
    """KAP (güncel) kodu -> panel kod zinciri (eski..yeni), tickmap.csv üzerinden."""
    global _M
    if _M is None:
        _M = pd.read_csv(H/"tickmap.csv", parse_dates=["date"])
        _M = _M.sort_values("date").drop_duplicates("new", keep="first")
    out = [code]
    while True:
        r = _M[_M.new == out[0]]
        if len(r) == 0 or r.old.iloc[0] in out: break
        out.insert(0, r.old.iloc[0])
    nxt = code
    while True:
        r = _M[_M.old == nxt]
        if len(r) != 1 or r.new.iloc[0] in out: break
        nxt = r.new.iloc[0]; out.append(nxt)
    return out
def stitched(code):
    key = "ST:" + code
    if key in _S: return _S[key]
    parts = []
    for c in chain(code):
        d = adj_series(c)
        if len(d): parts.append(d[["c", "v", "lo", "hi", "val", "traded", "mult"]].assign(sym=c))
    if not parts: _S[key] = pd.DataFrame(); return _S[key]
    out = []; m_last = 1.0
    for d in parts:
        if out: d = d[d.index > out[-1].index[-1]]
        d = d.copy(); d["mult"] = d.mult / d.mult.iloc[0] * m_last if len(d) else d.mult
        if len(d): m_last = d.mult.iloc[-1]; out.append(d)
    S = pd.concat(out); _S[key] = S; return S
