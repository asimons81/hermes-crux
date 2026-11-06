# Crux v1 integration contract

One package id: `hermes-crux`. Python `dashboard/plugin_api.py` exports `router = APIRouter()`; Hermes mounts it at `/api/plugins/hermes-crux`. Desktop calls `ctx.rest('/studies')`; standalone browser preview calls the full prefixed path. Agent tools and REST share SQLite state, with no global cached profile path.

## Model

See `examples/project-delivery.json` for a complete loadable fixture. A study has `title`, `question`, `assumptions`, `metrics`, `candidates`, `constraints`, `objective`, and optional `description` (up to 2000 characters, preserved verbatim apart from outer whitespace).

- Assumption: `{id,label,unit,min,max,step,default,kind:'measured'|'estimate'|'preference',source?:{label,url?}}`.
- Metric: `{id,label,unit}`.
- Candidate: `{id,label,description?,metrics:{metric_id:{constant:number,coefficients:{assumption_id:number}}}}`. Every candidate defines every metric. There are no executable formulas, imports, hidden weights, or implicit utility functions.
- Requirement: `{id,label,metric_id,operator:'<='|'>=',value:number}`.
- Objective: `{metric_id,direction:'min'|'max'}`. Only feasible candidates compete for best objective.

Caps: 8 assumptions, 8 metrics, 12 candidates, 10 requirements; finite numeric inputs within ±1e12; bounded strings; 128 KiB HTTP/tool objects; ids lowercase letters/digits/underscore/hyphen with leading letter. Values stay within declared ranges. These are exploratory bounds, never probability distributions.

Arithmetic converts decimal inputs using `Fraction(str(value))`. Point comparisons and analytic one-axis boundaries use rational arithmetic with no epsilon. Returned numeric views use JSON numbers; every boundary also carries `exact_value` as an integer or numerator/denominator string.

## REST

- `GET /health` → `{ok,plugin,version,model,arithmetic}`.
- `GET /studies` → `{studies:[{id,title,question,version,created_at}]}` (newest 200).
- `POST /studies` body `{study:<model>}` → HTTP 201 `{study:<model with id>,version:1,created_at,snapshots:[]}`.
- `GET /studies/{id}` → `{study,version,created_at,snapshots}` (newest 100 snapshots for this study).
- `POST /studies/{id}/evaluate` body `{values?:{assumption_id:number},axis?:assumption_id,axes?:[x_id,y_id],resolution?:5..61,enabled_constraint_ids?:[id]}` → evaluation below. Missing values use model defaults; omitted requirement list enables all; empty list enables none. These overrides never mutate the saved model.
- `POST /studies/{id}/snapshots` body `{values,label,axis?,enabled_constraint_ids?}` → HTTP 201 `{id,study_id,label,created_at,values,evaluation}`. Saved positions are immutable.
- `GET /demos` → `{demos:[{id,title,description}]}`.
- `POST /demos/project-delivery` → same envelope as creating a study.

Study ids are generated 32-character lowercase hex strings; supplied ids are ignored on creation. No update/delete endpoint exists: edit the model by creating a new study. `version:1` identifies an immutable model rather than an in-place revision counter. Validation errors return HTTP 422 with `detail`; unknown stored ids return 404.

Snapshot requests supply a position, label and optional active-requirement subset. Client-supplied `evaluation`, model ids and model content are not trusted: the backend recomputes the result from the stored model identified by the route or tool's `study_id`. The result is associated with that immutable model in the active profile. Immutability describes the API's append-only behavior; local SQLite records are not signed attestations of real-world facts.

To restore a saved scenario, use both `snapshot.values` and `snapshot.evaluation.enabled_constraint_ids`. The latter may be an empty array, meaning every requirement was hypothetically relaxed. Restoring the values alone uses whichever requirements are active now and can produce a different answer. A saved axis analysis is optional; chart axes are presentation state rather than part of the decision point.

## Evaluation envelope

