import React, { useState, useEffect, useRef, useMemo } from "react";
import { styles } from "./styles.js";
const COLORS = [
  "#65dbd2",
  "#b7a0f8",
  "#efb66b",
  "#80bced",
  "#ee9ba8",
  "#b8ce80",
  "#8eacff",
  "#f49d7e",
  "#9bd6e8",
  "#e4d29c",
  "#d8a4de",
  "#a5d5aa",
];
const fmt = (n, unit) =>
  Number.isFinite(n)
    ? unit === "USD"
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(n)
      : new Intl.NumberFormat(
          "en-US",
          n !== 0 && Math.abs(n) < 0.01
            ? { maximumSignificantDigits: 3 }
            : { maximumFractionDigits: 2 },
        ).format(n)
    : "—";
const join = (a) => a.filter(Boolean).join(" ");
// Use the declared decimal step for display snapping without truncating small values.
const decimalPlaces = (value) => {
  const [mantissa, exponent = "0"] = String(value).toLowerCase().split("e");
  return Math.max(0, (mantissa.split(".")[1]?.length || 0) - Number(exponent));
};
const roundToStepPrecision = (value, assumption) => {
  const places = Math.max(
    decimalPlaces(assumption.min),
    decimalPlaces(assumption.step),
  );
  return places <= 100
    ? Number(value.toFixed(places))
    : Number(value.toPrecision(15));
};
const defaults = (s) =>
  Object.fromEntries(s.assumptions.map((a) => [a.id, a.default]));
