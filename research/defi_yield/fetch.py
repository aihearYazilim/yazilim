import json, subprocess, os, sys
P={'susde':'66985a81-9c51-46ca-9977-42b4fe7bc6df','aave_usdc':'aa70268e-4b52-42bf-a116-608b370f9501',
'aave_usdt':'f981a304-bb6c-45b8-b0c5-fd2f515ad23a','comp_usdc':'7da72d09-56ca-4ec5-a45f-59114353e487',
'sdai':'c8a24fee-ec00-4f38-86c0-9f6daebc4225','susds':'d8c4eff5-c8a9-46fc-a888-057c4c668e72',
'maple_usdc':'43641cf5-a92e-416b-bce9-27113d3c0db6','aave_susde':'29932dea-cd71-44c3-95bd-3e1525f4e3dd',
'aave_usde':'21e1ac8a-b3aa-4576-9506-0b40137721a0','sparklend_usds':'0ed981dc-b49d-426d-ade5-6014728b1ef9',
'fluid_usdc':'4438dabc-7f0c-430b-8136-2722711ae663','morpho_susde':'9b0c3b21-d47b-4b0c-855d-d1b78cd35350'}
for k,v in P.items():
    for kind,url in (('chart',f'https://yields.llama.fi/chart/{v}'),('lb',f'https://yields.llama.fi/chartLendBorrow/{v}')):
        f=f'raw/{kind}_{k}.json'
        if os.path.exists(f) and os.path.getsize(f)>1000: continue
        subprocess.run(['curl','-sS','-m','60','-o',f,url])
        print(k,kind,os.path.getsize(f))
