"""DefiLlama yields history (daily tvlUsd, apyBase, apyReward) for volatile LP pools."""
import json, os, subprocess, sys
P = {
 'uni_eth_usdc_weth_005':'665dc8bc-c79d-4800-97f7-304bf368e547','uni_eth_usdc_weth_03':'49717ee2-9808-4288-b76d-e658195b7979',
 'uni_eth_wbtc_weth_005':'d59a5728-d391-4989-86f6-a94e11e0eb3b','uni_eth_wbtc_weth_03':'c5599b3a-ea73-4017-a867-72eb971301d1',
 'uni_arb_weth_usdc_005':'a14bd201-764c-40a5-86b8-2928b2461232','uni_arb_wbtc_weth_005':'bb7e9353-129f-4e01-b822-f4250d0abb8a',
 'uni_base_weth_usdc_005':'8b3cadb9-b9f1-4539-998c-18c02e9e65a0','uni_base_weth_usdc_03':'b99bcdf5-1350-4269-981e-0e9b5cccb007',
 'uni_eth_weth_usdt_03':'fc9f488e-8183-416f-a61e-4e5c571d4395',
 'aero_weth_usdc_cl100':'10137e20-efbc-4e15-a733-17ecb52c48e8','aero_weth_usdc_cl50':'1328ac9d-9939-4719-a85a-114935209e08',
 'aero_v1_weth_usdc':'e8cb4dbb-9e66-4cfa-9c77-407118b128a0',
 'orca_sol_usdc':'a5c85bc8-eb41-45c0-a520-d18d7529c0d8','ray_sol_usdc_clmm':'709f121d-d3b4-44da-b3d0-47bc16f5400b',
 'ray_sol_usdc_std':'12edc6f3-4926-4b4f-b97c-38ef6a458574',
 'gmx_gm_eth_usdc':'61b4c35c-97f6-4c05-a5ff-aeb4426adf5b','gmx_gm_btc_usdc':'5b8c0691-b9ff-4d82-97e4-19a1247e6dbf',
 'gmx_gm_sol_usdc':'906b233c-8478-4b94-94e5-2d77e6c7c9e5',
}
os.chdir(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open('raw/pools.json'))['data']
for p in d:
    if p['project'] in ('gmx-v1-perps','gmx-v1','gmx') and 'GLP' in p['symbol'].upper():
        P['gmx_glp_'+p['chain'].lower()] = p['pool']; print('GLP', p['chain'], p['pool'])
for k, v in P.items():
    f = f'raw/llama_{k}.json'
    if os.path.exists(f) and os.path.getsize(f) > 1000: continue
    subprocess.run(['curl', '-sS', '-m', '90', '-o', f, f'https://yields.llama.fi/chart/{v}'])
    print(k, os.path.getsize(f))
