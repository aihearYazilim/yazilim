"""Kripto (Binance) ve BIST (Yahoo) günlük fiyat verilerini indirir."""
import time, sys, pathlib, requests, pandas as pd

ROOT = pathlib.Path(__file__).resolve().parents[1] / "data"
UA = {"User-Agent": "Mozilla/5.0"}

CRYPTO = ["BTC","ETH","BNB","SOL","XRP","ADA","DOGE","TRX","AVAX","LINK","DOT","LTC","BCH",
          "XLM","ATOM","ETC","NEAR","FIL","APT","ARB","OP","SUI","INJ","AAVE","UNI","HBAR",
          "TON","SHIB","PEPE","RNDR","FET","ALGO","VET","ICP","SEI","TIA","WIF","ENA"]

BIST = ["AKBNK","ARCLK","ASELS","BIMAS","EKGYO","ENKAI","EREGL","FROTO","GARAN","HEKTS","ISCTR",
        "KCHOL","KOZAL","KRDMD","PETKM","PGSUS","SAHOL","SASA","SISE","TAVHL","TCELL","THYAO",
        "TOASO","TUPRS","YKBNK","ALARK","ASTOR","BRSAN","CCOLA","CIMSA","DOAS","EKSUN" ,"ENJSA",
        "GUBRF","HALKB","KONTR","MGROS","ODAS","OTKAR","OYAKC","SOKM","TTKOM","ULKER","VESTL",
        "VAKBN","TKFEN","AEFES","AGHOL","ALFAS","KOZAA","GESAN","MAVI","TSKB","ZOREN","SKBNK"]
BIST_IDX = ["XU100","XU030","USDTRY=X"]

def binance(sym):
    out, start = [], 1546300800000  # 2019-01-01
    while True:
        r = requests.get("https://data-api.binance.vision/api/v3/klines",
                         params={"symbol": sym+"USDT","interval":"1d","startTime":start,"limit":1000}, timeout=30)
        if r.status_code != 200: return None
        k = r.json()
        if not k: break
        out += k
        start = k[-1][0] + 86400000
        if len(k) < 1000: break
    if not out: return None
    df = pd.DataFrame(out).iloc[:, :6]
    df.columns = ["t","open","high","low","close","volume"]
    df["date"] = pd.to_datetime(df.t, unit="ms")
    return df.set_index("date")[["open","high","low","close","volume"]].astype(float)

def yahoo(sym):
    r = requests.get(f"https://query2.finance.yahoo.com/v8/finance/chart/{sym}",
                     params={"range":"10y","interval":"1d","events":"div,splits"}, headers=UA, timeout=30)
    if r.status_code != 200: return None
    res = r.json()["chart"]["result"][0]
    q = res["indicators"]["quote"][0]
    adj = res["indicators"].get("adjclose", [{}])[0].get("adjclose")
    df = pd.DataFrame({"open":q["open"],"high":q["high"],"low":q["low"],"close":q["close"],
                       "volume":q["volume"]}, index=pd.to_datetime(res["timestamp"], unit="s").normalize())
    if adj is not None:
        f = pd.Series(adj, index=df.index) / df.close
        for c in ["open","high","low","close"]: df[c] = df[c]*f
    return df.dropna(subset=["close"])

if __name__ == "__main__":
    for d in ["crypto","bist"]: (ROOT/d).mkdir(parents=True, exist_ok=True)
    for s in CRYPTO:
        df = binance(s); print("crypto", s, None if df is None else len(df)); sys.stdout.flush()
        if df is not None: df.to_csv(ROOT/"crypto"/f"{s}.csv")
    for s in BIST + BIST_IDX:
        ys = s if s.endswith("=X") else s + ".IS"
        for _ in range(4):
            df = yahoo(ys)
            if df is not None: break
            time.sleep(3)
        print("bist", s, None if df is None else len(df)); sys.stdout.flush()
        if df is not None: df.to_csv(ROOT/"bist"/f"{s.replace('=X','')}.csv")
        time.sleep(0.7)
