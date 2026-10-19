from run import *
for strat, d, sz in [("csp", .1, 1), ("csp", .2, 1), ("strangle", .1, 1), ("cc", .1, 1), ("pspread", .2, .2), ("condor", .15, .2), ("dhs", .5, 1)]:
    for t in ("W", "M"):
        s = series(t, "BTC", strat, d, sz, "none")
        print(strat, d, sz, t, len(s), {k: round(v, 4) for k, v in stat(s, "2021-04-01", OOS0).items()})
