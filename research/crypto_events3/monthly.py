import pickle, pathlib, pandas as pd
H = pathlib.Path(__file__).parent; SER = pickle.load(open(H / "raw/series.pkl", "rb"))
K = ["UNGATED s=0.2", "UNGATED s=0.1", "EVT|N=90|hi_q0.5|10/20", "TRDFUND|N=7|>0.0001|tri", "BREADTH|M=20|<0.5|0/20", "OWN_MTM|N=45|>0|0/20", "OWN_MTM|N=30|>0|0/20"]
M = pd.DataFrame({k: ((1 + SER[k]["OOS"]["2025-10-17":"2026-10-16"]).resample("ME").prod() - 1) * 100 for k in K}).round(1)
M.index = M.index.strftime("%y-%m"); print(M.T.to_string())
I = pd.DataFrame({k: ((1 + SER[k]["IS"]["2024-06-01":"2025-10-16"]).resample("ME").prod() - 1) * 100 for k in K}).round(1)
I.index = I.index.strftime("%y-%m"); print(I.T.to_string())
