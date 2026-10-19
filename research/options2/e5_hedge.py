"""E5: hourly perp delta-hedging of the weekly DVOL-filtered 30d strangle (band = rebalance threshold in units of
base notional delta), perp fee 0.05% (user) and 0.10% (protocol), Deribit hourly funding."""
import exp
C = []
for band in (0.05, 0.1, 0.2, 0.4):
    for fee in (0.0005, 0.001):
        for size in (2, 3, 4):
            C.append((f"hedge{band}|fee{fee}|s{size}", dict(hedge=band, hedge_fee=fee, size=float(size))))
print(len(C)); exp.run_all(C, "e5")
