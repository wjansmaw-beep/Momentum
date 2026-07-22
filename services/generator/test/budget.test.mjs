import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createBudgetTracker } from '../budget.mjs';

test('defaults: 100 calls per day and EUR 10 ceiling', () => {
  const budget = createBudgetTracker({});
  const status = budget.status();
  assert.equal(status.dailyCallLimit, 100);
  assert.equal(status.budgetEur, 10);
  assert.equal(status.budgetExhausted, false);
  assert.equal(budget.canSpend(), true);
});

test('daily call limit exhausts the budget', () => {
  const budget = createBudgetTracker({ MOMENTUM_GENERATOR_DAILY_CALL_LIMIT: '2', MOMENTUM_GENERATOR_BUDGET_EUR: '10' });
  budget.record(0);
  budget.record(0);
  assert.equal(budget.canSpend(), false);
  assert.equal(budget.status().budgetExhausted, true);
  assert.equal(budget.status().callsToday, 2);
});

test('estimated cost exhausts the EUR ceiling (converted via the planning rate)', () => {
  const budget = createBudgetTracker({ MOMENTUM_GENERATOR_BUDGET_EUR: '1', MOMENTUM_GENERATOR_USD_PER_EUR: '1' });
  budget.record(0.6);
  assert.equal(budget.canSpend(), true);
  budget.record(0.6);
  assert.equal(budget.canSpend(), false);
});

test('non-finite cost estimates still count the call but not the cost', () => {
  const budget = createBudgetTracker({ MOMENTUM_GENERATOR_BUDGET_EUR: '10' });
  budget.record(null);
  assert.equal(budget.status().callsToday, 1);
  assert.equal(budget.status().estimatedCostUsd, 0);
});

test('counters reset at the UTC day boundary', () => {
  let day = '2026-07-22';
  const budget = createBudgetTracker({ MOMENTUM_GENERATOR_DAILY_CALL_LIMIT: '1' }, () => new Date(`${day}T12:00:00Z`));
  budget.record(0);
  assert.equal(budget.canSpend(), false);
  day = '2026-07-23';
  assert.equal(budget.canSpend(), true);
});

test('an explicit zero budget or call limit is a kill switch', () => {
  assert.equal(createBudgetTracker({ MOMENTUM_GENERATOR_BUDGET_EUR: '0' }).canSpend(), false);
  assert.equal(createBudgetTracker({ MOMENTUM_GENERATOR_DAILY_CALL_LIMIT: '0' }).canSpend(), false);
});
