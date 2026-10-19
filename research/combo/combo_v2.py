"""v2: Arz (A) + BIST kolu C (bist_all sabit konfig) ve C/KELLY karışımı. combo.py simülatörü aynen kullanılır.
Birincil: C lag1 (skor 1 gün gecikmeli). Duyarlılık: C lag0. Teminat modu: 'sell' (birincil; hisse talep için satılır)
+ 'pledge' (iyimser) duyarlılık. Karışım ağırlıkları sadece IS (2022-01-03..2025-10-16) günlük getirileriyle,
her lag için ayrı: ters-oynaklık (MIX_IV) ve 21 noktalı ızgarada IS max-Sharpe (MIX_SH). KELLY vergisi tau=%20."""
import pathlib, itertools, json
import numpy as np, pandas as pd
import combo as CB

H = pathlib.Path(__file__).resolve().parent; OUT = H / "results"
CB.SL = pd.read_pickle(OUT / "sleeves_v2.pkl")
CB.SFEE.update({"C_L1": 0.0014, "C_L0": 0.0014})
CAPS = [100_000, 250_000, 500_000, 1_000_000]; ACCS = [1, 2, 4]


def choose(cname):
    x = CB.SL.loc["2022-01-03":"2025-10-16"]
    vb, vk = x[cname].std(), x.KELLY.std()
    w_iv = (1 / vb) / (1 / vb + 1 / vk)
    g = []
    for wb in np.round(np.arange(0, 1.0001, 0.05), 2):
        r = wb * x[cname] + (1 - wb) * x.KELLY - x.MM
        g.append(dict(lag=cname, w_C=wb, sharpe=r.mean() / r.std() * np.sqrt(260)))
    g = pd.DataFrame(g)
    return float(w_iv), float(g.loc[g.sharpe.idxmax(), "w_C"]), g


if __name__ == "__main__":
    tr, pxs = CB.load_ipos()
    rows, mon, daily, grids, W = [], {}, {}, [], {}
    for lag in ["C_L1", "C_L0"]:
        w_iv, w_sh, g = choose(lag); grids.append(g); W[lag] = dict(w_iv=w_iv, w_sh=w_sh)
        print(lag, "w_C inverse-vol=%.3f  IS max-Sharpe=%.2f" % (w_iv, w_sh))
        SLV = {"C": {lag: 1.0}, "MIX_IV": {lag: w_iv, "KELLY": 1 - w_iv}, "MIX_SH": {lag: w_sh, "KELLY": 1 - w_sh}}
        SLV = {k: {a: b for a, b in v.items() if b > 0} for k, v in SLV.items()}
        def run(s, wts, md, ipo, C, k, group):
            for per, a, b in [("IS", CB.IS0, CB.IS1), ("OOS", CB.OOS0, CB.OOS1)]:
                e = CB.sim(tr, pxs, C / k, wts, md, 0.20, a, b, ipo) * k
                rows.append(dict(group=group, lag=lag, sleeve=s, mode=md, C=C, accounts=k, period=per,
                                 coll_frac=CB.DIAG["coll_frac"], **CB.stats(e, a)))
                mon[(per, lag, s, md, C, k, group)] = CB.monthly(e); daily[(per, lag, s, md, C, k, group)] = e
        for s, wts in SLV.items():
            run(s, wts, "pledge", False, 1_000_000, 1, "noIPO")
            for C, k in itertools.product(CAPS, ACCS):
                run(s, wts, "sell", True, C, k, "main")
                run(s, wts, "pledge", True, C, k, "sens_pledge")
    pd.concat(grids).to_csv(OUT / "mix_weight_IS_grid_v2.csv", index=False)
    json.dump(W, open(OUT / "mix_weights_v2.json", "w"))
    res = pd.DataFrame(rows); res.to_csv(OUT / "all_results_v2.csv", index=False)
    pd.to_pickle(dict(daily=daily, monthly=mon), OUT / "series_v2.pkl")
    for per in ["IS", "OOS"]:
        df = pd.DataFrame({f"{l}|{s}|{m}|{c//1000}k|{k}acc": v for (p, l, s, m, c, k, g), v in mon.items()
                           if p == per and g in ("main", "noIPO") and (g == "main" or True)})
        df.to_csv(OUT / f"monthly_returns_{per}_v2.csv", float_format="%.6f")
        dd = pd.DataFrame({f"{l}|{s}|{m}|{c//1000}k|{k}acc|{g}": v.pct_change().dropna() for (p, l, s, m, c, k, g), v in daily.items()
                           if p == per and g in ("main", "noIPO")})
        dd.to_csv(OUT / f"daily_returns_{per}_v2.csv", float_format="%.6f")
    print("simülasyon:", len(res) // 2)
