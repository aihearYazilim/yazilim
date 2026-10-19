"""TCMB PPK karar tarihleri (tcmb.gov.tr yıllık sayfalarındaki tablonun ilk sütunu)."""
import re, pathlib, pandas as pd
H = pathlib.Path(__file__).parent
rows = []
for f in sorted((H/"raw/mpc").glob("*.html")):
    t = open(f, encoding="utf8", errors="ignore").read()
    for tr in re.findall(r"<tr>(.*?)</tr>", t, flags=re.S):
        tds = re.findall(r"<td[^>]*>(.*?)</td>", tr, flags=re.S)
        if not tds: continue
        txt = re.sub(r"<[^>]+>", " ", tds[0]).replace("&nbsp;", " ").replace("*", " ")
        txt = re.sub(r"\s+", " ", txt).strip()
        try:
            d = pd.to_datetime(txt)
            rows.append(d)
        except Exception:
            pass
    m = re.search(r'data-w-tab="Decision"(.*?)(data-w-tab=|$)', t, flags=re.S)
    if m:
        for ttl in set(re.findall(r'title="(\d{1,2} \w+ \d{4})"', m.group(1))):
            rows.append(pd.to_datetime(ttl))
s = pd.Series(sorted(set(rows)), name="mpc").drop_duplicates()
s.to_csv(H/"mpc_dates.csv", index=False)
print(len(s)); print(s.dt.year.value_counts().sort_index().to_dict())
