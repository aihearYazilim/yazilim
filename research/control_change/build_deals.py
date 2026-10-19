"""deals_manual.csv (+ KAP zaman damgaları + special_sit/tof_deals.csv teklif bilgileri) -> deals.csv"""
import pandas as pd, numpy as np, pathlib
H = pathlib.Path(__file__).parent
D = pd.read_pickle(H/"raw/oda_all.pkl").drop_duplicates("disclosureIndex").set_index("disclosureIndex")
ts = lambda i: pd.to_datetime(D.loc[int(i)].publishDate, format="%d.%m.%Y %H:%M:%S") if pd.notna(i) else pd.NaT
M = pd.read_csv(H/"deals_manual.csv")
T = pd.concat([pd.read_csv(H.parent/"special_sit/tof_deals.csv"), pd.read_csv(H/"tof_extra.csv")]); T[["start", "end", "record"]] = T[["start", "end", "record"]].apply(pd.to_datetime)
rows = []
for _, r in M.iterrows():
    d = r.to_dict()
    d["nego_ts"] = ts(r.nego_idx); d["spa_ts"] = ts(r.ann_idx); d["out_ts"] = ts(r.out_idx)
    d["sym"] = r.tof_target if isinstance(r.tof_target, str) else r.target
    if isinstance(r.tof_target, str):
        t = T[(T.target == r.tof_target) & (T.start == pd.Timestamp(r.tof_start))].iloc[0]
        d.update(tender_start=t.start, tender_end=t.end, tender_price=t.price_last, record=t.record, tender_kind=t.kind)
    rows.append(d)
X = pd.DataFrame(rows)
X.to_csv(H/"deals.csv", index=False)
print(X[["target", "sym", "nego_ts", "spa_ts", "tp", "outcome", "out_ts", "tender_start", "tender_price", "record"]].to_string())
