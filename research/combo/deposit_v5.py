"""v5: TL bank deposit model (replaces money-market fund / PPF everywhere; user constraint 2026-10-18: no funds).

GROSS RATE: TCMB weekly flow weighted-average SIMPLE annual rate on TL deposits up to 3 months (EVDS TP.TRY.MT02-type,
"1-3 ay vadeli"). EVDS needs an API key (blocked here), so a MONTHLY table was reconstructed from anchors published
in the press (TCMB data quoted by Bloomberg HT / Sabah / capital.com.tr), compound ("bilesik") quotes converted to
simple with s = 12*((1+c)^(1/12)-1); months between anchors interpolated by hand following the policy path.
Anchors (simple %, approx):  2022 low <17; end-Aug-2022 18.3; start-2023 24.0; 24-Mar-2023 28.1; 23-Jun-2023 42 (peak);
 21-Jul-2023 30.4; Aug-2023 <30; 10-Nov-2023 45.9; 17-Nov-2023 46.25; Mar-2024 compound 55.7->59.5 (~45-47 simple);
 24-May-2024 compound 61.8 (~49); 26-Jul-2024 compound 59.3 (~47.5); 13-Sep-2024 compound 60.2 (~48);
 mid-Mar-2025 compound ~48.8 (~40.5); 4/11-Apr-2025 compound 53.8/54.6 (~44); 31-Oct-2025 compound 48.1 (~40);
 25-Sep-2026 36.9 simple; 9-Oct-2026 36.4 simple.  Uncertainty about +-2-3 pp per month -> sensitivity DEP_SHIFT.
WITHHOLDING (stopaj) on TL deposits <= 6 months (GVK gecici 67; applies to accounts opened/renewed from the date):
 30.09.2020-30.04.2024 5%; 01.05.2024 7.5%; 01.11.2024 10% (Decree 9075); 01.02.2025 15% (Decree 9487, general rate
 restored); 09.07.2025 17.5% (Decree of 09.07.2025, extended by 10154 to 31.12.2025, 10706 to 30.06.2026,
 11444 to 31.12.2026).
PRODUCTS:
 'D32' : 32-day term deposit, rate = table rate of the roll month, locked for 32 days, interest (net of stopaj at the
         roll date) credited at maturity and rolled (compounds every 32 days). Breaking the term (any withdrawal
         before maturity) forfeits the accrued interest on the withdrawn amount (standard Turkish bank practice).
 'ON'  : overnight / daily-access account ("gunluk kazandiran / gecelik"): ON_FACTOR x table rate, net of the same
         stopaj, accrues daily, no break cost. ON_FACTOR = 0.85 (assumption: daily accounts pay below 32-day rates).
"""
import numpy as np, pandas as pd

DEP = {  # simple annual %, 1-3 month TL deposits, monthly average (reconstructed, see docstring)
 2022: [17.5, 17.0, 17.0, 17.0, 17.5, 17.0, 17.5, 18.3, 19.0, 20.0, 22.0, 23.5],
 2023: [24.0, 25.0, 28.1, 28.0, 30.0, 38.0, 31.0, 29.5, 33.0, 39.0, 45.5, 45.0],
 2024: [42.0, 43.0, 46.0, 49.0, 49.5, 48.0, 47.8, 47.8, 48.4, 48.0, 47.0, 45.0],
 2025: [42.0, 41.0, 40.5, 44.5, 44.0, 43.0, 42.0, 41.0, 40.5, 40.3, 40.0, 38.5],
 2026: [37.5, 37.0, 38.0, 38.5, 38.5, 38.0, 37.5, 37.5, 37.0, 36.4, 36.4, 36.4],
}
# before 2022 (only needed for BIST-C/IV history 2018-2021): policy-linked fallback, deposit ~ policy + 1.5pp
STOPAJ = [("2000-01-01", 0.15), ("2020-09-30", 0.05), ("2024-05-01", 0.075), ("2024-11-01", 0.10),
          ("2025-02-01", 0.15), ("2025-07-09", 0.175)]