const Mark = () => (
  <svg
    className="cx-glyph"
    viewBox="0 0 32 32"
    width="28"
    height="28"
    aria-hidden="true"
  >
    <path
      d="M16 3v26M3 16h26M7 7l18 18M7 25L25 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <circle cx="16" cy="16" r="3" fill="currentColor" />
  </svg>
);
const Arrow = () => <span aria-hidden="true">↗</span>;
export function CruxApp({
  api,
  initialId,
  onNavigate,
  compact = false,
  refreshEpoch = 0,
}) {
  const [list, setList] = useState([]),
    [study, setStudy] = useState(null),
    [version, setVersion] = useState(1),
    [selected, setSelected] = useState(initialId || ""),
    [values, setValues] = useState({}),
    [axes, setAxes] = useState([]),
    [enabled, setEnabled] = useState([]),
    [ev, setEv] = useState(null),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [inspector, setInspector] = useState(false),
    [snapshots, setSnapshots] = useState([]),
    [snapshotLabel, setSnapshotLabel] = useState(""),
    [saving, setSaving] = useState(false),
    [atlasData, setAtlasData] = useState(null),
    [mapBusy, setMapBusy] = useState(false);
  const mapQueue = useRef(Promise.resolve());
  const serial = useRef(0),
    mapSerial = useRef(0),
    loaded = useRef(null);
  const atlasKey = study
    ? JSON.stringify({
        selected,
        axes,
        enabled,
        other: Object.fromEntries(
          Object.entries(values).filter(([id]) => !axes.includes(id)),
        ),
      })
    : "";
  async function refreshList() {
    const r = await api("/studies");
    setList(r.studies || []);
    return r.studies || [];
  }
  useEffect(() => {
    let live = true;
    setLoading(true);
    refreshList()
      .then((l) => {
        if (!live) return;
        if (initialId) setSelected(initialId);
        else if (l.length) setSelected(l[0].id);
        else setLoading(false);
      })
      .catch((e) => {
        if (live) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => {
      live = false;
    };
  }, [api, initialId]);
  useEffect(() => {
    if (refreshEpoch) refreshList().catch((e) => setError(e.message));
  }, [refreshEpoch]);
  useEffect(() => {
    if (!selected) return;
    let live = true;
    setLoading(true);
    setError("");
    api("/studies/" + encodeURIComponent(selected))
      .then((r) => {
        if (!live) return;
        loaded.current = selected;
        setStudy(r.study);
        setVersion(r.version || 1);
        setValues(defaults(r.study));
        setAxes(r.study.assumptions.slice(0, 2).map((a) => a.id));
        setEnabled(r.study.constraints.map((c) => c.id));
        setSnapshots(r.snapshots || []);
        setEv(null);
        setAtlasData(null);
        setLoading(false);
      })
      .catch((e) => {
        if (live) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => {
      live = false;
    };
  }, [selected, api]);
  useEffect(() => {
    if (!study || loaded.current !== selected || !axes.length) return;
    const request = ++serial.current;
    setBusy(true);
    const timer = setTimeout(() => {
      api("/studies/" + encodeURIComponent(selected) + "/evaluate", {
        method: "POST",
        body: { values, axis: axes[0], enabled_constraint_ids: enabled },
      })
        .then((r) => {
          if (serial.current !== request) return;
          setEv(r);
          setBusy(false);
          setError("");
        })
        .catch((e) => {
          if (serial.current === request) {
            setError(e.message);
            setBusy(false);
          }
        });
    }, 65);
    return () => {
      clearTimeout(timer);
      serial.current++;
    };
  }, [study, selected, values, axes, enabled, api]);
  useEffect(() => {
    if (!study || loaded.current !== selected || !axes.length || compact)
      return;
    let live = true;
    const request = ++mapSerial.current;
    setMapBusy(true);
    const timer = setTimeout(() => {
      mapQueue.current = mapQueue.current
        .catch(() => {})
        .then(() => {
          if (request !== mapSerial.current) return;
          return api("/studies/" + encodeURIComponent(selected) + "/evaluate", {
            method: "POST",
            body: {
              values,
              axes: axes.length > 1 ? axes : undefined,
              resolution: 45,
              enabled_constraint_ids: enabled,
            },
          })
            .then((r) => {
              if (live && request === mapSerial.current) {
                setAtlasData(r.atlas);
                setMapBusy(false);
              }
            })
            .catch((e) => {
              if (live) {
                setError(e.message);
                setMapBusy(false);
              }
            });
        });
    }, 150);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [study, atlasKey, api, compact]);
  const candidates = study?.candidates || [],
    assumptions = study?.assumptions || [],
    metrics = study?.metrics || [];
  const candidate = (id) => candidates.find((c) => c.id === id),
    assumption = (id) => assumptions.find((a) => a.id === id),
    metric = (id) => metrics.find((m) => m.id === id),
    color = (id) =>
      COLORS[
        Math.max(
          0,
          candidates.findIndex((c) => c.id === id),
        ) % COLORS.length
      ];
  const point = busy ? null : ev?.point,
    winners = point?.winner_ids || [],
    winner = candidate(winners[0]),
    objective = metric(study?.objective?.metric_id),
    rankings = point?.rankings || [];
  const feasible =
    point?.feasible_ids ||
    rankings.filter((r) => r.feasible).map((r) => r.candidate_id);
  const winnerRow = rankings.find((r) => r.candidate_id === winner?.id);
  const setValue = (id, n) => {
    const a = assumption(id);
    if (!a || !Number.isFinite(n)) return;
    const snapped = a.min + Math.round((n - a.min) / a.step) * a.step;
    setValues((v) => ({
      ...v,
      [id]: Math.min(a.max, Math.max(a.min, roundToStepPrecision(snapped, a))),
    }));
  };
  async function demo() {
    setLoading(true);
    setError("");
    try {
      const r = await api("/demos/project-delivery", { method: "POST" });
      await refreshList();
      const id = r.study?.id || r.id;
      if (!id) throw Error("The demo response did not include a study id.");
      setSelected(id);
      if (selected === id) {
        loaded.current = null;
        setSelected("");
        setTimeout(() => setSelected(id), 0);
      }
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }
  async function save() {
    if (!study) return;
    setSaving(true);
    setNotice("");
    try {
      const r = await api(
        "/studies/" + encodeURIComponent(selected) + "/snapshots",
        {
          method: "POST",
          body: {
            values,
            label: snapshotLabel.trim() || "Scenario " + (snapshots.length + 1),
            enabled_constraint_ids: enabled,
          },
        },
      );
      const data = await api("/studies/" + encodeURIComponent(selected));
      setSnapshots(data.snapshots || [...snapshots, r.snapshot || r]);
      setSnapshotLabel("");
      setNotice("Scenario saved with this model version.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  if (compact)
    return (
      <div className="crux">
        <style>{styles}</style>
        <div className="cx-inline">
          <span className="cx-eyebrow">
            <Mark /> CRUX / DECISION MODEL
          </span>
          <h3>{study?.title || "Explore the decision"}</h3>
          <p>
            {loading
              ? "Loading model…"
              : study?.question ||
                error ||
                "A persistent, interactive decision model."}
          </p>
          {winner && (
            <div className="cx-inline-result">
              <i style={{ background: color(winner.id) }} /> {winner.label}{" "}
              <span>
                {fmt(
                  winnerRow?.objective_value ??
                    winnerRow?.metrics?.[objective?.id],
                  objective?.unit,
                )}
              </span>
            </div>
          )}
          <button
            className="cx-btn cx-btn-primary"
            onClick={() => onNavigate?.(selected)}
          >
            Open decision atlas <Arrow />
          </button>
          <small>
            Exact thresholds · Feasibility · Conflicting constraints
          </small>
        </div>
      </div>
    );
  return (
    <div className="crux">
      <style>{styles}</style>
      <main className="cx-shell">
        <header className="cx-top">
          <div className="cx-brand">
            <Mark /> CRUX{" "}
            <span className="cx-brand-sub">DECISIONS, UNDER PRESSURE.</span>
          </div>
          <div className="cx-top-actions">
            {list.length > 0 && (
              <select
                aria-label="Choose decision model"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {list.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            )}
            <button className="cx-btn cx-btn-quiet" onClick={demo}>
              Open example <Arrow />
            </button>
          </div>
        </header>
        {error && (
          <div className="cx-alert" role="alert">
            <strong>Couldn’t complete that.</strong> {error}
            <button className="cx-text-btn" onClick={() => setError("")}>
              Dismiss
            </button>
          </div>
        )}
        {loading ? (
          <div className="cx-empty" role="status">
            <span className="cx-orbit" />
            <h2>Preparing the instrument.</h2>
            <p>Loading your decision model.</p>
          </div>
        ) : !study ? (
          <div className="cx-empty">
            <span className="cx-empty-symbol">✳</span>
            <span className="cx-eyebrow">SEE WHAT CHANGES THE ANSWER</span>
            <h1>
              A recommendation.
              <br />
              With its breaking points.
            </h1>
            <p>
              Ask Hermes to model a decision, then explore the exact assumptions
              that change which option works.
            </p>
            <button className="cx-btn cx-btn-primary" onClick={demo}>
              Explore a project delivery example <Arrow />
            </button>
            <small>
              Three strategies. Two hard limits. No model calls while you
              explore.
            </small>
          </div>
        ) : (
          <>
            <section className="cx-heading">
              <div>
                <span className="cx-eyebrow">
                  DECISION STUDY <span className="cx-slash">/</span> VERSION{" "}
                  {version}
                </span>
                <h1>{study.title}</h1>
                <p>{study.question}</p>
                {study.description && (
                  <span className="cx-description">{study.description}</span>
                )}
              </div>
              <button
                className={join([
                  "cx-btn",
                  "cx-btn-outline",
                  inspector && "is-active",
                ])}
                onClick={() => setInspector(!inspector)}
                aria-expanded={inspector}
              >
                <span aria-hidden="true" className="cx-inspect-icon">
                  ◈
                </span>
                <span className="cx-inspect-label">
                  {inspector ? "Close model" : "Inspect model"}
                </span>
              </button>
            </section>
            <div className="cx-workspace">
              <section className="cx-atlas-panel" aria-labelledby="atlas-title">
                <div className="cx-panel-head">
                  <div>
                    <span className="cx-eyebrow">01 / THE DECISION FIELD</span>
                    <h2 id="atlas-title">Where each option wins.</h2>
                  </div>
                  <span className="cx-status">
                    <i className={busy ? "is-busy" : ""} />
                    {busy || mapBusy
                      ? "Calculating"
                      : "Live · local computation"}
                  </span>
                </div>
                <div className="cx-legend">
                  {candidates.map((c) => (
                    <span key={c.id}>
                      <i style={{ background: color(c.id) }} />
                      {c.label}
                    </span>
                  ))}
                  <span>
                    <i className="cx-hatch-key" />
                    No option fits
                  </span>
                </div>
                {axes.length > 1 ? (
                  <Atlas
                    atlas={atlasData}
                    assumptions={axes.map(assumption)}
                    candidates={candidates}
                    values={values}
                    color={color}
                    onChange={(x, y) => {
                      setValue(axes[0], x);
                      setValue(axes[1], y);
                    }}
                    busy={busy}
                  />
                ) : (
                  <div className="cx-one-axis">
                    One assumption in this model. Explore its exact decision
                    ranges below.
                  </div>
                )}
                <div className="cx-map-bottom">
                  <span>
                    <span aria-hidden="true">⌖</span> Drag the point. See the
                    decision change.
                  </span>
                  <span className="cx-map-note">
                    Sampled map · exact thresholds below
                  </span>
                </div>
                <div className="cx-axis-selectors">
                  {axes.length > 1 &&
                    axes.map((id, i) => (
                      <label key={i}>
                        {i === 0 ? "HORIZONTAL" : "VERTICAL"}
                        <select
                          value={id}
                          aria-label={
                            i === 0 ? "Horizontal axis" : "Vertical axis"
                          }
                          onChange={(e) => {
                            const a = [...axes],
                              other = i === 0 ? 1 : 0,
                              previous = a[i];
                            a[i] = e.target.value;
                            if (a[other] === a[i]) a[other] = previous;
                            setAxes(a);
                          }}
                        >
                          {assumptions.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                </div>
              </section>
              <aside className="cx-controls">
                <div
                  className="cx-result"
                  style={{ "--winner": winner ? color(winner.id) : "#a5b4c7" }}
                >
                  <span className="cx-eyebrow">02 / AT THIS POINT</span>
                  <span className="cx-result-state">
                    {busy
                      ? "UPDATING THIS POINT"
                      : !ev
                        ? "Calculating…"
                        : !winner
                          ? "NO FEASIBLE OPTION"
                          : winners.length > 1
                            ? "EXACT TIE"
                            : study.objective.direction === "min"
                              ? "LOWEST " +
                                (objective?.label || "VALUE").toUpperCase() +
                                " THAT FITS"
                              : "HIGHEST " +
                                (objective?.label || "VALUE").toUpperCase() +
                                " THAT FITS"}
                  </span>
                  <h2>
                    {busy
                      ? "Updating the answer."
                      : !ev
                        ? "Finding the fit."
                        : !winner
                          ? "Something has to give."
                          : winners.length > 1
                            ? winners
                                .map((id) => candidate(id)?.label)
                                .join(" + ")
                            : winner.label}
                  </h2>
                  {winner ? (
                    <>
                      <div className="cx-result-value">
                        {fmt(
                          winnerRow?.objective_value ??
                            winnerRow?.metrics?.[objective?.id],
                          objective?.unit,
                        )}
                        <span>{objective?.label?.toLowerCase()}</span>
                      </div>
                      <p>{winner.description}</p>
                    </>
                  ) : (
                    ev &&
                    !busy && (
                      <p>
                        Your current requirements exclude every supplied option.
                        Inspect the conflict below.
                      </p>
                    )
                  )}
                  <div className="cx-result-footer">
                    <span>
                      {busy
                        ? "Updating…"
                        : `${feasible.length} of ${candidates.length} options fit`}
                    </span>
                    <span>
                      Supplied model{" "}
                      <span title="Results are exact only within the supplied affine model. Source estimates are not independently verified.">
                        ⓘ
                      </span>
                    </span>
                  </div>
                </div>
                <div className="cx-assumptions">
                  <div className="cx-section-row">
                    <h3>Stress the assumptions.</h3>
                    <button
                      className="cx-text-btn"
                      onClick={() => setValues(defaults(study))}
                    >
                      Reset
                    </button>
                  </div>
                  {assumptions.map((a) => (
                    <div className="cx-assumption" key={a.id}>
                      <div className="cx-input-heading">
                        <label htmlFor={"cx-" + a.id}>{a.label}</label>
                        <span className={"cx-kind cx-kind-" + a.kind}>
                          {a.kind || "estimate"}
                        </span>
                      </div>
                      <div className="cx-number-line">
                        <input
                          id={"cx-" + a.id}
                          type="number"
                          min={a.min}
                          max={a.max}
                          step={a.step}
                          value={values[a.id] ?? a.default}
                          onChange={(e) =>
                            setValue(a.id, Number(e.target.value))
                          }
                        />
                        <span>{a.unit}</span>
                      </div>
                      <input
                        className="cx-range"
                        type="range"
                        aria-label={a.label}
                        min={a.min}
                        max={a.max}
                        step={a.step}
                        value={values[a.id] ?? a.default}
                        onChange={(e) => setValue(a.id, Number(e.target.value))}
                      />
                      <div className="cx-range-ends">
                        <span>{fmt(a.min, a.unit)}</span>
                        <span>{fmt(a.max, a.unit)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
            <section className="cx-thresholds">
              <div className="cx-panel-head">
                <div>
                  <span className="cx-eyebrow">03 / THE BREAKING POINTS</span>
                  <h2>What changes the answer?</h2>
                </div>
                <span className="cx-proof-badge">
                  ◇ Exact in this affine model
                </span>
              </div>
              <Thresholds
                ev={busy ? null : ev}
                axis={assumption(axes[0])}
                candidate={candidate}
                color={color}
                values={values}
                onJump={(n) => setValues((v) => ({ ...v, [axes[0]]: n }))}
              />
            </section>
            <section className="cx-detail-grid">
              <div className="cx-requirements">
                <div className="cx-panel-head">
                  <div>
                    <span className="cx-eyebrow">04 / NON-NEGOTIABLES</span>
                    <h2>Hard requirements.</h2>
                  </div>
                </div>
                {study.constraints.map((c) => (
                  <label className="cx-requirement" key={c.id}>
                    <input
                      type="checkbox"
                      checked={enabled.includes(c.id)}
                      onChange={(e) =>
                        setEnabled((v) =>
                          e.target.checked
                            ? [...v, c.id]
                            : v.filter((id) => id !== c.id),
                        )
                      }
                    />
                    <span>
                      {c.label}
                      <small>
                        {metric(c.metric_id)?.label}{" "}
                        {c.operator === ">=" ? "≥" : "≤"}{" "}
                        {fmt(c.value, metric(c.metric_id)?.unit)}
                      </small>
                    </span>
                    <span className="cx-req-mark">
                      {enabled.includes(c.id) ? "ACTIVE" : "RELAXED"}
                    </span>
                  </label>
                ))}
                {!busy && ev?.conflict && (
                  <div className="cx-conflict">
                    <span className="cx-eyebrow">
                      MINIMUM CONFLICT · THIS POINT
                    </span>
                    <p>
                      {ev.conflict.constraint_ids
                        .map(
                          (id) =>
                            study.constraints.find((c) => c.id === id)?.label ||
                            id,
                        )
                        .join(" + ")}
                    </p>
                    <small>
                      These requirements together exclude every declared option.
                      Relax one or change an assumption.
                    </small>
                  </div>
                )}
              </div>
              <div className="cx-scenarios">
                <div className="cx-panel-head">
                  <div>
                    <span className="cx-eyebrow">05 / KEEP THE REASONING</span>
                    <h2>Save the decision point.</h2>
                  </div>
                </div>
                <p>
                  Keep the assumptions and model version together. Return when
                  the plan changes.
                </p>
                <div className="cx-save-row">
                  <input
                    aria-label="Scenario name"
                    placeholder="Name this scenario"
                    value={snapshotLabel}
                    onChange={(e) => setSnapshotLabel(e.target.value)}
                    maxLength={100}
                  />
                  <button
                    className="cx-btn cx-btn-outline"
                    disabled={saving || busy || !ev}
                    onClick={save}
                  >
                    {saving ? "Saving…" : "Save scenario"}{" "}
                    <span aria-hidden="true">＋</span>
                  </button>
                </div>
                {notice && (
                  <p className="cx-success" role="status">
                    {notice}
                  </p>
                )}
                <div className="cx-snapshot-list">
                  {snapshots.length ? (
                    snapshots.map((s, i) => (
                      <button
                        key={s.id || i}
                        onClick={() => {
                          setValues(s.values);
                          setEnabled(
                            s.evaluation?.enabled_constraint_ids ??
                              study.constraints.map((c) => c.id),
                          );
                          setNotice("Loaded " + s.label + ".");
                        }}
                      >
                        <span>◉ {s.label || "Saved scenario"}</span>
                        <span>Restore ↗</span>
                      </button>
                    ))
                  ) : (
                    <small>No saved scenarios yet.</small>
                  )}
                </div>
              </div>
            </section>
            <section className="cx-comparison">
              <div className="cx-panel-head">
                <div>
                  <span className="cx-eyebrow">
                    ALL OPTIONS / NO HIDDEN SCORES
                  </span>
                  <h2>The trade-offs, in the open.</h2>
                </div>
                <span className="cx-small">
                  Objective:{" "}
                  {study.objective.direction === "min"
                    ? "minimize"
                    : "maximize"}{" "}
                  {objective?.label?.toLowerCase()}
                </span>
              </div>
              <div className="cx-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Strategy</th>
                      {metrics.map((m) => (
                        <th key={m.id}>{m.label}</th>
                      ))}
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c) => {
                      const r = rankings.find((x) => x.candidate_id === c.id);
                      return (
                        <tr
                          key={c.id}
                          className={
                            winners.includes(c.id) ? "cx-winning-row" : ""
                          }
                        >
                          <th>
                            <i style={{ background: color(c.id) }} />
                            {c.label}
                          </th>
                          {metrics.map((m) => (
                            <td key={m.id}>
                              {fmt(r?.metrics?.[m.id], m.unit)}
                              {m.unit !== "USD" && (
                                <span className="cx-unit"> {m.unit}</span>
                              )}
                            </td>
                          ))}
                          <td>
                            {!r ? (
                              "—"
                            ) : !r.feasible ? (
                              <span className="cx-unfit">Doesn’t fit</span>
                            ) : winners.includes(c.id) ? (
                              <span className="cx-fit">
                                {winners.length > 1 ? "Tied best" : "Best fit"}
                              </span>
                            ) : (
                              <span className="cx-small">Feasible</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
            {inspector && (
              <section className="cx-inspector">
                <div className="cx-panel-head">
                  <div>
                    <span className="cx-eyebrow">
                      INSPECT THE SUPPLIED MODEL
                    </span>
                    <h2>The model is only as good as its inputs.</h2>
                  </div>
                  <span className="cx-small">
                    Version {version} · Affine expressions
                  </span>
                </div>
                <p>
                  Crux computes the consequences of these estimates. It does not
                  verify real-world prices, capacities or delivery promises.
                </p>
                <div className="cx-source-grid">
                  {assumptions.map((a) => (
                    <div key={a.id}>
                      <span className="cx-kind">{a.kind}</span>
                      <strong>{a.label}</strong>
                      <span>{a.source?.label || "No source supplied"}</span>
                      {a.source?.url && /^https?:\/\//i.test(a.source.url) && (
                        <a href={a.source.url} target="_blank" rel="noreferrer">
                          View source ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
                <div className="cx-formulas">
                  {candidates.map((c) => (
                    <div key={c.id}>
                      <strong style={{ color: color(c.id) }}>{c.label}</strong>
                      {Object.entries(c.metrics).map(([id, formula]) => (
                        <code key={id}>
                          {metric(id)?.label} = {formula.constant}
                          {Object.entries(formula.coefficients || {})
                            .map(
                              ([a, n]) =>
                                ` ${n >= 0 ? "+" : "−"} ${Math.abs(n)} × ${assumption(a)?.label || a}`,
                            )
                            .join("")}
                        </code>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            )}
            <footer className="cx-footer">
              <span>
                CRUX <span className="cx-slash">/</span> Find the assumption
                that changes everything.
              </span>
              <span>
                {study.description?.includes("Illustrative")
                  ? "ILLUSTRATIVE ESTIMATES · "
                  : ""}
                FINITE OPTIONS. EXPLICIT ASSUMPTIONS. LOCAL MATH.
              </span>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
function Thresholds({ ev, axis, candidate, color, values, onJump }) {
  if (!ev || !axis)
    return <p className="cx-muted">Computing the exact transitions…</p>;
  const regimes = ev.axis?.regimes || [],
    current = values[axis.id];
  const same = (a, b) => JSON.stringify(a || []) === JSON.stringify(b || []);
  const events = [
    ...(ev.axis?.boundaries || []),
    ...(ev.axis?.endpoints || []).map((e) => ({ ...e, kind: "endpoint" })),
  ];
  const borders = events
    .filter(
      (b, i, all) =>
        all.findIndex(
          (x) =>
            (x.exact_value || String(x.value)) ===
            (b.exact_value || String(b.value)),
        ) === i,
    )
    .map((b) => {
      const left = regimes.find((r) => r.to === b.value),
        right = regimes.find((r) => r.from === b.value);
      const intervalChange = Boolean(
        left && right && !same(left.winner_ids, right.winner_ids),
      );
      const pointChange = Boolean(
        (left && !same(left.winner_ids, b.winner_ids)) ||
        (right && !same(right.winner_ids, b.winner_ids)),
      );
      return {
        ...b,
        left,
        right,
        intervalChange,
        pointChange,
        isolated: !intervalChange && pointChange,
      };
    })
    .filter((b) => b.intervalChange || b.pointChange)
    .sort((a, b) => Math.abs(a.value - current) - Math.abs(b.value - current))
    .slice(0, 3);
  return (
    <>
      <div
        className="cx-regime-strip"
        aria-label={"Winner ranges across " + axis.label}
      >
        {regimes.map((r, i) => (
          <div
            key={i}
            style={{
              flex: Math.max(0, r.to - r.from),
              background: r.winner_ids?.length
                ? color(r.winner_ids[0]) + "66"
                : "repeating-linear-gradient(135deg,#ffffff0b 0 3px,transparent 3px 8px)",
            }}
            title={`${fmt(r.from)}–${fmt(r.to)} ${axis.unit}: ${r.winner_ids?.map((id) => candidate(id)?.label).join(", ") || "No option fits"}`}
          />
        ))}
        <i
          className="cx-regime-point"
          style={{
            left: (100 * (current - axis.min)) / (axis.max - axis.min) + "%",
          }}
        />
      </div>
      <div className="cx-threshold-cards">
        {borders.length ? (
          borders.map((b, i) => {
            const side = current <= b.value ? b.right : b.left;
            const dest = b.isolated
              ? b.winner_ids || []
              : side?.winner_ids || [];
            const names = dest.map((id) => candidate(id)?.label).join(" + ");
            const atNames = (b.winner_ids || [])
              .map((id) => candidate(id)?.label)
              .join(" + ");
            const Tag = b.isolated ? "article" : "button";
            return (
              <Tag
                className="cx-threshold-card"
                key={i}
                title={
                  "Exact boundary: " +
                  (b.exact_value || b.value) +
                  ". At this exact value: " +
                  (atNames || "no option fits") +
                  "."
                }
                onClick={
                  b.isolated
                    ? undefined
                    : () => {
                        if (side) onJump((side.from + side.to) / 2);
                      }
                }
              >
                <span className="cx-threshold-direction">
                  {b.isolated
                    ? "◇ EXACT POINT"
                    : b.value >= current
                      ? "↗ INCREASE"
                      : "↙ DECREASE"}{" "}
                  {axis.label.toUpperCase()}
                </span>
                <strong>
                  {b.exact_value?.includes("/") ? "≈ " : ""}
                  {fmt(b.value)}
                  <span>{axis.unit}</span>
                </strong>
                <p>
                  {b.isolated
                    ? dest.length
                      ? dest.length > 1
                        ? `${names} tie only at this exact boundary.`
                        : `${names} wins only at this exact boundary.`
                      : "No option fits at this exact boundary."
                    : dest.length
                      ? `${names} takes over.`
                      : "No option meets every requirement."}
                </p>
                {!b.isolated && b.winner_ids?.length > 1 && (
                  <small className="cx-boundary-outcome">
                    At the exact boundary: {atNames} tie.
                  </small>
                )}
                <span className="cx-threshold-kind">
                  <span>
                    {b.exact_value?.includes("/")
                      ? "Exact: " + b.exact_value
                      : b.kind === "constraint"
                        ? "Hard-limit boundary"
                        : b.kind === "endpoint"
                          ? "Range endpoint"
                          : "Recommendation boundary"}
                  </span>
                  <span>
                    {b.isolated ? "Exact outcome" : "Explore interval →"}
                  </span>
                </span>
              </Tag>
            );
          })
        ) : (
          <div className="cx-no-threshold">
            <strong>No winner change in the computed axis analysis.</strong>
            <p>
              The open intervals, boundary points and endpoints keep the same
              outcome on the {axis.label.toLowerCase()} axis with other
              assumptions fixed.
            </p>
          </div>
        )}
      </div>
      <p className="cx-exact-note">
        Crossings are exact; the open intervals between them determine the
        winner. Boundary points and range endpoints are evaluated separately.
        Other assumptions stay fixed.
      </p>
    </>
  );
}

function Atlas({
  atlas,
  assumptions,
  candidates,
  values,
  color,
  onChange,
  busy,
}) {
  const ref = useRef(null),
    [active, setActive] = useState(false),
    [narrow, setNarrow] = useState(false),
    [x, y] = assumptions,
    W = narrow ? 480 : 820,
    H = narrow ? 410 : 465,
    L = narrow ? 53 : 64,
    R = narrow ? 15 : 26,
    T = 22,
    B = 57,
    pw = W - L - R,
    ph = H - T - B;
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) =>
      setNarrow(entries[0].contentRect.width < 480),
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const xs = atlas?.x_values || [],
    ys = atlas?.y_values || [],
    cells = atlas?.cells || [];
  const mapX = (n) => L + ((n - x.min) / (x.max - x.min)) * pw,
    mapY = (n) => T + ph - ((n - y.min) / (y.max - y.min)) * ph;
  function move(e) {
    const svg = ref.current;
    const screenTransform = svg?.getScreenCTM();
    if (!screenTransform) return;
    // The viewBox can be letterboxed by preserveAspectRatio/max-height.
    // Invert the actual SVG screen transform instead of scaling its CSS box.
    const screenPoint = svg.createSVGPoint();
    screenPoint.x = e.clientX;
    screenPoint.y = e.clientY;
    const { x: vx, y: vy } = screenPoint.matrixTransform(
      screenTransform.inverse(),
    );
    onChange(
      x.min + Math.max(0, Math.min(1, (vx - L) / pw)) * (x.max - x.min),
      y.min + Math.max(0, Math.min(1, 1 - (vy - T) / ph)) * (y.max - y.min),
    );
  }
  const rects = useMemo(() => {
    const out = [];
    if (!cells.length) return out;
    const nx = xs.length,
      ny = ys.length;
    for (let j = 0; j < ny; j++) {
      let start = 0;
      for (let i = 1; i <= nx; i++) {
        if (i === nx || cells[j]?.[i] !== cells[j]?.[start]) {
          const id = cells[j]?.[start],
            x0 = start === 0 ? L : mapX((xs[start - 1] + xs[start]) / 2),
            x1 = i === nx ? L + pw : mapX((xs[i - 1] + xs[i]) / 2),
            yb = j === 0 ? T + ph : mapY((ys[j - 1] + ys[j]) / 2),
            yt = j === ny - 1 ? T : mapY((ys[j] + ys[j + 1]) / 2);
          out.push(
            <rect
              key={j + "-" + start}
              x={x0}
              y={yt}
              width={x1 - x0 + 0.3}
              height={yb - yt + 0.3}
              fill={id ? color(id) : "url(#cx-hatch)"}
              opacity={id ? 0.26 : 1}
            />,
          );
          start = i;
        }
      }
    }
    return out;
  }, [atlas, narrow]);
  const labels = useMemo(() => {
    const points = {};
    cells.forEach((row, j) =>
      row.forEach((id, i) => {
        if (id) {
          points[id] ??= [];
          points[id].push([mapX(xs[i]), mapY(ys[j])]);
        }
      }),
    );
    return Object.entries(points).map(([id, pts]) => {
      const avg = pts.reduce(
        (s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length],
        [0, 0],
      );
      const pos = pts.reduce(
        (best, p) =>
          Math.hypot(p[0] - avg[0], p[1] - avg[1]) <
          Math.hypot(best[0] - avg[0], best[1] - avg[1])
            ? p
            : best,
        pts[0],
      );
      return (
        <g
          key={id}
          transform={`translate(${pos[0]},${pos[1]})`}
          className="cx-region-label"
        >
          <rect
            x={narrow ? -85 : -69}
            y={-15}
            width={narrow ? 170 : 138}
            height={30}
            rx={4}
            fill="#111b26"
            opacity=".92"
          />
          <circle cx={narrow ? -70 : -54} cy={0} r={3} fill={color(id)} />
          <text x={narrow ? -59 : -43} y={4} fill={color(id)}>
            {candidates.find((c) => c.id === id)?.label}
          </text>
        </g>
      );
    });
  }, [atlas, narrow]);
  const px = mapX(values[x.id]),
    py = mapY(values[y.id]);
  return (
    <div className="cx-atlas-wrap">
      <svg
        ref={ref}
        className={join(["cx-atlas", active && "is-dragging"])}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Decision atlas. ${x.label}: ${values[x.id]} ${x.unit}. ${y.label}: ${values[y.id]} ${y.unit}. Drag to explore, or focus and use arrow keys.`}
        tabIndex={0}
        onKeyDown={(e) => {
          let xv = values[x.id],
            yv = values[y.id];
          if (e.key === "ArrowLeft") xv -= x.step;
          else if (e.key === "ArrowRight") xv += x.step;
          else if (e.key === "ArrowUp") yv += y.step;
          else if (e.key === "ArrowDown") yv -= y.step;
          else return;
          e.preventDefault();
          onChange(xv, yv);
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          ref.current.setPointerCapture(e.pointerId);
          setActive(true);
          move(e);
        }}
        onPointerMove={(e) => {
          if (active) move(e);
        }}
        onPointerUp={() => setActive(false)}
        onPointerCancel={() => setActive(false)}
      >
        <defs>
          <pattern
            id="cx-hatch"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="10" height="10" fill="#101823" />
            <rect width="1" height="10" fill="#324052" opacity=".38" />
          </pattern>
          <clipPath id="cx-plot">
            <rect x={L} y={T} width={pw} height={ph} rx="4" />
          </clipPath>
          <radialGradient id="cx-point-glow">
            <stop stopColor="#ffffff" stopOpacity=".3" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x={L} y={T} width={pw} height={ph} fill="#111a25" rx="4" />
        <g clipPath="url(#cx-plot)">
          {rects}
          {Array.from({ length: 9 }, (_, i) => (
            <line
              key={"v" + i}
              x1={L + (i * pw) / 8}
              x2={L + (i * pw) / 8}
              y1={T}
              y2={T + ph}
              stroke="#bfd8ed"
              opacity=".065"
            />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <line
              key={"h" + i}
              y1={T + (i * ph) / 6}
              y2={T + (i * ph) / 6}
              x1={L}
              x2={L + pw}
              stroke="#bfd8ed"
              opacity=".065"
            />
          ))}
          {labels}
          <line
            x1={px}
            x2={px}
            y1={T}
            y2={T + ph}
            stroke="white"
            strokeDasharray="3 5"
            opacity=".35"
          />
          <line
            x1={L}
            x2={L + pw}
            y1={py}
            y2={py}
            stroke="white"
            strokeDasharray="3 5"
            opacity=".35"
          />
          <circle cx={px} cy={py} r={40} fill="url(#cx-point-glow)" />
          <circle
            cx={px}
            cy={py}
            r={15}
            fill="#101823"
            stroke="white"
            strokeWidth="1.5"
          />
          <circle cx={px} cy={py} r={5} fill="white" />
          <line x1={px - 20} x2={px - 11} y1={py} y2={py} stroke="white" />
          <line x1={px + 11} x2={px + 20} y1={py} y2={py} stroke="white" />
          <line y1={py - 20} y2={py - 11} x1={px} x2={px} stroke="white" />
          <line y1={py + 11} y2={py + 20} x1={px} x2={px} stroke="white" />
        </g>
        {Array.from({ length: 5 }, (_, i) => {
          const n = x.min + (i * (x.max - x.min)) / 4;
          return (
            <text
              key={"xt" + i}
              x={mapX(n)}
              y={T + ph + 23}
              textAnchor="middle"
              className="cx-tick"
            >
              {fmt(n)}
            </text>
          );
        })}
        {Array.from({ length: 5 }, (_, i) => {
          const n = y.min + (i * (y.max - y.min)) / 4;
          return (
            <text
              key={"yt" + i}
              x={L - 13}
              y={mapY(n) + 4}
              textAnchor="end"
              className="cx-tick"
            >
              {fmt(n)}
            </text>
          );
        })}
        <text
          x={L + pw / 2}
          y={H - 6}
          textAnchor="middle"
          className="cx-axis-label"
        >
          {x.label.toUpperCase()} <tspan opacity=".5"> / {x.unit}</tspan>
        </text>
        <text
          transform={`translate(16 ${T + ph / 2}) rotate(-90)`}
          textAnchor="middle"
          className="cx-axis-label"
        >
          {y.label.toUpperCase()} <tspan opacity=".5"> / {y.unit}</tspan>
        </text>
      </svg>
      {!atlas && (
        <div className="cx-atlas-loading" role="status">
          Computing the decision field…
        </div>
      )}
    </div>
  );
}
