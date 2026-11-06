---
name: decision-lab
description: Build an inspectable Crux decision model, compare feasible options, and find the assumptions that change the answer.
---

# Crux decision lab

Use Crux when the user is comparing concrete options whose outcome depends on numeric assumptions or hard limits. Good questions include which delivery strategy meets a deadline and budget, which service plan is cheapest at a given workload, or which production method meets capacity requirements. Crux computes supplied models locally; it does not retrieve facts, verify sources, or execute a plan.

## Establish the model

Identify the decision, finite candidates, one explicit objective (minimize cost, maximize throughput, etc.), assumptions and their plausible exploration ranges, and hard requirements. Respect the user's chosen objective. Do not invent preference weights or quietly convert qualitative considerations into numbers.

Use the user's facts or attributed sources when available. Mark unsupported numbers as estimates and label an illustrative model clearly in its title and source labels. A source label records an attribution; it does not verify it. Ranges are bounds for exploration, never probability distributions or confidence intervals. Distinguish measured inputs, estimates, and preferences using `kind`.

For an existing decision, call `crux_inspect` before creating a duplicate. A study is immutable; a revised model is a new study. Scenario snapshots keep a position within an existing model.

## Affine schema

Call `crux_create` with `{"study": STUDY}`. The study object has:

- `title`, `question`: concise plain text.
- `assumptions`: 1–8 objects with unique `id`, `label`, `unit`, `min`, `max`, `default`, positive `step`, `kind` (`measured`, `estimate`, or `preference`), and optional `source: {label, url?}`. Require `min < max` and a default inside the range. Step controls the UI; the mathematical variable is continuous.
- `metrics`: 1–8 objects with unique `id`, `label`, `unit`.
- `candidates`: 1–12 objects with unique `id`, `label`, optional `description`, and `metrics` containing one formula for every declared metric.
- `constraints`: 0–10 objects with unique `id`, `label`, `metric_id`, `operator` (`<=` or `>=`), and numeric `value`.
- `objective`: `{metric_id, direction: "min" | "max"}`.

IDs start with a lowercase letter and contain only lowercase letters, digits, hyphens or underscores, at most 64 characters. Every number must be finite and within ±1e12. A complete tool request is limited to 128 KiB.

A formula is **only** `{constant: NUMBER, coefficients: {assumption_id: NUMBER}}`. Its meaning is the constant plus each coefficient multiplied by its named assumption. There are no expression strings, functions, products between assumptions, references to other metrics, or executable code. Do not disguise a nonlinear relationship as affine without explicitly explaining and obtaining acceptance of the approximation.

To compare a metric against a variable limit, define a margin metric. For example, `budget_remaining = budget - fixed_cost - unit_cost * volume`, then require that margin `>= 0`.

## Complete minimal example

This is illustrative, not researched service pricing:

```json
{
  "title": "Illustrative service plan comparison",
  "question": "Which plan has the lower modeled monthly cost?",
  "assumptions": [{
    "id": "volume", "label": "Monthly workload", "unit": "units",
    "min": 0, "max": 1000, "default": 300, "step": 10,
    "kind": "estimate", "source": {"label": "Illustrative workload"}
  }],
  "metrics": [{"id": "cost", "label": "Monthly cost", "unit": "USD"}],
  "candidates": [
    {"id": "flex", "label": "Flexible", "metrics": {"cost": {"constant": 0, "coefficients": {"volume": 0.5}}}},
    {"id": "reserved", "label": "Reserved", "metrics": {"cost": {"constant": 100, "coefficients": {"volume": 0.1}}}}
  ],
  "constraints": [],
  "objective": {"metric_id": "cost", "direction": "min"}
}
```

Both options cost 125 at volume 250. Below that value Flexible is cheaper; above it Reserved is cheaper. For a richer example with two hard requirements and three strategies, read the package's `examples/project-delivery.json`.

## Explore and explain

1. Create the study. Report the returned study ID and include its returned `::crux{id="..."}` directive in the assistant reply so Hermes Desktop can render the entry card. Plain-text clients can use the tools and receive JSON results.
2. Call `crux_evaluate` with `study_id`, optional `values`, and `axis` for exact one-assumption analysis. `axes: [x_id, y_id]` additionally requests a sampled map (5–61 positions per axis; default 33).
3. Explain the winning feasible option, relevant constraint slack, and the boundary that actually changes the winning set. A pairwise cost crossing between losing options is not necessarily a recommendation change.
4. The engine evaluates open intervals, boundaries, and endpoints separately. Preserve ties and isolated feasible points. Boundary `exact_value` is a rational string; a rounded display number is not its exact value. Other inputs remain fixed during an axis analysis.
5. When no option fits, explain the returned minimum-cardinality conflicting subset **at the current inputs and among the supplied candidates**. Do not imply the user's whole real-world goal is impossible. Disabling a constraint is a hypothetical comparison, not consent to violate it.
6. `crux_snapshot` saves a label, values, enabled requirements and computed result. Save a scenario when the user asks to retain it. Use `crux_inspect` to recover snapshots. To evaluate a saved scenario again, send its `values` together with `evaluation.enabled_constraint_ids`; preserve an empty array. Restoring numbers alone can change the answer if requirements were relaxed. Listing returns the newest 200 studies and inspecting a study returns its newest 100 snapshots.

The sampled atlas can miss narrow winning regions. It is an exploration aid, not a global proof of robustness, a chance of success, or an alternative to the analytic axis result. Conclusions are conditional on the formulas and inputs supplied.
