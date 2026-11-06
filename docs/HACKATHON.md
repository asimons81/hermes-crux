# Hermes Agent Plugin Hackathon preparation

Rules checked November 5, 2026, America/Chicago. This file prepares the entry and demo; it does not claim a submission, catalog PR, public demo or prize.

## Official requirements

Nous Research's [official announcement on X](https://x.com/NousResearch/status/2118094256438936062) is also reproduced on its [official LinkedIn page](https://hr.linkedin.com/company/nousresearch), where the announcement text was accessible during this check. The X page itself returned an access error to the research browser.

- Deadline: **November 11, 2026, 5:00 PM EST** (4:00 PM America/Chicago).
- Any kind of Hermes plugin is eligible. The entry is the plugin itself.
- Open a PR adding the plugin to the Hermes plugin catalog.
- Post a working demo on X, tag `@NousResearch`, and keep the video **under 90 seconds**.
- Submit the PR link and X-demo link through the [official entry form](https://form.typeform.com/to/FwJLvOln). The form can be submitted once the PR is open; merged catalog admission is not stated as a precondition to submitting the form.
- Judges consider usefulness, reliability, polish and creativity, and prefer capabilities beyond what a prompt or skill alone can provide.
- Announced cash prizes: $10,000 / $5,000 / $2,500 / $1,500 / $1,000 for places one through five, with additional merchandise and credits; five runners-up receive merchandise and credits.

## Catalog admission requirements that affect this build

The authoritative policy is [`plugin-catalog/README.md`](https://github.com/NousResearch/hermes-agent/blob/ca4360692055bdb4df3a695c164646e528891da8/plugin-catalog/README.md), mirrored by the [official submission guide](https://hermes-agent.nousresearch.com/docs/developer-guide/plugins/catalog-submission). Recheck the current rules before filing.

- Publish a public, loadable repository. Add `plugin-catalog/<name>.yaml` with its full 40-character commit SHA and quoted version.
- Run `hermes plugins validate /path/to/plugin --install-deps` on that commit, plus `hermes plugins doctor /path/to/plugin --ci`.
- Use documented registration APIs and the Desktop SDK. Core overrides, internal-store access and core-markup patches are refused.
- Declare actual capabilities and a truthful released-version SemVer floor.
- Supply UI screenshots, readable source, bounded dependencies and rule-13 disclosures. Exclude self-updaters and remotely loaded executable UI.
- Route any credentials through Hermes. Crux's numerical engine needs none.
- Maintainers start catalog CI and decide admission. Submission and acceptance are separate states.

Crux's additional implementation constraint is to work with already released interfaces, without waiting for an SDK addition or core fix.

## Proposed 82-second working demo

Use the actual native Hermes Desktop extension and a saved, explicit fixture. Any demo-only fixture must be labeled. Never present a static mockup or precomputed animation as an interactive computation.

| Time | Action | What the viewer learns |
| --- | --- | --- |
| 0–8 s | Open `examples/project-delivery.json`, visibly labeled illustrative estimates. Ask which of Solo sprint, Specialist assist and Studio build fits the scope, deadline and budget. | The problem is a concrete choice under uncertain inputs. |
| 8–20 s | At scope 16, deadline 12 days and budget $4,500, show Specialist assist: $2,450 and 8.4 days. Solo costs $2,350 but needs 13.2 days. Inspect the source labels and deadline rule. | The cheapest option is not always feasible. |
| 20–35 s | Set the deadline to 20 days; Solo wins at scope 16. Drag scope across the exact tie at 18 units ($2,600 each). Past 18, Specialist becomes cheaper. | This is an executable decision model with an inspectable crossing. |
| 35–49 s | Move the crosshair on the scope/deadline decision map at budget $4,500. Explain the named axes and the feasibility boundary. | Users see where a recommendation changes and why. |
| 49–64 s | Set scope 16, deadline 8 days, budget $2,400. Show no feasible option and the two-rule conflict: Solo fits the budget but misses the deadline; Studio meets the deadline but exceeds the budget. | Crux explains infeasibility instead of forcing an answer. |
| 64–75 s | Restore the budget to $4,500: Studio becomes feasible at $3,320 and 6.52 days. Save a snapshot with the model and assumptions. | A changed answer has a visible reason and a reproducible record. |
| 75–82 s | Show the install command and a short statement that the solver recomputes locally with no model call per drag. | The viewer knows what installing the plugin adds. |

Any claim about exactness must match the released affine-only scope. A region map's rendered pixels are a visual representation; use the engine's actual analytic boundary calculations to establish narrow intervals and ties. Do not call sampled area a probability, a confidence score or a proof of all scenarios.

## Submission receipt to fill after authorized external actions

- Public repository and immutable commit: pending.
- Catalog PR: pending.
- Local release validation/Doctor: passed; see [validation evidence](VALIDATION.md) and [runtime hash receipt](validation-receipt.json). Re-run on the public pinned commit before submitting.
- Native Desktop screenshots and interaction verification: completed against released v0.23.0 in an isolated test home; see [validation evidence](VALIDATION.md).
- Public X demo, under 90 seconds, tagging Nous: pending.
- Entry form submitted with both links: pending.
