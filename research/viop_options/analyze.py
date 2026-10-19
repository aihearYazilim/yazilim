import pandas as pd, numpy as np, sys
pd.set_option('display.width', 250); pd.set_option('display.max_rows', 200)
root = sys.argv[1]
g = pd.read_csv(f'grid_{root}.csv')
g['wing'] = g['wing'].fillna(0)
cols = ['struct','delta','wing','L','filt','mode','is_geo','is_dd','is_worst','oos_geo','oos_dd','oos_worst']
print('n combos', len(g))
print('IS best overall'); print(g.sort_values('is_geo', ascending=False)[cols].head(15).round(4).to_string())
ok = g[g.is_dd > -0.40]
print('IS best with IS maxDD > -40%'); print(ok.sort_values('is_geo', ascending=False)[cols].head(25).round(4).to_string())
print('OOS best (for reference only)'); print(g.sort_values('oos_geo', ascending=False)[cols].head(10).round(4).to_string())
print('median by struct/filt (IS, OOS)'); print(g.groupby(['struct','filt'])[['is_geo','oos_geo']].median().round(4).unstack())
print('share OOS geo>=5.3%:', (g.oos_geo >= 0.053).mean(), ' >=10%:', (g.oos_geo >= 0.10).mean())
