import sim
D=sim.Data('XU030')
eq=sim.run(D,L=0.0,tax=0)
print('deposit ON IS',sim.stats(eq,None,'2025-10-16'),'OOS',sim.stats(eq,'2025-10-17','2026-10-16'))
