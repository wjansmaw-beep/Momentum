// In-memory budget and call-limit tracker (ADR-056, Founder decision
// 2026-07-22). Conservative server-side guard rails; provider dashboards must
// also carry hard limits (see the runbook). State is per-process and resets
// on restart and at each UTC day boundary; this is a safety net, not billing.

const round6 = (value) => Math.round(value * 1_000_000) / 1_000_000;

export function createBudgetTracker(env = {}, now = () => new Date()) {
  // An explicit 0 is a deliberate kill switch: no model calls at all.
  const parsedCallLimit = Number(env.MOMENTUM_GENERATOR_DAILY_CALL_LIMIT);
  const dailyCallLimit = Number.isFinite(parsedCallLimit) && parsedCallLimit >= 0 ? Math.round(parsedCallLimit) : 100;
  const parsedBudget = Number(env.MOMENTUM_GENERATOR_BUDGET_EUR);
  const budgetEur = Number.isFinite(parsedBudget) && parsedBudget >= 0 ? parsedBudget : 10;
  // Fixed planning conversion for the EUR ceiling; approximate by design.
  const parsedRate = Number(env.MOMENTUM_GENERATOR_USD_PER_EUR);
  const usdPerEur = Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : 1.09;

  let day = '';
  let calls = 0;
  let costUsd = 0;

  const rollDay = () => {
    const today = now().toISOString().slice(0, 10);
    if (today !== day) {
      day = today;
      calls = 0;
      costUsd = 0;
    }
  };

  const canSpend = () => {
    rollDay();
    return calls < dailyCallLimit && costUsd < budgetEur * usdPerEur;
  };

  return {
    canSpend,
    record(estimatedCostUsd) {
      rollDay();
      calls += 1;
      if (Number.isFinite(estimatedCostUsd)) costUsd += estimatedCostUsd;
    },
    status() {
      rollDay();
      return {
        callsToday: calls,
        dailyCallLimit,
        estimatedCostUsd: round6(costUsd),
        budgetEur,
        budgetExhausted: !canSpend(),
      };
    },
  };
}
