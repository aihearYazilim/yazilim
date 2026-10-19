"""Orca/Raydium SOL-USDC synthetic LP with Solana-specific multiplier: Uniswap-calibrated mult(k) scaled by
(Orca snapshot ratio 9.9 at k=1.01) / (Uniswap mult 27.4). Snapshot taken 2026-10-19 from Orca API (OOS-period info:
used only to sanity-scale the data model, not to choose strategy parameters)."""
import json
from sol_approx import run_synth, HERE
m = json.load(open(f'{HERE}/out/mult.json'))['mult']
s = 9.9 / m['1.01']
mult = {float(k): v * s for k, v in m.items()}
print('scale', s, mult)
run_synth('SYN_orca_sol_usdc_scaled', 'orca_sol_usdc', 'SOL', mult)
run_synth('SYN_ray_sol_usdc_clmm_scaled', 'ray_sol_usdc_clmm', 'SOL', mult)
