"""KAP bildirim sayfası -> düz metin (raw/disc/<index>.txt). Kullanım: python fetch_disc.py <listfile of indices>"""
import sys, re, html, time, pathlib, urllib.request
H = pathlib.Path(__file__).parent; D = H/"raw"/"disc"; D.mkdir(parents=True, exist_ok=True)
def text(s):
    t = re.sub(r'<script.*?</script>', '', s, flags=re.S); t = re.sub(r'<style.*?</style>', '', t, flags=re.S)
    t = re.sub(r'<[^>]+>', ' ', t); t = html.unescape(re.sub(r'\s+', ' ', t))
    i = t.find("Özet Bilgi"); return t[max(i, 0):]
def get(i):
    f = D/f"{i}.txt"
    if f.exists(): return
    for k in range(8):
        try:
            s = urllib.request.urlopen(urllib.request.Request(f"https://www.kap.org.tr/tr/Bildirim/{i}", headers={"User-Agent": "Mozilla/5.0"}), timeout=60).read().decode("utf8", "ignore")
            f.write_text(text(s)); return
        except Exception as e:
            print("retry", i, e, flush=True); time.sleep(5*(k+1))
if __name__ == "__main__":
    ids = [l.strip() for l in open(sys.argv[1]) if l.strip()]
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(int(sys.argv[2]) if len(sys.argv)>2 else 6) as ex:
        for n, _ in enumerate(ex.map(get, ids)):
            if n % 500 == 0: print(n, len(ids), flush=True)