```json
{
  "study_id": "generatedhex",
  "version": 1,
  "point": {
    "values": {"scope": 16},
    "rankings": [{"candidate_id":"specialist","feasible":true,"metrics":{"cost":2450},"failed_constraints":[],"constraint_details":[{"id":"deadline","value":3.6,"slack":3.6,"passed":true}],"objective_value":2450,"rank":1}],
    "winner_ids": ["specialist"],
    "feasible_ids": ["specialist","studio"],
    "status": "winner"
  },
  "enabled_constraint_ids": ["deadline","budget"],
  "axis": {
    "assumption_id":"scope",
    "regimes":[{"from":4,"to":10,"winner_ids":["solo"],"feasible_ids":["solo","specialist"]}],
    "boundaries":[{"value":10,"exact_value":"10","kind":"constraint","candidate_ids":["solo"],"constraint_id":"deadline","winner_ids":["solo"],"feasible_ids":["solo","specialist"]}],
    "endpoints":[{"value":4,"winner_ids":["solo"],"feasible_ids":["solo","specialist"]}],
    "method":"analytic_affine_rational",
    "interval_semantics":"open_interiors; boundaries and endpoints evaluated separately",
    "scope":"other_assumptions_fixed_at_current_values"
  },
  "atlas": {
    "axes":["scope","deadline"],"x_values":[4,10],"y_values":[4,10],
    "cells":[[null,"studio"],["solo","specialist"]],
    "tie_cells":[],"winner_sample_counts":{"solo":1,"specialist":1,"studio":1},
    "infeasible_sample_count":1,"method":"sampled_grid","resolution":33,"notice":"..."
  },
  "conflict":null,
  "semantics":"..."
}
```

The example is abbreviated to illustrate shape. `axis` and `atlas` are included only when requested. `rankings` lists feasible candidates first in objective order, then infeasible candidates. True objective ties share rank and are all in `winner_ids`; infeasible rows have rank null. Status is `winner`, `tie`, or `infeasible`.

Axis analysis includes **every** objective pair crossing and each candidate/requirement feasibility boundary in range, including boundaries of irrelevant/infeasible alternatives. Coincident events may share one value. Regimes describe open interval interiors; exact boundary and range-endpoint outcomes are returned separately, so isolated feasible points and ties are not lost. Other assumptions stay fixed at their current values. It makes no whole-domain or global probability claim.

Regimes also include `exact_from` and `exact_to`, and endpoints include `exact_value`. Use these rational strings when float display values would round distinct nearby boundaries to the same number.

Atlas rows run from minimum to maximum y, columns minimum to maximum x. `cells[y][x]` is first winner id or null if infeasible. `tie_cells` records all tied winner ids at that grid node. The grid is explicitly sampled and is **not** proof of robustness between samples; winner counts are sample-node counts, never percentages of likelihood. Tied nodes count once for every winning candidate, so counts can overlap.

When no candidate is feasible, `conflict` is `{constraint_ids,candidate_ids,scope:'current_point_declared_candidates',minimum_cardinality:true,explanation}`. Exhaustive subset search (at most 1024 subsets) returns one minimum-cardinality requirement subset that leaves no declared candidate feasible at the **current point**. This does not prove that the real-world problem has no solution, or that changing inputs cannot help.

## Agent and live UI

`crux_create({study})`, `crux_inspect({study_id?})`, `crux_evaluate({study_id,...evaluation_request})`, `crux_snapshot({study_id,...snapshot_request})`. Tools return JSON text, including a structured `error` on invalid input. Creation returns `directive: '::crux{id="..."}'`; the skill teaches the agent to emit it as its own paragraph.

On study/snapshot creation the backend emits `plugin.hermes-crux.study.changed` with `{id,version:1}` through the public Hermes event bridge. Desktop should subscribe via `ctx.onEvent` and refetch, with initial GET and slow polling/reconnect refresh. Events are hints, not the source of truth. Backend and Desktop halves have separate enable switches; unavailable REST must show an actionable empty state.
