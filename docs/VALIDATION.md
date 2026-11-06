# Validation evidence

Target: released Hermes Agent **v0.23.0**, commit `2bd378ed1b8d6bf2192cb26e0a55ff3091e6bd19` (published November 5, 2026). Tests used that actual source and its PM-managed Python 3.14.9 runtime. No upstream source or active user installation/configuration was changed.

## Automated behavior

**38 tests passed in the released Hermes runtime.** The stdlib-only run passes 24 checks and skips 14 checks that require the Hermes/FastAPI/httpx host. Tests use temporary homes and the public context-local Hermes home override; no test contacts a running production gateway.

- Exact rational crossing at 1/3 and boundary ties; both minimization and maximization; identical candidates tied throughout the range.
- A narrow winning interval at `0.500005..0.500015` is recovered analytically even when a coarse atlas cannot see it.
- A candidate feasible only at one equality boundary remains visible through separately evaluated boundaries/endpoints.
- Infeasible cheap candidates cannot defeat feasible candidates.
- Conflict search finds a minimum-cardinality subset, including an adversarial case where a greedy irreducible subset would be larger.
- Non-finite/boolean/giant numeric inputs, executable expression strings, unknown references, malformed/unhashable fields, invalid masks, oversized collections and out-of-range values are refused.
- Immutable models and snapshots survive module reload; saved positions do not mutate model defaults; the illustrative description survives persistence.
- Missing/traversal ids are refused. Context-local profile switches deny foreign reads, evaluations and snapshot writes; returning to the first profile recovers its own records.
- REST recomputes snapshot results from the stored model and supplied values. Client-supplied evaluations, model ids and versions cannot overwrite or impersonate an existing study. Empty requirement masks remain empty.
- Real Hermes `PluginManager` discovers and imports the package, registers all four tools and its skill.
- Real `model_tools.handle_function_call` creates/evaluates/inspects a study shared with the actual authenticated `hermes_cli.web_server` plugin router; HTTP and tool evaluation results match.
- Host authentication refuses anonymous plugin API access. Invalid REST input returns 422 without writes; unknown studies return 404.
- Skill example schema, stated crossover arithmetic and published tool names match the executable implementation.
- Four concurrent writers across two cold profile databases create and snapshot eight isolated studies without contamination. Initial WAL selection uses a bounded transient-lock retry before any write transaction is opened.

Run core tests from the repository root:

```bash
python3 -m unittest discover -s tests -v
```

Run the same suite in a Hermes environment with FastAPI/httpx available to include all host tests. The development session used an explicit isolated data root, the managed Hermes Python interpreter, `hermes_bootstrap`, then `unittest.defaultTestLoader.discover(...)`. The test code itself provisions temporary homes and removes them after completion.

## Official plugin checks

`hermes plugins doctor /path/to/hermes-crux --ci` passed actual discovery, manifest parsing, import and registration: **4 tools, 0 hooks**.

`hermes plugins validate /path/to/clean/hermes-crux --install-deps` passed manifest/schema checks, the released-version floor, loadable entrypoints, isolated registration, declared tools/hooks/middleware consistency, built-in collision checks, install scanner, no core runtime overrides, and Desktop SDK surface checks. Validation was run on a clean copy excluding development `node_modules`, caches and generated standalone preview output; the distributed Desktop `plugin.js` was included.

The final check against the finished Desktop bundle passed with **security scan: safe**, no core overrides, and no Desktop SDK surface violations. No plugin-specific Python dependencies or privileged capability grants are declared.

## Numerical and performance limits

Point comparisons and one-axis analytic partitions use `Fraction(str(input))`, not a sampling tolerance. Boundary, regime and endpoint metadata preserve exact rational coordinates separately from JSON number display values. A rounded slider value can be slightly to one side of a non-decimal boundary; use the returned exact boundary outcome for equality claims.

The atlas is sampled explicitly and never claims proof between samples or likelihood. Tests and UI distinguish it from analytic axis results. Limits are 8 assumptions, 8 metrics, 12 candidates, 10 hard requirements, and 5–61 sample positions per axis; request objects are capped at 128 KiB. A 41×41 atlas plus axis analysis on the included three-option fixture took about 0.16 seconds locally. A maximum-shape 12-option, 8-metric, 8-assumption, 10-requirement 41×41 atlas took about 3.75 seconds. These measurements are development-machine observations, not service guarantees.

## Scope of evidence

The finished plugin was also loaded through the **real released Hermes Webapp**, which uses the Desktop renderer and SDK, in an isolated test home. The native Plugins UI discovered the unified package, its Desktop switch enabled the sidebar contribution, and its actual authenticated REST bridge created and evaluated the illustrative model. Native interactions verified the default winner, the exact Solo/Specialist tie at scope 18 and deadline 20, the two-requirement conflict at scope 16/deadline 8/budget 2400, and restoration of a saved requirement mask. No browser page errors were observed. The transcript directive rendered from an explicitly seeded test conversation and its button opened the correct study; this was a renderer fixture, not a live LLM-generated answer.

The reproducible browser smoke additionally exercises the same frontend against the actual plugin router: real pointer dragging at a 1600-pixel viewport and after resizing to 390 pixels, keyboard atlas controls, narrow and isolated boundary outcomes, endpoint outcomes, cent-level prices, an empty saved requirement mask, a 390-pixel mobile viewport, and a 450-pixel embedded pane inside a larger viewport. No horizontal overflow occurred in those narrow layouts. The plugin palette remained readable under a light host theme. Moving the two plotted inputs reused the map and requested only the point/axis analysis. Creating two successive example models with identical defaults loaded a fresh map for each model.

Screenshots: [native Hermes](screenshots/native-hermes.png), [atlas](screenshots/atlas.png), and [mobile](screenshots/mobile.png). The visual evidence is separate from the mathematical guarantees.

The core integration tests exercise the real loader, executor and authenticated router using in-process plugin hosting. The official validator also checks the package's default isolated plugin-host admission. Native browser UI loading and interaction are separate end-to-end checks documented in the handoff; the mathematical suite alone does not establish visual behavior. No live LLM call, external provider API, publication, plan execution, or catalog admission is needed for these checks.