ON_FACTOR = 0.85
TERM = 32


def gross(idx, shift=0.0):
    """annual simple gross rate (fraction) per date."""
    import sys, pathlib
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "src"))
    import engine
    s = pd.Series(np.nan, index=idx, dtype=float)
    for y, v in DEP.items():
        for m, r in enumerate(v, 1):
            s[(idx.year == y) & (idx.month == m)] = r
    if s.isna().any():   # pre-2022: engine POLICY table (policy) + 1.5pp
        pol = pd.Series(np.nan, index=idx)
        for k, v in sorted(engine.POLICY.items()):
            pol[pol.index >= pd.Timestamp(k + "-01")] = v
        s = s.fillna(pol.ffill().fillna(10.0) + 1.5)
    return (s + shift) / 100


def stopaj(idx):
    s = pd.Series(np.nan, index=idx, dtype=float)
    for d, v in STOPAJ:
        s[s.index >= pd.Timestamp(d)] = v
    return s


def net_rate(idx, product="D32", shift=0.0):
    g = gross(idx, shift) * (ON_FACTOR if product == "ON" else 1.0)
    return g * (1 - stopaj(idx))


def on_bday(idx, shift=0.0):
    """daily return of the overnight account on a business-day calendar (calendar-day accrual)."""
    r = net_rate(idx, "ON", shift).values
    gaps = pd.Series(idx, index=idx).diff().dt.days.fillna(1).values
    return pd.Series((1 + r / 365) ** gaps - 1, index=idx)


class Deposit:
    """32-day term deposit book with break penalty (or ON account when product='ON').
    Arrays: rate_d32[i], rate_on[i] = annual simple NET rates on sim day i; days[i] = calendar days since i-1."""
    def __init__(self, idx, product, shift=0.0):
        self.product = product
        self.r32 = net_rate(idx, "D32", shift).values; self.ron = net_rate(idx, "ON", shift).values
        self.days = np.r_[0, (idx[1:] - idx[:-1]).days].astype(float)
        self.P = 0.0; self.acc = 0.0; self.rl = 0.0; self.age = 0.0; self.penalty = 0.0

    def value(self):
        return self.P + self.acc

    def step(self, i):
        if self.product == "ON":
            self.P *= (1 + self.ron[i] / 365) ** self.days[i]; return
        d = self.days[i]
        while d > 0:
            if self.P <= 0: self.age = 0.0; break
            take = min(d, TERM - self.age)
            self.acc += self.P * self.rl * take / 365; self.age += take; d -= take
            if self.age >= TERM - 1e-9:        # maturity: credit and roll at today's rate
                self.P += self.acc; self.acc = 0.0; self.age = 0.0; self.rl = self.r32[i]

    def deposit(self, x, i):
        if x <= 0: return
        if self.product == "ON" or self.P <= 0:
            if self.product != "ON": self.rl = self.r32[i]; self.age = 0.0; self.acc = 0.0
            self.P += x; return
        # new money joins the running term (simplification: same maturity, earns from now: accrual pro-rata)
        self.P += x

    def withdraw(self, x, i):
        """withdraw x TL (value terms). returns amount actually paid out."""
        if x <= 0: return 0.0
        v = self.value()
        if v <= 0: return 0.0
        if self.product == "ON":
            x = min(x, self.P); self.P -= x; return x
        f = min(1.0, x / v)
        lost = self.acc * f                     # forfeited accrued interest on the broken part
        self.penalty += lost
        out = self.P * f                        # principal returned; to deliver x need more principal
        if out < x and f < 1.0:
            f2 = min(1.0, x / self.P) if self.P > 0 else 1.0
            lost = self.acc * f2; out = self.P * f2
            self.penalty += lost - self.acc * f
            f = f2
        self.P -= out; self.acc -= self.acc * f
        return out
