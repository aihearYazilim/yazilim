"""Build & cache trade sets (per unit notional, costs included) for all structures."""
import sys, pickle, itertools, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import lib

AM, AW, PK = 0.87, 0.80, 1.10          # calibrated on CBOE PUT / WPUT (IS only)
S_SKEW, C_SKEW = float(sys.argv[2]), float(sys.argv[3])  # calibrated on PUTY / CNDR
OUT = lib.D / f"trades_{sys.argv[1]}.pkl"
DELTAS = [0.05, 0.10, 0.15, 0.20, 0.30, 0.50]

def main():
    und = sys.argv[1]
    df = lib.load(und, proxy_k=PK)
    m = lib.Model(aM=AM, aW=AW, s=S_SKEW, c=C_SKEW)
    res = {}
    for ten in ["W", "M"]:
        for d in DELTAS:
            res[(und, ten, "put", d)] = lib.build_trades(df, m, ten, [(False, d)], und=und)
            if d < 0.5:
                res[(und, ten, "strangle", d)] = lib.build_trades(df, m, ten, [(False, d), (True, d)], und=und)
            print(und, ten, d, flush=True)
    pickle.dump(res, open(OUT, "wb"))

if __name__ == "__main__":
    main()
