# Crux interaction and visual design

Crux helps a Hermes user understand when a recommendation changes and why a set of requirements leaves no supplied option. The primary task is to stress an explicit model, observe the answer, and save the exact point for later discussion. The interface is a mathematical instrument inside Hermes Desktop rather than a generated HTML artifact.

## Product boundaries

The agent supplies finite candidates, numeric assumptions, affine metrics, hard requirements and one explicit objective. No subjective weights are inferred. Exact computations apply to that supplied model; estimates, sources and omitted real-world options remain the user's responsibility to inspect.

The current model supports up to eight assumptions, eight metrics, twelve candidates and ten requirements. One-axis boundary values and minimum-cardinality conflicting requirement sets use the backend's rational arithmetic. The two-axis field is a sampled grid, explicitly labeled as sampled. It is not proof about every point between samples. These distinctions stay visible in the interface.

## Visual authority and source evidence

The official [Desktop Plugin SDK](https://hermes-agent.nousresearch.com/docs/developer-guide/desktop-plugin-sdk) documents full routes, sidebar navigation, scoped REST, transcript directives, gateway events and contribution cleanup. Those are the surfaces Crux uses. The released Hermes v0.23.0 source was inspected for the SDK, theme type definitions and desktop styles. A native Hermes Desktop host was then used for integration review.

The official [Desmos slider guide](https://help.desmos.com/hc/en-us/articles/202529069-Sliders-and-Movable-Points-in-a-Graph) documents bounded numeric controls, shared variables, keyboard adjustment and directly manipulated plots. Crux adapts the relationship between a visible assumption and its consequences; no Desmos screen, assets, branding or proprietary component code was copied. Documentation was reviewed, not a live Desmos runtime.

Microsoft's [Z3 guide on cores and satisfying subsets](https://github.com/microsoft/z3guide/blob/main/website/docs-programming/03%20-%20Example%20Programs/01%20-%20Cores%20and%20Satisfying%20Subsets.md) grounds the distinction between an irreducible conflict and a smallest conflict. Crux does not ship Z3: exhaustive subset enumeration is practical under its finite input bounds, and the backend can honestly report minimum cardinality for the current point and supplied candidates.

## Composition

The decision field occupies the main visual area. Two selected assumptions form its axes. Candidate regions use distinct restrained accents with persistent candidate names; infeasible regions use hatching. The operating point has a high-contrast crosshair and two guides. A separate legend and comparison table preserve identity when colors are difficult to distinguish.

The adjacent result panel states the explicit objective, current winner or tie, objective value and feasible option count. Numeric assumption controls remain close to that result. The following sections expose exact transition values, active hard requirements, saved scenarios, the complete comparison table and a model inspector with sources and formulas.

Crux uses a scoped dark palette within `.crux` so its mathematical field and controls remain legible inside either a light or dark host. It retains the host font families. Native host review exposed mixed light/dark token fallbacks; owning the local instrument palette resolved that without changing the app theme. The original mark is a small inline SVG of intersecting rays. No external font, image, logo or network asset is needed.

Layout queries use the named `crux` CSS container, so a narrow split pane responds to its own available width, independently of the desktop window. Below 850px the result and controls move below the map; below 600px they stack. The SVG switches to a narrower coordinate system when its actual rendered width is below 480px, keeping map labels readable rather than shrinking a desktop canvas. Tables scroll inside their own region.

## Interaction contract

- Dragging the crosshair changes the two axis assumptions. The same operation is available through labeled numeric fields, range inputs and arrow keys while the map is focused.
- Candidate ranks and constraints are evaluated locally by the backend. Changing the two displayed axes reuses the field; changing a non-axis value, active requirement or axis selection recomputes it. Field requests are serialized and obsolete responses are ignored.
- While point results update, the result panel explicitly says it is updating. It does not present the previous winner as the current result. A failed request is shown as an actionable error.
- Exact axis events are grouped using the backend's exact value identifier, without epsilon-based boundary merging. Rational thresholds show the exact fraction as well as an approximate readable decimal. Threshold buttons explore the adjacent open interval; they do not pretend that a rounded slider position reproduces an exact rational tie.
- True point ties show every winning option. An infeasible point shows its computed conflicting requirements and all candidate outcomes. Relaxing a checkbox changes only the exploration, never the immutable saved model.
- Saved scenarios preserve values and the complete active requirement mask, including an empty mask. Restoring a scenario restores both together. Study version one identifies an immutable model; edits create another study.
- The model inspector shows estimate/preference/source status and the actual affine expressions. Its purpose is to make the assumptions inspectable, not to imply their real-world accuracy was verified.
- Native creation cards use the public `::crux{id="..."}` transcript directive. Opening one selects that model in the full route. Invalid directive identifiers render nothing.
- Native REST calls use the plugin's scoped `ctx.rest`; gateway activation changes invalidate outstanding responses. Public events plus a slow refresh update the study list. No active Hermes configuration is changed by the frontend.
- Focus outlines, text labels and patterns complement colors. Reduced-motion preferences disable animation and transitions. No result depends on hover alone.

## Implementation and QA evidence

The packaged `desktop/plugin.js` is an unminified ES module built from React JSX and scoped CSS. Its only runtime imports are React, the JSX runtime and `@hermes/plugin-sdk`. The standalone browser preview uses the same `CruxApp` and the actual FastAPI plugin router, engine and SQLite store; it has no simulated responses.

The reproducible browser smoke is `desktop/tests/browser-smoke.cjs`. Against an isolated preview data directory it verifies:

- The project example starts with Specialist assist; increasing available time changes the winner to Solo sprint.
- Scope 18 with deadline 20 gives the exact Solo/Specialist tie; increasing scope favors Specialist.
- Moving displayed axis values causes zero field refetches.
- Scope 16, deadline 8 and budget 2400 produces the two-requirement conflict; relaxing budget restores Studio.
- Saved scenarios restore disabled requirements and an empty requirement mask exactly.
- Isolated feasible point and range-endpoint outcomes receive exact outcome cards; cent-sized currency and small nonzero metrics remain visible.
- Actual pointer drags use the inverse SVG screen transform, so viewBox letterboxing does not shift the selected assumptions. The smoke drags scope 16/time 12 to scope 16/time 20 in a max-height letterboxed 1600px layout and again after a 390px resize; both produce Solo sprint, and existing region geometry is checked after resize.
- The model inspector, keyboard map manipulation, a 390px viewport and a 450px embedded pane inside a 1440px viewport work without page overflow or browser runtime errors.
- The scoped dark palette remains unchanged when the surrounding host tokens are light.

Standalone screenshots at 1440px and 390px were visually inspected. Native host screenshots were separately reviewed during integration. This establishes the tested examples and layouts; it does not establish usability for every possible twelve-candidate model or every assistive technology. The inspector's longer formulas and the comparison table use progressive disclosure/scrolling for that density.
