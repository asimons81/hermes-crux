# Crux: catalog collision audit

Audit performed November 5, 2026, America/Chicago (November 6 UTC). This is a scoped comparison of published evidence, not a guarantee about unpublished projects or future catalog additions.

## The useful capability

Crux answers a concrete question: **which option survives my constraints, and exactly what assumption would make me change my choice?**

The core is a local, deterministic decision model: finite options, affine formulas, explicit assumption ranges and hard constraints. Its distinguishing outputs are feasible options, exact one-assumption rank-reversal thresholds, a sampled two-assumption decision-region map, and a smallest-cardinality conflicting constraint set when none of the options works at the current values. Changes to sliders recompute the model; they do not ask a language model to invent another answer. The two-dimensional map is explicitly a bounded grid, not an analytic proof of robustness between pixels.

This supports decisions such as in-house versus outsourced production, a cloud plan versus local hardware, or competing delivery plans. Values supplied by an agent remain assumptions until the user checks their sources. A computed answer proves a property of the supplied model, not that the supplied facts are true.

## Scope and method

1. Cloned the live canonical `NousResearch/hermes-agent` repository with a sparse checkout of the complete `plugin-catalog/` directory. The audited immutable commit is [`ca4360692055bdb4df3a695c164646e528891da8`](https://github.com/NousResearch/hermes-agent/tree/ca4360692055bdb4df3a695c164646e528891da8/plugin-catalog).
2. Counted **1,064 YAML files: 1,063 plugin entries plus `removed.yaml`**. Reviewed the full name/description inventory across the whole alphabet, then searched complete entry metadata for possible capability overlaps. This was not a search for the word “Crux” alone. It was not a source-code audit of every repository.
3. Read full entry metadata for the closest candidates. Fetched the pinned READMEs for GenUI, Epistemic Harness and Decisions, and inspected GenUI's actual calculator validator, simulation validator and expression evaluator at its catalog pin.
4. Retrieved **716 open PRs** returned by `repo:NousResearch/hermes-agent is:pr is:open catalog in:title` (eight pages, at audit time). Searched their titles and full bodies for rank reversal, Pareto, sensitivity, break-even, decision boundary, decision lab, affine, robustness, constraint solving, scenario comparison and what-if; inspected relevant descriptions. Additional broader open-PR searches covered decision, sensitivity and constraint. This search can miss a submission whose title and body do not describe its capabilities, and excludes unpublished work.

The canonical inventory and exact SHA make the merged-entry check reproducible. The research working directory also retains the downloaded entry inventory, README/code evidence and open-PR JSON; those files are research evidence rather than runtime dependencies.

## Closest merged entries

| Existing plugin | Evidence inspected | Existing outcome | Difference required of Crux |
| --- | --- | --- | --- |
| Hermes GenUI | [Pinned catalog entry](https://github.com/NousResearch/hermes-agent/blob/ca4360692055bdb4df3a695c164646e528891da8/plugin-catalog/hermes-genui.yaml), [pinned README](https://github.com/sagarmainkar/hermes-genui/blob/43de4cdba042ebb087e44ccd6e0ba4f87769b67b/README.md), [calculator](https://github.com/sagarmainkar/hermes-genui/blob/43de4cdba042ebb087e44ccd6e0ba4f87769b67b/blocks/calculator.py), [simulate](https://github.com/sagarmainkar/hermes-genui/blob/43de4cdba042ebb087e44ccd6e0ba4f87769b67b/blocks/simulate.py), [formula evaluator](https://github.com/sagarmainkar/hermes-genui/blob/43de4cdba042ebb087e44ccd6e0ba4f87769b67b/web/src/lib/formula.ts) | Real interactive JSON blocks, including safe-parser calculators, sliders, comparisons, formula charts and time simulations. | A formula parser, sliders, charts or attractive comparisons alone would duplicate this. The inspected components evaluate supplied formulas; they do not provide Crux's finite-option feasibility analysis, exact decision boundaries, or conflicting-constraint explanation. |
| Epistemic Harness | [Catalog entry](https://github.com/NousResearch/hermes-agent/blob/ca4360692055bdb4df3a695c164646e528891da8/plugin-catalog/epistemic-harness.yaml), [pinned README](https://github.com/quangphucqp/epistemic-harness/blob/5abd0dc482096c3f64379115fc79cc96e4e7203a/README.md) | An agent commits an investigation prediction, performs a tool check, records the observation, and revises a local case. | Crux solves an explicit numerical choice model. It does not claim to improve investigation or record empirical prediction checks. |
| Decisions | [Catalog entry](https://github.com/NousResearch/hermes-agent/blob/ca4360692055bdb4df3a695c164646e528891da8/plugin-catalog/decisions.yaml), [pinned README](https://github.com/eve-ai-dev/hermes-decisions-plugin/blob/eeac2eac98a3d1f566dc020912bb378aece431f8/README.md) | Background jobs call a paid hosted model's predicate Decisions API and return session-owned structured results. | Crux uses local arithmetic and constraints; it does not ask a remote decision model which option is better. |
| GoNoGo | [Catalog entry](https://github.com/NousResearch/hermes-agent/blob/ca4360692055bdb4df3a695c164646e528891da8/plugin-catalog/gonogo.yaml) | Wilson confidence intervals and human routing turn pilot evaluation results into a deployment decision. | Crux compares deterministic options under variable assumptions. It must not present a grid proportion or assumed interval as a statistical confidence estimate. |
| AI SENSE Free Public Tools | [Catalog entry](https://github.com/NousResearch/hermes-agent/blob/ca4360692055bdb4df3a695c164646e528891da8/plugin-catalog/aisense.yaml), [pinned Decide contract](https://github.com/aisenseapi/aisense-free-public-rest-apis/blob/3a646585c2ab979da025ba057bd5b9fb049c0fba/API.md#logic) | A hosted utility bundle includes typed choices from weighted conditional rules: sigmoid/softmax of matching rule weights, with optional hosted decision models. | Its rules produce an answer at the submitted state. The inspected contract does not offer Crux's affine option costs, constraint-feasible ranking, exact assumption-axis partitions or native sensitivity explorer. |
| Model Leaderboard | [Catalog entry](https://github.com/NousResearch/hermes-agent/blob/ca4360692055bdb4df3a695c164646e528891da8/plugin-catalog/model-leaderboard.yaml) | Model rankings, benchmark/price criteria and a quality-versus-cost Pareto visualization. | Crux must not claim the first comparison or Pareto display. Its distinct result is a domain-independent, user-declared affine choice model with hard constraints and analytic one-axis changes. |
| WheelSpin | [Catalog entry](https://github.com/NousResearch/hermes-agent/blob/ca4360692055bdb4df3a695c164646e528891da8/plugin-catalog/wheelspin.yaml) | Weighted animated random selection with a chat result. | Crux is reproducible feasibility and preference analysis, not chance selection. |
| UX3 Product Design Harness | [Catalog entry](https://github.com/NousResearch/hermes-agent/blob/ca4360692055bdb4df3a695c164646e528891da8/plugin-catalog/ux3-product-design-harness.yaml) | Product judgment delivered as a skill package. | Crux's numerical engine and direct manipulation are executable capabilities, rather than an editorial decision framework. |

## Relevant open submissions

| Submission | Inspected behavior | Assessment |
| --- | --- | --- |
| [SolverForge Planner, PR #149647](https://github.com/NousResearch/hermes-agent/pull/149647) | A constraint solver places tasks around meetings, deadlines, dependencies and focus hours; a native planner page previews calendar changes. The PR describes a hackathon entry. | Constraint solving is adjacent, but the product is calendar scheduling. Crux must remain an assumption-driven option comparison and sensitivity workbench. Do not market generic “first constraint solver for Hermes.” |
| [TuringCorp Decider, PR #129404](https://github.com/NousResearch/hermes-agent/pull/129404) | A hosted model chooses between two prose options and returns calibrated confidence and a reason. | Different mechanism and result: it has no documented local affine model, exact numeric boundary analysis or decision-region explorer. |

No equivalent to the complete Crux capability was identified in this scoped review. This conclusion depends on shipping the solver behavior above. A generic interactive calculator with a different name would not satisfy it. Repeat the live catalog and open-submission check before submission, since the hackathon is active.

## Rejected neighboring directions

- A visual agent town or office has direct existing alternatives: `hermes-town`, `hermesford`, `hermes-quest`, `pixel-worlds`, `office-3d`, `hermes-office` and `deskrpg`.
- A situational-awareness globe already exists as `hermes-osint-map`.
- Visual feedback pins are substantially covered by `mock-review` and the open [Creative Review PR #149654](https://github.com/NousResearch/hermes-agent/pull/149654). Text/code annotation is already `redline`.
- Transactional file organization overlaps `filebox`, `undo-effects`, `deadbolt` and the open [stage PR #149328](https://github.com/NousResearch/hermes-agent/pull/149328).

## Independence from upstream work

Crux must use public plugin tools, authenticated plugin API routes and native Desktop SDK areas available in the released Hermes version it declares. The engine should be pure local source code and need no external solver service, SDK addition or core patch. Catalog listing itself still requires the normal maintainer-reviewed entry PR; that admission step is distinct from requiring a core fix before the plugin can work.
