#!/usr/bin/env python3
"""Run the causal Tradeify risk sweep with MNQ-only execution.
Signals remain NQ/V106; execution sizing and fees are MNQ only so the result
matches the TradingView funded indicator architecture.
"""
import v106_causal_tradeify_risk_sweep as audit


def choose_mnq_only(risk_pts, budget):
    if risk_pts <= 0:
        return None
    max_qty = min(audit.MAX_EQUIV_MICROS, int(budget // (risk_pts * audit.MNQ_PV)))
    if max_qty < 1:
        return None
    gross_risk = risk_pts * audit.MNQ_PV * max_qty
    fees = audit.MNQ_FEE_RT * max_qty
    return {'nq': 0, 'mnq': max_qty, 'risk': gross_risk, 'fees': fees,
            'dpp': audit.MNQ_PV * max_qty}


audit.choose_mix = choose_mnq_only

if __name__ == '__main__':
    audit.main()
