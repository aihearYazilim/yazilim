import requests, pandas as pd, json, sys, pathlib
D=pathlib.Path(__file__).parent/'data'
H={'User-Agent':'Mozilla/5.0'}
for s in ['^GSPC','^NDX','SPY','QQQ','^VIX','^VIX9D','^VVIX','^VXN','^VIX3M','^IRX','^SPX']:
    try:
        r=requests.get(f'https://query2.finance.yahoo.com/v8/finance/chart/{s}?period1=0&period2=1800000000&interval=1d',headers=H,timeout=60)
        j=r.json()['chart']['result'][0]
        q=j['indicators']['quote'][0]
        df=pd.DataFrame({k:q[k] for k in ['open','high','low','close','volume']},index=pd.to_datetime(j['timestamp'],unit='s').normalize())
        if 'adjclose' in j['indicators']: df['adjclose']=j['indicators']['adjclose'][0]['adjclose']
        df=df[~df.index.duplicated(keep='last')].dropna(subset=['close'])
        df.to_csv(D/(s.replace('^','')+'.csv')); print(s,len(df),df.index[0].date(),df.index[-1].date())
    except Exception as e: print(s,'ERR',e)
