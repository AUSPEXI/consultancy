#!/usr/bin/env python3
"""
Spinor/Clifford and 8D Dirac toy benchmarks (research-only).
Writes a JSON summary for evidence notebooks.
"""
import json, math, time
from typing import Tuple

SIG = [1]*8  # +1^8 metric

def popcount(x: int) -> int:
    c = 0
    while x:
        x &= x-1
        c += 1
    return c

def gp_blades(a: int, b: int, sig=SIG) -> Tuple[int,int]:
    sign = 1
    res = a
    for i in range(8):
        m = 1<<i
        if b & m:
            lower = res & ((1<<i)-1)
            if popcount(lower) % 2:
                sign = -sign
            if res & m:
                res ^= m
                if sig[i] < 0:
                    sign = -sign
            else:
                res |= m
    return sign, res

E = [1<<i for i in range(8)]
SCALAR = 0


def bench_identities(rounds: int = 1000):
    t0 = time.perf_counter()
    # e_i^2 = +1
    for _ in range(rounds):
        for i in range(8):
            s, b = gp_blades(E[i], E[i])
            if not (b == SCALAR and s == 1):
                return {"ok": False, "elapsed_s": time.perf_counter()-t0}
    # Anticommutation
    for _ in range(rounds):
        for i in range(8):
            for j in range(8):
                if i == j: continue
                s1, b1 = gp_blades(E[i], E[j])
                s2, b2 = gp_blades(E[j], E[i])
                if not (b1 == b2 and s1 == -s2):
                    return {"ok": False, "elapsed_s": time.perf_counter()-t0}
    # (e_i e_j)(e_j e_i) = -1
    for _ in range(rounds):
        for i in range(8):
            for j in range(8):
                if i == j: continue
                s_ij, b_ij = gp_blades(E[i], E[j])
                s_ji, b_ji = gp_blades(E[j], E[i])
                s_prod, b_prod = gp_blades(b_ij, b_ji)
                s_total = s_ij * s_ji * s_prod
                if not (b_prod == SCALAR and s_total == -1):
                    return {"ok": False, "elapsed_s": time.perf_counter()-t0}
    t1 = time.perf_counter()
    return {"ok": True, "elapsed_s": t1-t0}


def bench_dirac_toy():
    import numpy as np
    t0 = time.perf_counter()
    ks = []
    R = range(-1, 2)
    for a in R:
        for b in R:
            for c in R:
                for d in R:
                    for e in R:
                        for f in R:
                            for g in R:
                                for h in R:
                                    k = np.array([a,b,c,d,e,f,g,h], dtype=float)
                                    if np.all(k==0):
                                        continue
                                    ks.append(float(np.linalg.norm(k)))
    vals = sorted(ks)
    t1 = time.perf_counter()
    return {"count": len(vals), "first10": vals[:10], "elapsed_s": t1-t0}


def main():
    out = {
        "version": 1,
        "generatedAt": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        "identities": bench_identities(rounds=50),
        "diracToy": bench_dirac_toy(),
        "notes": "Research-only; not cryptography."
    }
    print(json.dumps(out, indent=2))

if __name__ == '__main__':
    main()
