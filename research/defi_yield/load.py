import json, pandas as pd, numpy as np
RAW='/home/user/yazilim/research/defi_yield/raw/'
OOS0=pd.Timestamp('2025-10-17'); OOS1=pd.Timestamp('2026-10-16')
def llama(k):
    d=json.load(open(RAW+f'chart_{k}.json'))['data']
    df=pd.DataFrame(d); df['date']=pd.to_datetime(df.timestamp).dt.tz_localize(None).dt.normalize()
    s=df.groupby('date').apy.last().astype(float)
    s=s.asfreq('D').ffill(limit=5)
    return s
def usdtry():
    u=pd.read_csv('/home/user/yazilim/data/bist/USDTRY.csv',index_col=0,parse_dates=True)['close']
    return u.asfreq('D').ffill()
