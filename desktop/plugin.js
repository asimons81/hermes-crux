// src/plugin.jsx
import React2 from "react";
import * as sdk from "@hermes/plugin-sdk";

// src/App.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";

// src/styles.css
var styles_default = ".crux {\n  container-type: inline-size;\n  container-name: crux;\n  --cx-bg: #0c1119;\n  --cx-fg: #e8edf3;\n  --cx-muted: #9ba8b9;\n  --cx-border: #293443;\n  --cx-card: #111923;\n  font-family: var(--font-sans, Inter, ui-sans-serif, system-ui, sans-serif);\n  color: var(--cx-fg);\n  background: var(--cx-bg);\n  font-size: 14px;\n  line-height: 1.5;\n  min-height: 100%;\n  color-scheme: dark;\n  box-sizing: border-box;\n}\n.crux * {\n  box-sizing: border-box;\n}\n.crux button,\n.crux input,\n.crux select {\n  font: inherit;\n}\n.crux button {\n  cursor: pointer;\n}\n.crux button:disabled {\n  cursor: wait;\n  opacity: 0.5;\n}\n.crux button:focus-visible,\n.crux input:focus-visible,\n.crux select:focus-visible,\n.crux svg:focus-visible {\n  outline: 2px solid var(--ring, #65dbd2);\n  outline-offset: 4px;\n}\n.crux button,\n.crux select,\n.crux input {\n  color: inherit;\n}\n.cx-shell {\n  max-width: 1560px;\n  margin: 0 auto;\n  padding: 0 38px;\n}\n.cx-top {\n  min-height: 84px;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  border-bottom: 1px solid var(--cx-border);\n  gap: 20px;\n}\n.cx-brand {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  font-size: 17px;\n  font-weight: 750;\n  letter-spacing: 0.19em;\n}\n.cx-glyph {\n  font-size: 31px;\n  font-weight: 400;\n  line-height: 1;\n  color: #a9e5df;\n  letter-spacing: 0;\n}\n.cx-brand-sub {\n  font-size: 9px;\n  font-weight: 500;\n  letter-spacing: 0.15em;\n  color: var(--cx-muted);\n  border-left: 1px solid var(--cx-border);\n  padding-left: 18px;\n  margin-left: 8px;\n}\n.cx-top-actions {\n  display: flex;\n  align-items: center;\n  gap: 14px;\n}\n.crux select {\n  background: var(--cx-card);\n  border: 1px solid var(--cx-border);\n  border-radius: 5px;\n  padding: 8px 26px 8px 10px;\n  font-size: 12px;\n  max-width: 260px;\n}\n.cx-btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 14px;\n  border: 0;\n  border-radius: 5px;\n  font-size: 12px;\n  font-weight: 600;\n  padding: 11px 14px;\n  white-space: nowrap;\n  transition:\n    background 0.15s,\n    transform 0.15s;\n}\n.cx-btn:hover {\n  transform: translateY(-1px);\n}\n.cx-btn-quiet {\n  background: transparent;\n  color: var(--cx-muted) !important;\n  padding: 9px 0;\n}\n.cx-btn-primary {\n  background: #b3eee5;\n  color: #10201f !important;\n}\n.cx-btn-primary:hover {\n  background: #d1fff7;\n}\n.cx-btn-outline {\n  background: color-mix(in srgb, var(--cx-card) 75%, transparent);\n  border: 1px solid var(--cx-border);\n}\n.cx-btn-outline:hover,\n.cx-btn-outline.is-active {\n  border-color: #65dbd266;\n  background: #65dbd20b;\n}\n.cx-text-btn {\n  padding: 4px 0;\n  background: none;\n  border: 0;\n  color: #a7cdc9 !important;\n  font-size: 11px;\n}\n.cx-eyebrow {\n  display: block;\n  font-family: var(--font-mono, ui-monospace, SFMono-Regular, monospace);\n  letter-spacing: 0.15em;\n  font-size: 9px;\n  font-weight: 500;\n  color: var(--cx-muted);\n}\n.cx-slash {\n  opacity: 0.4;\n  margin: 0 8px;\n}\n.cx-heading {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 20px;\n  padding: 38px 0 32px;\n}\n.cx-heading h1 {\n  font-weight: 500;\n  letter-spacing: -0.045em;\n  line-height: 1.15;\n  font-size: clamp(26px, 3vw, 42px);\n  margin: 12px 0 9px;\n}\n.cx-description {\n  display: inline-block;\n  margin-top: 10px;\n  font-size: 10px;\n  line-height: 1.6;\n  color: #d9be94;\n  max-width: 680px;\n}\n.cx-heading p {\n  margin: 0;\n  color: var(--cx-muted);\n  font-size: 13px;\n}\n.cx-workspace {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) 322px;\n  gap: 20px;\n  align-items: start;\n}\n.cx-atlas-panel {\n  border: 1px solid var(--cx-border);\n  border-radius: 8px;\n  background: linear-gradient(150deg, #23374612, transparent 60%);\n  overflow: hidden;\n  padding: 22px 23px 0;\n}\n.cx-panel-head {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 16px;\n}\n.cx-panel-head h2 {\n  margin: 6px 0 0;\n  font-size: 20px;\n  font-weight: 450;\n  letter-spacing: -0.025em;\n}\n.cx-status {\n  display: flex;\n  gap: 6px;\n  align-items: center;\n  font-family: var(--font-mono, ui-monospace, monospace);\n  font-size: 9px;\n  color: var(--cx-muted);\n  white-space: nowrap;\n}\n.cx-status i {\n  height: 5px;\n  width: 5px;\n  background: #70cdb0;\n  border-radius: 50%;\n}\n.cx-status i.is-busy {\n  background: #d8b275;\n}\n.cx-legend {\n  display: flex;\n  gap: 17px;\n  flex-wrap: wrap;\n  font-size: 10px;\n  color: var(--cx-muted);\n  margin: 23px 0 8px;\n}\n.cx-legend span {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n}\n.cx-legend i,\n.cx-inline-result i {\n  width: 6px;\n  height: 6px;\n  border-radius: 1px;\n  display: inline-block;\n}\n.cx-legend .cx-hatch-key {\n  background: repeating-linear-gradient(\n    135deg,\n    #8793a7 0 1px,\n    transparent 1px 3px\n  );\n  height: 9px;\n  width: 9px;\n}\n.cx-atlas-wrap {\n  position: relative;\n}\n.cx-atlas {\n  display: block;\n  width: 100%;\n  height: auto;\n  user-select: none;\n  touch-action: none;\n  cursor: crosshair;\n  overflow: visible;\n}\n.cx-atlas.is-dragging {\n  cursor: grabbing;\n}\n.cx-atlas-loading {\n  position: absolute;\n  inset: 0;\n  display: grid;\n  place-items: center;\n  font-family: var(--font-mono, monospace);\n  font-size: 11px;\n  color: var(--cx-muted);\n}\n.cx-tick {\n  fill: #92a4b8;\n  font: 11px var(--font-mono, ui-monospace, monospace);\n}\n.cx-axis-label {\n  fill: #a8b7c8;\n  font: 9px var(--font-mono, ui-monospace, monospace);\n  letter-spacing: 1.6px;\n}\n.cx-region-label text {\n  font: 11px var(--font-sans, system-ui, sans-serif);\n  font-weight: 500;\n}\n.cx-map-bottom {\n  display: flex;\n  justify-content: space-between;\n  gap: 12px;\n  margin: 8px 0 16px;\n  font-size: 10px;\n  color: var(--cx-muted);\n}\n.cx-map-bottom > span:first-child {\n  color: #bbd4d3;\n}\n.cx-map-bottom > span > span {\n  margin-right: 5px;\n  font-size: 16px;\n}\n.cx-map-note {\n  font-size: 9px;\n  padding-top: 5px;\n}\n.cx-axis-selectors {\n  border-top: 1px solid var(--cx-border);\n  display: flex;\n  gap: 22px;\n  padding: 15px 0;\n}\n.cx-axis-selectors label {\n  font-family: var(--font-mono, monospace);\n  font-size: 8px;\n  letter-spacing: 0.1em;\n  color: var(--cx-muted);\n  display: flex;\n  align-items: center;\n  gap: 9px;\n}\n.cx-axis-selectors select {\n  border: 0;\n  padding: 4px 24px 4px 5px;\n  background: transparent;\n  color: var(--cx-fg);\n  font-family: var(--font-sans, sans-serif);\n  letter-spacing: 0;\n  font-size: 11px;\n  max-width: 180px;\n}\n.cx-controls {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}\n.cx-result {\n  border: 1px solid color-mix(in srgb, var(--winner) 38%, var(--cx-border));\n  background: linear-gradient(\n    135deg,\n    color-mix(in srgb, var(--winner) 11%, transparent),\n    transparent 80%\n  );\n  padding: 20px 22px;\n  border-radius: 8px;\n}\n.cx-result .cx-eyebrow {\n  color: color-mix(in srgb, var(--winner) 70%, var(--cx-muted));\n}\n.cx-result-state {\n  display: block;\n  margin-top: 22px;\n  font: 8px var(--font-mono, monospace);\n  letter-spacing: 0.13em;\n  color: var(--winner);\n}\n.cx-result h2 {\n  margin: 8px 0 16px;\n  font-size: 30px;\n  font-weight: 450;\n  line-height: 1.15;\n  letter-spacing: -0.045em;\n}\n.cx-result-value {\n  font-size: 32px;\n  letter-spacing: -0.04em;\n  font-variant-numeric: tabular-nums;\n  line-height: 1.2;\n}\n.cx-result-value span {\n  font-size: 10px;\n  color: var(--cx-muted);\n  display: block;\n  letter-spacing: 0;\n  margin-top: 4px;\n}\n.cx-result p {\n  font-size: 11px;\n  line-height: 1.6;\n  color: var(--cx-muted);\n  margin: 15px 0;\n}\n.cx-result-footer {\n  border-top: 1px solid color-mix(in srgb, var(--winner) 16%, transparent);\n  display: flex;\n  justify-content: space-between;\n  gap: 8px;\n  padding-top: 13px;\n  font-size: 9px;\n  color: var(--cx-muted);\n}\n.cx-result-footer > span:first-child {\n  color: var(--winner);\n}\n.cx-assumptions {\n  border: 1px solid var(--cx-border);\n  border-radius: 8px;\n  padding: 17px 21px;\n}\n.cx-section-row {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 8px;\n}\n.cx-section-row h3 {\n  font-size: 13px;\n  font-weight: 500;\n  margin: 0;\n}\n.cx-assumption {\n  padding: 15px 0 12px;\n}\n.cx-assumption + .cx-assumption {\n  border-top: 1px solid var(--cx-border);\n}\n.cx-input-heading {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  font-size: 11px;\n}\n.cx-kind {\n  font: 8px var(--font-mono, monospace);\n  color: var(--cx-muted);\n  letter-spacing: 0.04em;\n  border: 1px solid var(--cx-border);\n  border-radius: 3px;\n  padding: 2px 5px;\n  text-transform: uppercase;\n}\n.cx-kind-estimate {\n  color: #d3b889;\n}\n.cx-number-line {\n  display: flex;\n  align-items: baseline;\n  gap: 7px;\n  margin: 7px 0;\n}\n.cx-number-line input {\n  border: 0;\n  background: transparent;\n  padding: 0;\n  width: 115px;\n  font-size: 27px;\n  letter-spacing: -0.04em;\n  font-variant-numeric: tabular-nums;\n  appearance: textfield;\n  -moz-appearance: textfield;\n}\n.cx-number-line input::-webkit-inner-spin-button,\n.cx-number-line input::-webkit-outer-spin-button {\n  appearance: none;\n}\n.cx-number-line span {\n  font-size: 10px;\n  color: var(--cx-muted);\n}\n.cx-range {\n  appearance: none;\n  width: 100%;\n  height: 3px;\n  border-radius: 3px;\n  background: #91a4bb32;\n  display: block;\n  margin: 11px 0 10px;\n  accent-color: #a9dcd7;\n  cursor: pointer;\n}\n.cx-range::-webkit-slider-thumb {\n  appearance: none;\n  width: 11px;\n  height: 11px;\n  background: #b4ddd6;\n  border: 2px solid #16322e;\n  border-radius: 50%;\n}\n.cx-range::-moz-range-thumb {\n  width: 10px;\n  height: 10px;\n  background: #b4ddd6;\n  border: 2px solid #16322e;\n  border-radius: 50%;\n}\n.cx-range-ends {\n  display: flex;\n  justify-content: space-between;\n  font: 8px var(--font-mono, monospace);\n  color: var(--cx-muted);\n}\n.cx-thresholds {\n  margin-top: 27px;\n  border: 1px solid var(--cx-border);\n  border-radius: 8px;\n  padding: 24px;\n}\n.cx-proof-badge {\n  border: 1px solid #71978c33;\n  background: #8bc9ad08;\n  color: #a8c9bc;\n  border-radius: 4px;\n  padding: 6px 9px;\n  font: 9px var(--font-mono, monospace);\n}\n.cx-regime-strip {\n  height: 9px;\n  display: flex;\n  position: relative;\n  margin: 24px 0 20px;\n  border-radius: 2px;\n  gap: 2px;\n}\n.cx-regime-strip > div {\n  min-width: 0;\n}\n.cx-regime-point {\n  width: 2px;\n  background: var(--cx-fg);\n  height: 17px;\n  top: -4px;\n  position: absolute;\n  box-shadow: 0 0 0 3px var(--cx-bg);\n}\n.cx-threshold-cards {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 13px;\n}\n.cx-threshold-card {\n  background: color-mix(in srgb, var(--cx-card) 60%, transparent);\n  text-align: left;\n  border: 1px solid var(--cx-border);\n  border-radius: 5px;\n  padding: 17px 18px;\n  transition: border 0.15s;\n}\n.cx-threshold-card:hover {\n  border-color: #9ad2c766;\n}\n.cx-threshold-direction {\n  font: 8px var(--font-mono, monospace);\n  letter-spacing: 0.08em;\n  color: var(--cx-muted);\n}\n.cx-threshold-card strong {\n  display: block;\n  font-size: 27px;\n  letter-spacing: -0.035em;\n  font-weight: 450;\n  margin-top: 8px;\n}\n.cx-threshold-card strong > span {\n  font-size: 10px;\n  color: var(--cx-muted);\n  letter-spacing: 0;\n  margin-left: 6px;\n}\n.cx-threshold-card p {\n  font-size: 12px;\n  margin: 6px 0 18px;\n}\n.cx-threshold-kind {\n  display: flex;\n  justify-content: space-between;\n  border-top: 1px solid var(--cx-border);\n  padding-top: 11px;\n  font-size: 9px;\n  color: var(--cx-muted);\n}\n.cx-exact-note {\n  margin: 16px 0 0;\n  color: var(--cx-muted);\n  font-size: 10px;\n}\n.cx-no-threshold {\n  grid-column: 1/-1;\n  padding: 10px 0;\n}\n.cx-no-threshold strong {\n  font-size: 15px;\n  font-weight: 500;\n}\n.cx-no-threshold p {\n  color: var(--cx-muted);\n  font-size: 12px;\n}\n.cx-detail-grid {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 20px;\n  margin-top: 20px;\n}\n.cx-requirements,\n.cx-scenarios {\n  padding: 23px;\n  border: 1px solid var(--cx-border);\n  border-radius: 8px;\n}\n.cx-requirement {\n  display: flex;\n  gap: 10px;\n  align-items: center;\n  margin-top: 17px;\n  padding: 14px 0;\n  border-bottom: 1px solid var(--cx-border);\n  font-size: 12px;\n  cursor: pointer;\n}\n.cx-requirement input {\n  accent-color: #8cc8bd;\n  width: 14px;\n  height: 14px;\n  margin: 0;\n}\n.cx-requirement small {\n  display: block;\n  font-size: 10px;\n  color: var(--cx-muted);\n  margin-top: 3px;\n}\n.cx-req-mark {\n  margin-left: auto;\n  font: 8px var(--font-mono, monospace);\n  letter-spacing: 0.08em;\n  color: var(--cx-muted);\n}\n.cx-conflict {\n  margin-top: 17px;\n  border-left: 2px solid #e4bd83;\n  padding: 6px 0 6px 14px;\n}\n.cx-conflict .cx-eyebrow {\n  color: #d7b580;\n  font-size: 8px;\n}\n.cx-conflict p {\n  font-size: 12px;\n  color: #e4d1b5;\n  margin: 8px 0;\n}\n.cx-conflict small {\n  font-size: 10px;\n  color: var(--cx-muted);\n}\n.cx-scenarios > p {\n  font-size: 11px;\n  color: var(--cx-muted);\n  max-width: 330px;\n  line-height: 1.7;\n}\n.cx-save-row {\n  display: flex;\n  gap: 8px;\n  margin: 17px 0;\n}\n.cx-save-row input {\n  width: 100%;\n  min-width: 0;\n  background: transparent;\n  border: 1px solid var(--cx-border);\n  border-radius: 5px;\n  padding: 10px 12px;\n  font-size: 11px;\n}\n.cx-save-row input::placeholder {\n  color: var(--cx-muted);\n}\n.cx-save-row .cx-btn {\n  font-size: 10px;\n  padding: 10px;\n}\n.cx-success {\n  color: #8fccb8 !important;\n  font-size: 11px;\n}\n.cx-snapshot-list {\n  max-height: 135px;\n  overflow: auto;\n}\n.cx-snapshot-list > small {\n  font-size: 10px;\n  color: var(--cx-muted);\n}\n.cx-snapshot-list button {\n  display: flex;\n  justify-content: space-between;\n  gap: 10px;\n  width: 100%;\n  background: transparent;\n  border: 0;\n  border-bottom: 1px solid var(--cx-border);\n  padding: 11px 0;\n  font-size: 11px;\n  text-align: left;\n}\n.cx-snapshot-list button > span:last-child {\n  color: var(--cx-muted);\n  font-size: 9px;\n}\n.cx-comparison {\n  margin: 32px 0 0;\n}\n.cx-table-scroll {\n  overflow-x: auto;\n  margin-top: 18px;\n}\n.cx-comparison table {\n  width: 100%;\n  border-collapse: collapse;\n  text-align: left;\n  white-space: nowrap;\n}\n.cx-comparison th,\n.cx-comparison td {\n  font-weight: 400;\n  font-size: 11px;\n  padding: 15px 12px;\n  border-bottom: 1px solid var(--cx-border);\n}\n.cx-comparison thead th {\n  color: var(--cx-muted);\n  font-size: 9px;\n}\n.cx-comparison tbody th {\n  font-weight: 500;\n}\n.cx-comparison tbody th i {\n  height: 6px;\n  width: 6px;\n  border-radius: 1px;\n  display: inline-block;\n  margin-right: 8px;\n}\n.cx-comparison td {\n  font-variant-numeric: tabular-nums;\n}\n.cx-winning-row {\n  background: #83c2b505;\n}\n.cx-unit,\n.cx-small {\n  font-size: 10px;\n  color: var(--cx-muted);\n}\n.cx-fit {\n  color: #9cd5c6;\n  background: #72c4b00c;\n  border: 1px solid #72c4b029;\n  border-radius: 3px;\n  padding: 3px 6px;\n  font-size: 9px;\n}\n.cx-unfit {\n  font-size: 9px;\n  color: var(--cx-muted);\n}\n.cx-inspector {\n  margin-top: 25px;\n  padding: 24px;\n  border: 1px solid var(--cx-border);\n  border-radius: 8px;\n}\n.cx-inspector > p {\n  font-size: 12px;\n  color: var(--cx-muted);\n}\n.cx-source-grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 16px;\n  margin-top: 22px;\n}\n.cx-source-grid > div {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 6px;\n  font-size: 11px;\n}\n.cx-source-grid strong {\n  font-weight: 500;\n  font-size: 13px;\n}\n.cx-source-grid span:not(.cx-kind) {\n  color: var(--cx-muted);\n}\n.cx-source-grid a {\n  color: #a0d4c8;\n  font-size: 11px;\n}\n.cx-formulas {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 15px;\n  margin-top: 24px;\n  padding-top: 20px;\n  border-top: 1px solid var(--cx-border);\n}\n.cx-formulas strong {\n  font-size: 11px;\n  font-weight: 500;\n  display: block;\n  margin-bottom: 10px;\n}\n.cx-formulas code {\n  display: block;\n  font-size: 9px;\n  color: var(--cx-muted);\n  white-space: normal;\n  margin: 5px 0;\n}\n.cx-footer {\n  display: flex;\n  justify-content: space-between;\n  gap: 14px;\n  color: var(--cx-muted);\n  font-size: 9px;\n  padding: 32px 0;\n}\n.cx-footer > span:last-child {\n  font: 7px var(--font-mono, monospace);\n  letter-spacing: 0.06em;\n  padding-top: 3px;\n}\n.cx-alert {\n  display: flex;\n  gap: 8px;\n  align-items: center;\n  flex-wrap: wrap;\n  margin-top: 16px;\n  padding: 13px 16px;\n  border: 1px solid #bd91634a;\n  color: #e0bc94;\n  border-radius: 5px;\n  font-size: 12px;\n}\n.cx-alert .cx-text-btn {\n  margin-left: auto;\n}\n.cx-empty {\n  min-height: calc(100vh - 100px);\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: flex-start;\n  max-width: 700px;\n  margin: auto;\n  padding: 40px;\n}\n.cx-empty-symbol {\n  font-size: 65px;\n  color: #a5e1d9;\n  margin-bottom: 24px;\n}\n.cx-empty h1 {\n  font-size: clamp(32px, 5vw, 59px);\n  font-weight: 450;\n  letter-spacing: -0.045em;\n  line-height: 1.1;\n  margin: 16px 0;\n}\n.cx-empty h2 {\n  font-weight: 450;\n  font-size: 30px;\n  letter-spacing: -0.035em;\n}\n.cx-empty p {\n  color: var(--cx-muted);\n  max-width: 440px;\n  margin: 5px 0 26px;\n  font-size: 15px;\n  line-height: 1.7;\n}\n.cx-empty small {\n  color: var(--cx-muted);\n  font-size: 10px;\n  margin-top: 17px;\n}\n.cx-orbit {\n  height: 32px;\n  width: 32px;\n  border: 1px solid #9cdbcc;\n  border-right-color: transparent;\n  border-radius: 50%;\n  animation: cx-spin 1.5s linear infinite;\n}\n@keyframes cx-spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n.cx-inline {\n  max-width: 600px;\n  padding: 25px;\n  border: 1px solid #8bc6bd44;\n  border-radius: 8px;\n  background: linear-gradient(130deg, #8cd8cd0a, transparent);\n}\n.cx-inline .cx-eyebrow {\n  display: flex;\n  gap: 8px;\n  align-items: center;\n  font-size: 8px;\n}\n.cx-inline h3 {\n  font-size: 25px;\n  letter-spacing: -0.035em;\n  font-weight: 500;\n  margin: 15px 0 7px;\n}\n.cx-inline p {\n  font-size: 12px;\n  color: var(--cx-muted);\n}\n.cx-inline-result {\n  font-size: 13px;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin: 22px 0;\n}\n.cx-inline-result span {\n  margin-left: auto;\n  font-size: 20px;\n}\n.cx-inline .cx-btn {\n  width: 100%;\n  margin-top: 8px;\n}\n.cx-inline small {\n  display: block;\n  font-size: 9px;\n  color: var(--cx-muted);\n  margin-top: 13px;\n}\n.cx-one-axis {\n  min-height: 300px;\n  display: grid;\n  place-items: center;\n  color: var(--cx-muted);\n  font-size: 13px;\n}\n.cx-muted {\n  color: var(--cx-muted);\n}\n@container crux (min-width:1400px) {\n  .cx-atlas {\n    max-height: 540px;\n  }\n  .cx-result h2 {\n    font-size: 33px;\n  }\n  .cx-workspace {\n    grid-template-columns: minmax(0, 1fr) 340px;\n  }\n}\n@container crux (max-width:1100px) {\n  .cx-shell {\n    padding: 0 24px;\n  }\n  .cx-workspace {\n    grid-template-columns: minmax(0, 1fr) 285px;\n    gap: 15px;\n  }\n  .cx-atlas-panel {\n    padding: 19px 17px 0;\n  }\n  .cx-status {\n    font-size: 0;\n  }\n  .cx-status i {\n    width: 6px;\n    height: 6px;\n  }\n  .cx-legend {\n    gap: 10px;\n    font-size: 9px;\n  }\n  .cx-result,\n  .cx-assumptions {\n    padding: 18px;\n  }\n  .cx-result h2 {\n    font-size: 28px;\n  }\n  .cx-map-bottom {\n    font-size: 9px;\n  }\n  .cx-map-note {\n    font-size: 8px;\n  }\n  .cx-brand-sub {\n    display: none;\n  }\n  .cx-axis-selectors {\n    gap: 8px;\n  }\n  .cx-axis-selectors label {\n    font-size: 7px;\n    gap: 2px;\n  }\n  .cx-axis-selectors select {\n    max-width: 145px;\n    font-size: 10px;\n  }\n  .cx-threshold-cards {\n    gap: 9px;\n  }\n  .cx-threshold-card {\n    padding: 15px;\n  }\n  .cx-threshold-card p {\n    font-size: 11px;\n  }\n}\n@container crux (max-width:850px) {\n  .cx-workspace {\n    grid-template-columns: 1fr;\n  }\n  .cx-controls {\n    display: grid;\n    grid-template-columns: 0.8fr 1.2fr;\n    align-items: start;\n  }\n  .cx-assumptions {\n    display: block;\n  }\n  .cx-assumption {\n    padding: 13px 0;\n  }\n  .cx-atlas {\n    max-height: 500px;\n  }\n  .cx-heading h1 {\n    font-size: 33px;\n  }\n  .cx-top {\n    min-height: 70px;\n  }\n  .cx-heading {\n    padding: 28px 0;\n  }\n  .cx-detail-grid {\n    gap: 15px;\n  }\n  .cx-thresholds {\n    padding: 20px;\n  }\n  .cx-footer {\n    flex-direction: column;\n    gap: 8px;\n  }\n  .cx-result h2 {\n    font-size: 31px;\n  }\n  .cx-top-actions select {\n    max-width: 220px;\n  }\n  .cx-status {\n    font-size: 9px;\n  }\n  .cx-map-note {\n    font-size: 9px;\n  }\n}\n@container crux (max-width:600px) {\n  .cx-shell {\n    padding: 0 16px;\n  }\n  .cx-top {\n    min-height: 65px;\n  }\n  .cx-brand {\n    font-size: 15px;\n  }\n  .cx-top-actions {\n    gap: 8px;\n  }\n  .cx-top-actions select {\n    max-width: 125px;\n    font-size: 10px;\n  }\n  .cx-top-actions > .cx-btn {\n    font-size: 0;\n  }\n  .cx-top-actions > .cx-btn span {\n    font-size: 18px;\n  }\n  .cx-heading {\n    padding: 26px 0 22px;\n    align-items: flex-start;\n  }\n  .cx-heading h1 {\n    font-size: 28px;\n    max-width: 280px;\n  }\n  .cx-description {\n    display: inline-block;\n    margin-top: 10px;\n    font-size: 10px;\n    line-height: 1.6;\n    color: #d9be94;\n    max-width: 680px;\n  }\n  .cx-heading p {\n    font-size: 11px;\n  }\n  .cx-heading > .cx-btn {\n    font-size: 0;\n    padding: 9px;\n    width: 35px;\n    overflow: hidden;\n    flex-shrink: 0;\n  }\n  .cx-heading > .cx-btn .cx-inspect-label {\n    display: none;\n  }\n  .cx-heading > .cx-btn .cx-inspect-icon {\n    font-size: 16px;\n  }\n  .cx-atlas-panel {\n    padding: 16px 11px 0;\n    border-radius: 6px;\n  }\n  .cx-panel-head h2 {\n    font-size: 19px;\n  }\n  .cx-status {\n    font-size: 0;\n  }\n  .cx-legend {\n    font-size: 9px;\n    gap: 8px 12px;\n    margin-top: 18px;\n  }\n  .cx-atlas {\n    min-height: 260px;\n  }\n  .cx-map-bottom {\n    flex-direction: column;\n    gap: 2px;\n    margin-left: 5px;\n  }\n  .cx-map-note {\n    font-size: 8px;\n  }\n  .cx-axis-selectors {\n    justify-content: space-between;\n    gap: 6px;\n  }\n  .cx-axis-selectors label {\n    display: block;\n    font-size: 7px;\n  }\n  .cx-axis-selectors select {\n    display: block;\n    padding: 5px 20px 5px 0;\n    font-size: 10px;\n    max-width: 145px;\n  }\n  .cx-controls {\n    grid-template-columns: 1fr;\n    gap: 14px;\n  }\n  .cx-result {\n    padding: 20px;\n  }\n  .cx-result-state {\n    margin-top: 18px;\n  }\n  .cx-result h2 {\n    margin-bottom: 12px;\n  }\n  .cx-result p {\n    max-width: 300px;\n  }\n  .cx-result-value {\n    font-size: 35px;\n  }\n  .cx-assumptions {\n    padding: 17px 20px;\n  }\n  .cx-thresholds {\n    margin-top: 18px;\n    padding: 18px;\n  }\n  .cx-thresholds .cx-panel-head {\n    align-items: flex-start;\n    flex-direction: column;\n    gap: 12px;\n  }\n  .cx-proof-badge {\n    font-size: 8px;\n  }\n  .cx-threshold-cards {\n    grid-template-columns: 1fr;\n  }\n  .cx-threshold-card {\n    display: grid;\n    grid-template-columns: 1fr 1fr;\n    gap: 5px 10px;\n    padding: 15px;\n  }\n  .cx-threshold-direction {\n    font-size: 7px;\n    align-self: end;\n  }\n  .cx-threshold-card strong {\n    grid-column: 2;\n    grid-row: 1/3;\n    margin-top: 0;\n    text-align: right;\n    font-size: 28px;\n  }\n  .cx-threshold-card p {\n    margin: 3px 0 7px;\n    grid-column: 1/3;\n  }\n  .cx-threshold-kind {\n    grid-column: 1/3;\n    padding-top: 8px;\n  }\n  .cx-exact-note {\n    font-size: 9px;\n    line-height: 1.7;\n  }\n  .cx-detail-grid {\n    grid-template-columns: 1fr;\n    gap: 14px;\n    margin-top: 14px;\n  }\n  .cx-requirements,\n  .cx-scenarios {\n    padding: 20px;\n  }\n  .cx-comparison .cx-panel-head {\n    align-items: flex-start;\n    flex-direction: column;\n    gap: 6px;\n  }\n  .cx-comparison .cx-panel-head h2 {\n    font-size: 19px;\n  }\n  .cx-comparison th,\n  .cx-comparison td {\n    padding: 13px 10px;\n    font-size: 10px;\n  }\n  .cx-comparison th:first-child {\n    padding-left: 0;\n  }\n  .cx-inspector {\n    padding: 18px;\n  }\n  .cx-inspector .cx-panel-head {\n    display: block;\n  }\n  .cx-source-grid,\n  .cx-formulas {\n    grid-template-columns: 1fr;\n    gap: 18px;\n  }\n  .cx-empty {\n    padding: 30px 10px;\n    min-height: calc(100vh - 90px);\n  }\n  .cx-empty h1 {\n    font-size: 40px;\n  }\n  .cx-empty p {\n    font-size: 13px;\n  }\n  .cx-empty .cx-btn {\n    white-space: normal;\n    text-align: left;\n  }\n  .cx-empty small {\n    font-size: 9px;\n  }\n  .cx-footer {\n    font-size: 8px;\n    padding: 25px 0;\n  }\n  .cx-region-label text {\n    font-size: 15px;\n  }\n  .cx-tick {\n    font-size: 13px;\n  }\n}\n.crux .cx-eyebrow {\n  font-size: 10px;\n}\n.crux .cx-legend {\n  font-size: 11px;\n}\n.crux .cx-status {\n  font-size: 10px;\n}\n.crux .cx-kind {\n  font-size: 9px;\n}\n.crux .cx-result-state {\n  font-size: 10px;\n  line-height: 1.5;\n}\n.crux .cx-result-footer {\n  font-size: 10px;\n}\n.crux .cx-range-ends {\n  font-size: 9px;\n}\n.crux .cx-threshold-direction {\n  font-size: 10px;\n}\n.crux .cx-threshold-kind {\n  font-size: 10px;\n}\n.crux .cx-exact-note {\n  font-size: 11px;\n}\n.crux .cx-proof-badge {\n  font-size: 10px;\n}\n.crux .cx-input-heading {\n  font-size: 12px;\n}\n.crux .cx-axis-selectors label {\n  font-size: 9px;\n}\n.crux .cx-axis-selectors select {\n  font-size: 12px;\n}\n.crux .cx-map-bottom {\n  font-size: 11px;\n}\n.crux .cx-map-note {\n  font-size: 10px;\n}\n.crux .cx-comparison thead th {\n  font-size: 11px;\n}\n.crux .cx-small {\n  font-size: 11px;\n}\n.crux .cx-glyph {\n  flex-shrink: 0;\n  display: inline-block;\n  vertical-align: middle;\n  color: #a9e5df;\n}\n.crux .cx-inline .cx-glyph {\n  width: 23px;\n  height: 23px;\n}\n.crux select option {\n  color: #e8edf3;\n  background: #111923;\n}\n.crux .cx-alert {\n  color: #e0bc94;\n}\n.crux .cx-footer {\n  font-size: 10px;\n}\n.crux .cx-inspect-icon {\n  font-size: 15px;\n}\n.crux .cx-source-grid a {\n  min-height: 26px;\n}\n.crux .cx-text-btn {\n  min-height: 28px;\n}\n.crux .cx-top-actions > .cx-btn {\n  min-height: 44px;\n}\n.crux .cx-requirement {\n  min-height: 54px;\n}\n.crux .cx-range {\n  padding: 0;\n  min-height: 3px;\n}\n.crux .cx-range:focus-visible {\n  outline-offset: 8px;\n}\n.crux .cx-snapshot-list button {\n  min-height: 44px;\n}\n@container crux (max-width:1100px) {\n  .crux .cx-status {\n    font-size: 0;\n  }\n}\n@container crux (max-width:600px) {\n  .crux .cx-eyebrow {\n    font-size: 10px;\n  }\n  .crux .cx-legend {\n    font-size: 10px;\n  }\n  .crux .cx-threshold-direction {\n    font-size: 9px;\n  }\n  .crux .cx-threshold-kind {\n    font-size: 10px;\n  }\n  .crux .cx-proof-badge {\n    font-size: 9px;\n  }\n  .crux .cx-map-bottom {\n    font-size: 11px;\n  }\n  .crux .cx-map-note {\n    font-size: 10px;\n  }\n  .crux .cx-axis-selectors label {\n    font-size: 9px;\n  }\n  .crux .cx-axis-selectors select {\n    font-size: 11px;\n  }\n  .crux .cx-atlas {\n    min-height: 0;\n  }\n  .crux .cx-inspect-label {\n    display: none;\n  }\n  .crux .cx-heading > .cx-btn {\n    font-size: 0;\n    width: 40px;\n    height: 40px;\n  }\n  .crux .cx-heading > .cx-btn .cx-inspect-icon {\n    display: block;\n    font-size: 18px;\n  }\n  .crux .cx-footer {\n    font-size: 9px;\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  .crux * {\n    animation: none !important;\n    transition: none !important;\n    scroll-behavior: auto !important;\n  }\n}\n\n.crux .cx-boundary-outcome {\n  display: block;\n  color: #c5cdd9;\n  font-size: 10px;\n  line-height: 1.6;\n  margin: -8px 0 13px;\n}\n@container crux (max-width:600px) {\n  .crux .cx-boundary-outcome {\n    grid-column: 1/-1;\n    margin: 0 0 8px;\n  }\n}\n";

// src/styles.js
var styles = styles_default;

// src/App.jsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var COLORS = [
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
  "#a5d5aa"
];
var fmt = (n, unit) => Number.isFinite(n) ? unit === "USD" ? new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
}).format(n) : new Intl.NumberFormat(
  "en-US",
  n !== 0 && Math.abs(n) < 0.01 ? { maximumSignificantDigits: 3 } : { maximumFractionDigits: 2 }
).format(n) : "\u2014";
var join = (a) => a.filter(Boolean).join(" ");
var decimalPlaces = (value) => {
  const [mantissa, exponent = "0"] = String(value).toLowerCase().split("e");
  return Math.max(0, (mantissa.split(".")[1]?.length || 0) - Number(exponent));
};
var roundToStepPrecision = (value, assumption) => {
  const places = Math.max(
    decimalPlaces(assumption.min),
    decimalPlaces(assumption.step)
  );
  return places <= 100 ? Number(value.toFixed(places)) : Number(value.toPrecision(15));
};
var defaults = (s) => Object.fromEntries(s.assumptions.map((a) => [a.id, a.default]));
var Mark = () => /* @__PURE__ */ jsxs(
  "svg",
  {
    className: "cx-glyph",
    viewBox: "0 0 32 32",
    width: "28",
    height: "28",
    "aria-hidden": "true",
    children: [
      /* @__PURE__ */ jsx(
        "path",
        {
          d: "M16 3v26M3 16h26M7 7l18 18M7 25L25 7",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "1.6"
        }
      ),
      /* @__PURE__ */ jsx("circle", { cx: "16", cy: "16", r: "3", fill: "currentColor" })
    ]
  }
);
var Arrow = () => /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\u2197" });
function CruxApp({
  api,
  initialId,
  onNavigate,
  compact = false,
  refreshEpoch = 0
}) {
  const [list, setList] = useState([]), [study, setStudy] = useState(null), [version, setVersion] = useState(1), [selected, setSelected] = useState(initialId || ""), [values, setValues] = useState({}), [axes, setAxes] = useState([]), [enabled, setEnabled] = useState([]), [ev, setEv] = useState(null), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState(""), [notice, setNotice] = useState(""), [inspector, setInspector] = useState(false), [snapshots, setSnapshots] = useState([]), [snapshotLabel, setSnapshotLabel] = useState(""), [saving, setSaving] = useState(false), [atlasData, setAtlasData] = useState(null), [mapBusy, setMapBusy] = useState(false);
  const mapQueue = useRef(Promise.resolve());
  const serial = useRef(0), mapSerial = useRef(0), loaded = useRef(null);
  const atlasKey = study ? JSON.stringify({
    selected,
    axes,
    enabled,
    other: Object.fromEntries(
      Object.entries(values).filter(([id]) => !axes.includes(id))
    )
  }) : "";
  async function refreshList() {
    const r = await api("/studies");
    setList(r.studies || []);
    return r.studies || [];
  }
  useEffect(() => {
    let live = true;
    setLoading(true);
    refreshList().then((l) => {
      if (!live) return;
      if (initialId) setSelected(initialId);
      else if (l.length) setSelected(l[0].id);
      else setLoading(false);
    }).catch((e) => {
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
    api("/studies/" + encodeURIComponent(selected)).then((r) => {
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
    }).catch((e) => {
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
        body: { values, axis: axes[0], enabled_constraint_ids: enabled }
      }).then((r) => {
        if (serial.current !== request) return;
        setEv(r);
        setBusy(false);
        setError("");
      }).catch((e) => {
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
      mapQueue.current = mapQueue.current.catch(() => {
      }).then(() => {
        if (request !== mapSerial.current) return;
        return api("/studies/" + encodeURIComponent(selected) + "/evaluate", {
          method: "POST",
          body: {
            values,
            axes: axes.length > 1 ? axes : void 0,
            resolution: 45,
            enabled_constraint_ids: enabled
          }
        }).then((r) => {
          if (live && request === mapSerial.current) {
            setAtlasData(r.atlas);
            setMapBusy(false);
          }
        }).catch((e) => {
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
  const candidates = study?.candidates || [], assumptions = study?.assumptions || [], metrics = study?.metrics || [];
  const candidate = (id) => candidates.find((c) => c.id === id), assumption = (id) => assumptions.find((a) => a.id === id), metric = (id) => metrics.find((m) => m.id === id), color = (id) => COLORS[Math.max(
    0,
    candidates.findIndex((c) => c.id === id)
  ) % COLORS.length];
  const point = busy ? null : ev?.point, winners = point?.winner_ids || [], winner = candidate(winners[0]), objective = metric(study?.objective?.metric_id), rankings = point?.rankings || [];
  const feasible = point?.feasible_ids || rankings.filter((r) => r.feasible).map((r) => r.candidate_id);
  const winnerRow = rankings.find((r) => r.candidate_id === winner?.id);
  const setValue = (id, n) => {
    const a = assumption(id);
    if (!a || !Number.isFinite(n)) return;
    const snapped = a.min + Math.round((n - a.min) / a.step) * a.step;
    setValues((v) => ({
      ...v,
      [id]: Math.min(a.max, Math.max(a.min, roundToStepPrecision(snapped, a)))
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
            enabled_constraint_ids: enabled
          }
        }
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
    return /* @__PURE__ */ jsxs("div", { className: "crux", children: [
      /* @__PURE__ */ jsx("style", { children: styles }),
      /* @__PURE__ */ jsxs("div", { className: "cx-inline", children: [
        /* @__PURE__ */ jsxs("span", { className: "cx-eyebrow", children: [
          /* @__PURE__ */ jsx(Mark, {}),
          " CRUX / DECISION MODEL"
        ] }),
        /* @__PURE__ */ jsx("h3", { children: study?.title || "Explore the decision" }),
        /* @__PURE__ */ jsx("p", { children: loading ? "Loading model\u2026" : study?.question || error || "A persistent, interactive decision model." }),
        winner && /* @__PURE__ */ jsxs("div", { className: "cx-inline-result", children: [
          /* @__PURE__ */ jsx("i", { style: { background: color(winner.id) } }),
          " ",
          winner.label,
          " ",
          /* @__PURE__ */ jsx("span", { children: fmt(
            winnerRow?.objective_value ?? winnerRow?.metrics?.[objective?.id],
            objective?.unit
          ) })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            className: "cx-btn cx-btn-primary",
            onClick: () => onNavigate?.(selected),
            children: [
              "Open decision atlas ",
              /* @__PURE__ */ jsx(Arrow, {})
            ]
          }
        ),
        /* @__PURE__ */ jsx("small", { children: "Exact thresholds \xB7 Feasibility \xB7 Conflicting constraints" })
      ] })
    ] });
  return /* @__PURE__ */ jsxs("div", { className: "crux", children: [
    /* @__PURE__ */ jsx("style", { children: styles }),
    /* @__PURE__ */ jsxs("main", { className: "cx-shell", children: [
      /* @__PURE__ */ jsxs("header", { className: "cx-top", children: [
        /* @__PURE__ */ jsxs("div", { className: "cx-brand", children: [
          /* @__PURE__ */ jsx(Mark, {}),
          " CRUX",
          " ",
          /* @__PURE__ */ jsx("span", { className: "cx-brand-sub", children: "DECISIONS, UNDER PRESSURE." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "cx-top-actions", children: [
          list.length > 0 && /* @__PURE__ */ jsx(
            "select",
            {
              "aria-label": "Choose decision model",
              value: selected,
              onChange: (e) => setSelected(e.target.value),
              children: list.map((s) => /* @__PURE__ */ jsx("option", { value: s.id, children: s.title }, s.id))
            }
          ),
          /* @__PURE__ */ jsxs("button", { className: "cx-btn cx-btn-quiet", onClick: demo, children: [
            "Open example ",
            /* @__PURE__ */ jsx(Arrow, {})
          ] })
        ] })
      ] }),
      error && /* @__PURE__ */ jsxs("div", { className: "cx-alert", role: "alert", children: [
        /* @__PURE__ */ jsx("strong", { children: "Couldn\u2019t complete that." }),
        " ",
        error,
        /* @__PURE__ */ jsx("button", { className: "cx-text-btn", onClick: () => setError(""), children: "Dismiss" })
      ] }),
      loading ? /* @__PURE__ */ jsxs("div", { className: "cx-empty", role: "status", children: [
        /* @__PURE__ */ jsx("span", { className: "cx-orbit" }),
        /* @__PURE__ */ jsx("h2", { children: "Preparing the instrument." }),
        /* @__PURE__ */ jsx("p", { children: "Loading your decision model." })
      ] }) : !study ? /* @__PURE__ */ jsxs("div", { className: "cx-empty", children: [
        /* @__PURE__ */ jsx("span", { className: "cx-empty-symbol", children: "\u2733" }),
        /* @__PURE__ */ jsx("span", { className: "cx-eyebrow", children: "SEE WHAT CHANGES THE ANSWER" }),
        /* @__PURE__ */ jsxs("h1", { children: [
          "A recommendation.",
          /* @__PURE__ */ jsx("br", {}),
          "With its breaking points."
        ] }),
        /* @__PURE__ */ jsx("p", { children: "Ask Hermes to model a decision, then explore the exact assumptions that change which option works." }),
        /* @__PURE__ */ jsxs("button", { className: "cx-btn cx-btn-primary", onClick: demo, children: [
          "Explore a project delivery example ",
          /* @__PURE__ */ jsx(Arrow, {})
        ] }),
        /* @__PURE__ */ jsx("small", { children: "Three strategies. Two hard limits. No model calls while you explore." })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("section", { className: "cx-heading", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("span", { className: "cx-eyebrow", children: [
              "DECISION STUDY ",
              /* @__PURE__ */ jsx("span", { className: "cx-slash", children: "/" }),
              " VERSION",
              " ",
              version
            ] }),
            /* @__PURE__ */ jsx("h1", { children: study.title }),
            /* @__PURE__ */ jsx("p", { children: study.question }),
            study.description && /* @__PURE__ */ jsx("span", { className: "cx-description", children: study.description })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              className: join([
                "cx-btn",
                "cx-btn-outline",
                inspector && "is-active"
              ]),
              onClick: () => setInspector(!inspector),
              "aria-expanded": inspector,
              children: [
                /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: "cx-inspect-icon", children: "\u25C8" }),
                /* @__PURE__ */ jsx("span", { className: "cx-inspect-label", children: inspector ? "Close model" : "Inspect model" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "cx-workspace", children: [
          /* @__PURE__ */ jsxs("section", { className: "cx-atlas-panel", "aria-labelledby": "atlas-title", children: [
            /* @__PURE__ */ jsxs("div", { className: "cx-panel-head", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "cx-eyebrow", children: "01 / THE DECISION FIELD" }),
                /* @__PURE__ */ jsx("h2", { id: "atlas-title", children: "Where each option wins." })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "cx-status", children: [
                /* @__PURE__ */ jsx("i", { className: busy ? "is-busy" : "" }),
                busy || mapBusy ? "Calculating" : "Live \xB7 local computation"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "cx-legend", children: [
              candidates.map((c) => /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("i", { style: { background: color(c.id) } }),
                c.label
              ] }, c.id)),
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("i", { className: "cx-hatch-key" }),
                "No option fits"
              ] })
            ] }),
            axes.length > 1 ? /* @__PURE__ */ jsx(
              Atlas,
              {
                atlas: atlasData,
                assumptions: axes.map(assumption),
                candidates,
                values,
                color,
                onChange: (x, y) => {
                  setValue(axes[0], x);
                  setValue(axes[1], y);
                },
                busy
              }
            ) : /* @__PURE__ */ jsx("div", { className: "cx-one-axis", children: "One assumption in this model. Explore its exact decision ranges below." }),
            /* @__PURE__ */ jsxs("div", { className: "cx-map-bottom", children: [
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\u2316" }),
                " Drag the point. See the decision change."
              ] }),
              /* @__PURE__ */ jsx("span", { className: "cx-map-note", children: "Sampled map \xB7 exact thresholds below" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "cx-axis-selectors", children: axes.length > 1 && axes.map((id, i) => /* @__PURE__ */ jsxs("label", { children: [
              i === 0 ? "HORIZONTAL" : "VERTICAL",
              /* @__PURE__ */ jsx(
                "select",
                {
                  value: id,
                  "aria-label": i === 0 ? "Horizontal axis" : "Vertical axis",
                  onChange: (e) => {
                    const a = [...axes], other = i === 0 ? 1 : 0, previous = a[i];
                    a[i] = e.target.value;
                    if (a[other] === a[i]) a[other] = previous;
                    setAxes(a);
                  },
                  children: assumptions.map((a) => /* @__PURE__ */ jsx("option", { value: a.id, children: a.label }, a.id))
                }
              )
            ] }, i)) })
          ] }),
          /* @__PURE__ */ jsxs("aside", { className: "cx-controls", children: [
            /* @__PURE__ */ jsxs(
              "div",
              {
                className: "cx-result",
                style: { "--winner": winner ? color(winner.id) : "#a5b4c7" },
                children: [
                  /* @__PURE__ */ jsx("span", { className: "cx-eyebrow", children: "02 / AT THIS POINT" }),
                  /* @__PURE__ */ jsx("span", { className: "cx-result-state", children: busy ? "UPDATING THIS POINT" : !ev ? "Calculating\u2026" : !winner ? "NO FEASIBLE OPTION" : winners.length > 1 ? "EXACT TIE" : study.objective.direction === "min" ? "LOWEST " + (objective?.label || "VALUE").toUpperCase() + " THAT FITS" : "HIGHEST " + (objective?.label || "VALUE").toUpperCase() + " THAT FITS" }),
                  /* @__PURE__ */ jsx("h2", { children: busy ? "Updating the answer." : !ev ? "Finding the fit." : !winner ? "Something has to give." : winners.length > 1 ? winners.map((id) => candidate(id)?.label).join(" + ") : winner.label }),
                  winner ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsxs("div", { className: "cx-result-value", children: [
                      fmt(
                        winnerRow?.objective_value ?? winnerRow?.metrics?.[objective?.id],
                        objective?.unit
                      ),
                      /* @__PURE__ */ jsx("span", { children: objective?.label?.toLowerCase() })
                    ] }),
                    /* @__PURE__ */ jsx("p", { children: winner.description })
                  ] }) : ev && !busy && /* @__PURE__ */ jsx("p", { children: "Your current requirements exclude every supplied option. Inspect the conflict below." }),
                  /* @__PURE__ */ jsxs("div", { className: "cx-result-footer", children: [
                    /* @__PURE__ */ jsx("span", { children: busy ? "Updating\u2026" : `${feasible.length} of ${candidates.length} options fit` }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      "Supplied model",
                      " ",
                      /* @__PURE__ */ jsx("span", { title: "Results are exact only within the supplied affine model. Source estimates are not independently verified.", children: "\u24D8" })
                    ] })
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "cx-assumptions", children: [
              /* @__PURE__ */ jsxs("div", { className: "cx-section-row", children: [
                /* @__PURE__ */ jsx("h3", { children: "Stress the assumptions." }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    className: "cx-text-btn",
                    onClick: () => setValues(defaults(study)),
                    children: "Reset"
                  }
                )
              ] }),
              assumptions.map((a) => /* @__PURE__ */ jsxs("div", { className: "cx-assumption", children: [
                /* @__PURE__ */ jsxs("div", { className: "cx-input-heading", children: [
                  /* @__PURE__ */ jsx("label", { htmlFor: "cx-" + a.id, children: a.label }),
                  /* @__PURE__ */ jsx("span", { className: "cx-kind cx-kind-" + a.kind, children: a.kind || "estimate" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "cx-number-line", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      id: "cx-" + a.id,
                      type: "number",
                      min: a.min,
                      max: a.max,
                      step: a.step,
                      value: values[a.id] ?? a.default,
                      onChange: (e) => setValue(a.id, Number(e.target.value))
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { children: a.unit })
                ] }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    className: "cx-range",
                    type: "range",
                    "aria-label": a.label,
                    min: a.min,
                    max: a.max,
                    step: a.step,
                    value: values[a.id] ?? a.default,
                    onChange: (e) => setValue(a.id, Number(e.target.value))
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "cx-range-ends", children: [
                  /* @__PURE__ */ jsx("span", { children: fmt(a.min, a.unit) }),
                  /* @__PURE__ */ jsx("span", { children: fmt(a.max, a.unit) })
                ] })
              ] }, a.id))
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "cx-thresholds", children: [
          /* @__PURE__ */ jsxs("div", { className: "cx-panel-head", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "cx-eyebrow", children: "03 / THE BREAKING POINTS" }),
              /* @__PURE__ */ jsx("h2", { children: "What changes the answer?" })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "cx-proof-badge", children: "\u25C7 Exact in this affine model" })
          ] }),
          /* @__PURE__ */ jsx(
            Thresholds,
            {
              ev: busy ? null : ev,
              axis: assumption(axes[0]),
              candidate,
              color,
              values,
              onJump: (n) => setValues((v) => ({ ...v, [axes[0]]: n }))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "cx-detail-grid", children: [
          /* @__PURE__ */ jsxs("div", { className: "cx-requirements", children: [
            /* @__PURE__ */ jsx("div", { className: "cx-panel-head", children: /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "cx-eyebrow", children: "04 / NON-NEGOTIABLES" }),
              /* @__PURE__ */ jsx("h2", { children: "Hard requirements." })
            ] }) }),
            study.constraints.map((c) => /* @__PURE__ */ jsxs("label", { className: "cx-requirement", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  checked: enabled.includes(c.id),
                  onChange: (e) => setEnabled(
                    (v) => e.target.checked ? [...v, c.id] : v.filter((id) => id !== c.id)
                  )
                }
              ),
              /* @__PURE__ */ jsxs("span", { children: [
                c.label,
                /* @__PURE__ */ jsxs("small", { children: [
                  metric(c.metric_id)?.label,
                  " ",
                  c.operator === ">=" ? "\u2265" : "\u2264",
                  " ",
                  fmt(c.value, metric(c.metric_id)?.unit)
                ] })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "cx-req-mark", children: enabled.includes(c.id) ? "ACTIVE" : "RELAXED" })
            ] }, c.id)),
            !busy && ev?.conflict && /* @__PURE__ */ jsxs("div", { className: "cx-conflict", children: [
              /* @__PURE__ */ jsx("span", { className: "cx-eyebrow", children: "MINIMUM CONFLICT \xB7 THIS POINT" }),
              /* @__PURE__ */ jsx("p", { children: ev.conflict.constraint_ids.map(
                (id) => study.constraints.find((c) => c.id === id)?.label || id
              ).join(" + ") }),
              /* @__PURE__ */ jsx("small", { children: "These requirements together exclude every declared option. Relax one or change an assumption." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "cx-scenarios", children: [
            /* @__PURE__ */ jsx("div", { className: "cx-panel-head", children: /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "cx-eyebrow", children: "05 / KEEP THE REASONING" }),
              /* @__PURE__ */ jsx("h2", { children: "Save the decision point." })
            ] }) }),
            /* @__PURE__ */ jsx("p", { children: "Keep the assumptions and model version together. Return when the plan changes." }),
            /* @__PURE__ */ jsxs("div", { className: "cx-save-row", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  "aria-label": "Scenario name",
                  placeholder: "Name this scenario",
                  value: snapshotLabel,
                  onChange: (e) => setSnapshotLabel(e.target.value),
                  maxLength: 100
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  className: "cx-btn cx-btn-outline",
                  disabled: saving || busy || !ev,
                  onClick: save,
                  children: [
                    saving ? "Saving\u2026" : "Save scenario",
                    " ",
                    /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\uFF0B" })
                  ]
                }
              )
            ] }),
            notice && /* @__PURE__ */ jsx("p", { className: "cx-success", role: "status", children: notice }),
            /* @__PURE__ */ jsx("div", { className: "cx-snapshot-list", children: snapshots.length ? snapshots.map((s, i) => /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  setValues(s.values);
                  setEnabled(
                    s.evaluation?.enabled_constraint_ids ?? study.constraints.map((c) => c.id)
                  );
                  setNotice("Loaded " + s.label + ".");
                },
                children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    "\u25C9 ",
                    s.label || "Saved scenario"
                  ] }),
                  /* @__PURE__ */ jsx("span", { children: "Restore \u2197" })
                ]
              },
              s.id || i
            )) : /* @__PURE__ */ jsx("small", { children: "No saved scenarios yet." }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "cx-comparison", children: [
          /* @__PURE__ */ jsxs("div", { className: "cx-panel-head", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "cx-eyebrow", children: "ALL OPTIONS / NO HIDDEN SCORES" }),
              /* @__PURE__ */ jsx("h2", { children: "The trade-offs, in the open." })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "cx-small", children: [
              "Objective:",
              " ",
              study.objective.direction === "min" ? "minimize" : "maximize",
              " ",
              objective?.label?.toLowerCase()
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "cx-table-scroll", children: /* @__PURE__ */ jsxs("table", { children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { children: "Strategy" }),
              metrics.map((m) => /* @__PURE__ */ jsx("th", { children: m.label }, m.id)),
              /* @__PURE__ */ jsx("th", { children: "Result" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: candidates.map((c) => {
              const r = rankings.find((x) => x.candidate_id === c.id);
              return /* @__PURE__ */ jsxs(
                "tr",
                {
                  className: winners.includes(c.id) ? "cx-winning-row" : "",
                  children: [
                    /* @__PURE__ */ jsxs("th", { children: [
                      /* @__PURE__ */ jsx("i", { style: { background: color(c.id) } }),
                      c.label
                    ] }),
                    metrics.map((m) => /* @__PURE__ */ jsxs("td", { children: [
                      fmt(r?.metrics?.[m.id], m.unit),
                      m.unit !== "USD" && /* @__PURE__ */ jsxs("span", { className: "cx-unit", children: [
                        " ",
                        m.unit
                      ] })
                    ] }, m.id)),
                    /* @__PURE__ */ jsx("td", { children: !r ? "\u2014" : !r.feasible ? /* @__PURE__ */ jsx("span", { className: "cx-unfit", children: "Doesn\u2019t fit" }) : winners.includes(c.id) ? /* @__PURE__ */ jsx("span", { className: "cx-fit", children: winners.length > 1 ? "Tied best" : "Best fit" }) : /* @__PURE__ */ jsx("span", { className: "cx-small", children: "Feasible" }) })
                  ]
                },
                c.id
              );
            }) })
          ] }) })
        ] }),
        inspector && /* @__PURE__ */ jsxs("section", { className: "cx-inspector", children: [
          /* @__PURE__ */ jsxs("div", { className: "cx-panel-head", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "cx-eyebrow", children: "INSPECT THE SUPPLIED MODEL" }),
              /* @__PURE__ */ jsx("h2", { children: "The model is only as good as its inputs." })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "cx-small", children: [
              "Version ",
              version,
              " \xB7 Affine expressions"
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { children: "Crux computes the consequences of these estimates. It does not verify real-world prices, capacities or delivery promises." }),
          /* @__PURE__ */ jsx("div", { className: "cx-source-grid", children: assumptions.map((a) => /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "cx-kind", children: a.kind }),
            /* @__PURE__ */ jsx("strong", { children: a.label }),
            /* @__PURE__ */ jsx("span", { children: a.source?.label || "No source supplied" }),
            a.source?.url && /^https?:\/\//i.test(a.source.url) && /* @__PURE__ */ jsx("a", { href: a.source.url, target: "_blank", rel: "noreferrer", children: "View source \u2197" })
          ] }, a.id)) }),
          /* @__PURE__ */ jsx("div", { className: "cx-formulas", children: candidates.map((c) => /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("strong", { style: { color: color(c.id) }, children: c.label }),
            Object.entries(c.metrics).map(([id, formula]) => /* @__PURE__ */ jsxs("code", { children: [
              metric(id)?.label,
              " = ",
              formula.constant,
              Object.entries(formula.coefficients || {}).map(
                ([a, n]) => ` ${n >= 0 ? "+" : "\u2212"} ${Math.abs(n)} \xD7 ${assumption(a)?.label || a}`
              ).join("")
            ] }, id))
          ] }, c.id)) })
        ] }),
        /* @__PURE__ */ jsxs("footer", { className: "cx-footer", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            "CRUX ",
            /* @__PURE__ */ jsx("span", { className: "cx-slash", children: "/" }),
            " Find the assumption that changes everything."
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            study.description?.includes("Illustrative") ? "ILLUSTRATIVE ESTIMATES \xB7 " : "",
            "FINITE OPTIONS. EXPLICIT ASSUMPTIONS. LOCAL MATH."
          ] })
        ] })
      ] })
    ] })
  ] });
}
function Thresholds({ ev, axis, candidate, color, values, onJump }) {
  if (!ev || !axis)
    return /* @__PURE__ */ jsx("p", { className: "cx-muted", children: "Computing the exact transitions\u2026" });
  const regimes = ev.axis?.regimes || [], current = values[axis.id];
  const same = (a, b) => JSON.stringify(a || []) === JSON.stringify(b || []);
  const events = [
    ...ev.axis?.boundaries || [],
    ...(ev.axis?.endpoints || []).map((e) => ({ ...e, kind: "endpoint" }))
  ];
  const borders = events.filter(
    (b, i, all) => all.findIndex(
      (x) => (x.exact_value || String(x.value)) === (b.exact_value || String(b.value))
    ) === i
  ).map((b) => {
    const left = regimes.find((r) => r.to === b.value), right = regimes.find((r) => r.from === b.value);
    const intervalChange = Boolean(
      left && right && !same(left.winner_ids, right.winner_ids)
    );
    const pointChange = Boolean(
      left && !same(left.winner_ids, b.winner_ids) || right && !same(right.winner_ids, b.winner_ids)
    );
    return {
      ...b,
      left,
      right,
      intervalChange,
      pointChange,
      isolated: !intervalChange && pointChange
    };
  }).filter((b) => b.intervalChange || b.pointChange).sort((a, b) => Math.abs(a.value - current) - Math.abs(b.value - current)).slice(0, 3);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "cx-regime-strip",
        "aria-label": "Winner ranges across " + axis.label,
        children: [
          regimes.map((r, i) => /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                flex: Math.max(0, r.to - r.from),
                background: r.winner_ids?.length ? color(r.winner_ids[0]) + "66" : "repeating-linear-gradient(135deg,#ffffff0b 0 3px,transparent 3px 8px)"
              },
              title: `${fmt(r.from)}\u2013${fmt(r.to)} ${axis.unit}: ${r.winner_ids?.map((id) => candidate(id)?.label).join(", ") || "No option fits"}`
            },
            i
          )),
          /* @__PURE__ */ jsx(
            "i",
            {
              className: "cx-regime-point",
              style: {
                left: 100 * (current - axis.min) / (axis.max - axis.min) + "%"
              }
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "cx-threshold-cards", children: borders.length ? borders.map((b, i) => {
      const side = current <= b.value ? b.right : b.left;
      const dest = b.isolated ? b.winner_ids || [] : side?.winner_ids || [];
      const names = dest.map((id) => candidate(id)?.label).join(" + ");
      const atNames = (b.winner_ids || []).map((id) => candidate(id)?.label).join(" + ");
      const Tag = b.isolated ? "article" : "button";
      return /* @__PURE__ */ jsxs(
        Tag,
        {
          className: "cx-threshold-card",
          title: "Exact boundary: " + (b.exact_value || b.value) + ". At this exact value: " + (atNames || "no option fits") + ".",
          onClick: b.isolated ? void 0 : () => {
            if (side) onJump((side.from + side.to) / 2);
          },
          children: [
            /* @__PURE__ */ jsxs("span", { className: "cx-threshold-direction", children: [
              b.isolated ? "\u25C7 EXACT POINT" : b.value >= current ? "\u2197 INCREASE" : "\u2199 DECREASE",
              " ",
              axis.label.toUpperCase()
            ] }),
            /* @__PURE__ */ jsxs("strong", { children: [
              b.exact_value?.includes("/") ? "\u2248 " : "",
              fmt(b.value),
              /* @__PURE__ */ jsx("span", { children: axis.unit })
            ] }),
            /* @__PURE__ */ jsx("p", { children: b.isolated ? dest.length ? dest.length > 1 ? `${names} tie only at this exact boundary.` : `${names} wins only at this exact boundary.` : "No option fits at this exact boundary." : dest.length ? `${names} takes over.` : "No option meets every requirement." }),
            !b.isolated && b.winner_ids?.length > 1 && /* @__PURE__ */ jsxs("small", { className: "cx-boundary-outcome", children: [
              "At the exact boundary: ",
              atNames,
              " tie."
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "cx-threshold-kind", children: [
              /* @__PURE__ */ jsx("span", { children: b.exact_value?.includes("/") ? "Exact: " + b.exact_value : b.kind === "constraint" ? "Hard-limit boundary" : b.kind === "endpoint" ? "Range endpoint" : "Recommendation boundary" }),
              /* @__PURE__ */ jsx("span", { children: b.isolated ? "Exact outcome" : "Explore interval \u2192" })
            ] })
          ]
        },
        i
      );
    }) : /* @__PURE__ */ jsxs("div", { className: "cx-no-threshold", children: [
      /* @__PURE__ */ jsx("strong", { children: "No winner change in the computed axis analysis." }),
      /* @__PURE__ */ jsxs("p", { children: [
        "The open intervals, boundary points and endpoints keep the same outcome on the ",
        axis.label.toLowerCase(),
        " axis with other assumptions fixed."
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("p", { className: "cx-exact-note", children: "Crossings are exact; the open intervals between them determine the winner. Boundary points and range endpoints are evaluated separately. Other assumptions stay fixed." })
  ] });
}
function Atlas({
  atlas,
  assumptions,
  candidates,
  values,
  color,
  onChange,
  busy
}) {
  const ref = useRef(null), [active, setActive] = useState(false), [narrow, setNarrow] = useState(false), [x, y] = assumptions, W = narrow ? 480 : 820, H = narrow ? 410 : 465, L = narrow ? 53 : 64, R = narrow ? 15 : 26, T = 22, B = 57, pw = W - L - R, ph = H - T - B;
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(
      (entries) => setNarrow(entries[0].contentRect.width < 480)
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const xs = atlas?.x_values || [], ys = atlas?.y_values || [], cells = atlas?.cells || [];
  const mapX = (n) => L + (n - x.min) / (x.max - x.min) * pw, mapY = (n) => T + ph - (n - y.min) / (y.max - y.min) * ph;
  function move(e) {
    const svg = ref.current;
    const screenTransform = svg?.getScreenCTM();
    if (!screenTransform) return;
    const screenPoint = svg.createSVGPoint();
    screenPoint.x = e.clientX;
    screenPoint.y = e.clientY;
    const { x: vx, y: vy } = screenPoint.matrixTransform(
      screenTransform.inverse()
    );
    onChange(
      x.min + Math.max(0, Math.min(1, (vx - L) / pw)) * (x.max - x.min),
      y.min + Math.max(0, Math.min(1, 1 - (vy - T) / ph)) * (y.max - y.min)
    );
  }
  const rects = useMemo(() => {
    const out = [];
    if (!cells.length) return out;
    const nx = xs.length, ny = ys.length;
    for (let j = 0; j < ny; j++) {
      let start = 0;
      for (let i = 1; i <= nx; i++) {
        if (i === nx || cells[j]?.[i] !== cells[j]?.[start]) {
          const id = cells[j]?.[start], x0 = start === 0 ? L : mapX((xs[start - 1] + xs[start]) / 2), x1 = i === nx ? L + pw : mapX((xs[i - 1] + xs[i]) / 2), yb = j === 0 ? T + ph : mapY((ys[j - 1] + ys[j]) / 2), yt = j === ny - 1 ? T : mapY((ys[j] + ys[j + 1]) / 2);
          out.push(
            /* @__PURE__ */ jsx(
              "rect",
              {
                x: x0,
                y: yt,
                width: x1 - x0 + 0.3,
                height: yb - yt + 0.3,
                fill: id ? color(id) : "url(#cx-hatch)",
                opacity: id ? 0.26 : 1
              },
              j + "-" + start
            )
          );
          start = i;
        }
      }
    }
    return out;
  }, [atlas, narrow]);
  const labels = useMemo(() => {
    const points = {};
    cells.forEach(
      (row, j) => row.forEach((id, i) => {
        if (id) {
          points[id] ??= [];
          points[id].push([mapX(xs[i]), mapY(ys[j])]);
        }
      })
    );
    return Object.entries(points).map(([id, pts]) => {
      const avg = pts.reduce(
        (s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length],
        [0, 0]
      );
      const pos = pts.reduce(
        (best, p) => Math.hypot(p[0] - avg[0], p[1] - avg[1]) < Math.hypot(best[0] - avg[0], best[1] - avg[1]) ? p : best,
        pts[0]
      );
      return /* @__PURE__ */ jsxs(
        "g",
        {
          transform: `translate(${pos[0]},${pos[1]})`,
          className: "cx-region-label",
          children: [
            /* @__PURE__ */ jsx(
              "rect",
              {
                x: narrow ? -85 : -69,
                y: -15,
                width: narrow ? 170 : 138,
                height: 30,
                rx: 4,
                fill: "#111b26",
                opacity: ".92"
              }
            ),
            /* @__PURE__ */ jsx("circle", { cx: narrow ? -70 : -54, cy: 0, r: 3, fill: color(id) }),
            /* @__PURE__ */ jsx("text", { x: narrow ? -59 : -43, y: 4, fill: color(id), children: candidates.find((c) => c.id === id)?.label })
          ]
        },
        id
      );
    });
  }, [atlas, narrow]);
  const px = mapX(values[x.id]), py = mapY(values[y.id]);
  return /* @__PURE__ */ jsxs("div", { className: "cx-atlas-wrap", children: [
    /* @__PURE__ */ jsxs(
      "svg",
      {
        ref,
        className: join(["cx-atlas", active && "is-dragging"]),
        viewBox: `0 0 ${W} ${H}`,
        role: "img",
        "aria-label": `Decision atlas. ${x.label}: ${values[x.id]} ${x.unit}. ${y.label}: ${values[y.id]} ${y.unit}. Drag to explore, or focus and use arrow keys.`,
        tabIndex: 0,
        onKeyDown: (e) => {
          let xv = values[x.id], yv = values[y.id];
          if (e.key === "ArrowLeft") xv -= x.step;
          else if (e.key === "ArrowRight") xv += x.step;
          else if (e.key === "ArrowUp") yv += y.step;
          else if (e.key === "ArrowDown") yv -= y.step;
          else return;
          e.preventDefault();
          onChange(xv, yv);
        },
        onPointerDown: (e) => {
          e.preventDefault();
          ref.current.setPointerCapture(e.pointerId);
          setActive(true);
          move(e);
        },
        onPointerMove: (e) => {
          if (active) move(e);
        },
        onPointerUp: () => setActive(false),
        onPointerCancel: () => setActive(false),
        children: [
          /* @__PURE__ */ jsxs("defs", { children: [
            /* @__PURE__ */ jsxs(
              "pattern",
              {
                id: "cx-hatch",
                width: "10",
                height: "10",
                patternUnits: "userSpaceOnUse",
                patternTransform: "rotate(45)",
                children: [
                  /* @__PURE__ */ jsx("rect", { width: "10", height: "10", fill: "#101823" }),
                  /* @__PURE__ */ jsx("rect", { width: "1", height: "10", fill: "#324052", opacity: ".38" })
                ]
              }
            ),
            /* @__PURE__ */ jsx("clipPath", { id: "cx-plot", children: /* @__PURE__ */ jsx("rect", { x: L, y: T, width: pw, height: ph, rx: "4" }) }),
            /* @__PURE__ */ jsxs("radialGradient", { id: "cx-point-glow", children: [
              /* @__PURE__ */ jsx("stop", { stopColor: "#ffffff", stopOpacity: ".3" }),
              /* @__PURE__ */ jsx("stop", { offset: "1", stopColor: "#ffffff", stopOpacity: "0" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("rect", { x: L, y: T, width: pw, height: ph, fill: "#111a25", rx: "4" }),
          /* @__PURE__ */ jsxs("g", { clipPath: "url(#cx-plot)", children: [
            rects,
            Array.from({ length: 9 }, (_, i) => /* @__PURE__ */ jsx(
              "line",
              {
                x1: L + i * pw / 8,
                x2: L + i * pw / 8,
                y1: T,
                y2: T + ph,
                stroke: "#bfd8ed",
                opacity: ".065"
              },
              "v" + i
            )),
            Array.from({ length: 7 }, (_, i) => /* @__PURE__ */ jsx(
              "line",
              {
                y1: T + i * ph / 6,
                y2: T + i * ph / 6,
                x1: L,
                x2: L + pw,
                stroke: "#bfd8ed",
                opacity: ".065"
              },
              "h" + i
            )),
            labels,
            /* @__PURE__ */ jsx(
              "line",
              {
                x1: px,
                x2: px,
                y1: T,
                y2: T + ph,
                stroke: "white",
                strokeDasharray: "3 5",
                opacity: ".35"
              }
            ),
            /* @__PURE__ */ jsx(
              "line",
              {
                x1: L,
                x2: L + pw,
                y1: py,
                y2: py,
                stroke: "white",
                strokeDasharray: "3 5",
                opacity: ".35"
              }
            ),
            /* @__PURE__ */ jsx("circle", { cx: px, cy: py, r: 40, fill: "url(#cx-point-glow)" }),
            /* @__PURE__ */ jsx(
              "circle",
              {
                cx: px,
                cy: py,
                r: 15,
                fill: "#101823",
                stroke: "white",
                strokeWidth: "1.5"
              }
            ),
            /* @__PURE__ */ jsx("circle", { cx: px, cy: py, r: 5, fill: "white" }),
            /* @__PURE__ */ jsx("line", { x1: px - 20, x2: px - 11, y1: py, y2: py, stroke: "white" }),
            /* @__PURE__ */ jsx("line", { x1: px + 11, x2: px + 20, y1: py, y2: py, stroke: "white" }),
            /* @__PURE__ */ jsx("line", { y1: py - 20, y2: py - 11, x1: px, x2: px, stroke: "white" }),
            /* @__PURE__ */ jsx("line", { y1: py + 11, y2: py + 20, x1: px, x2: px, stroke: "white" })
          ] }),
          Array.from({ length: 5 }, (_, i) => {
            const n = x.min + i * (x.max - x.min) / 4;
            return /* @__PURE__ */ jsx(
              "text",
              {
                x: mapX(n),
                y: T + ph + 23,
                textAnchor: "middle",
                className: "cx-tick",
                children: fmt(n)
              },
              "xt" + i
            );
          }),
          Array.from({ length: 5 }, (_, i) => {
            const n = y.min + i * (y.max - y.min) / 4;
            return /* @__PURE__ */ jsx(
              "text",
              {
                x: L - 13,
                y: mapY(n) + 4,
                textAnchor: "end",
                className: "cx-tick",
                children: fmt(n)
              },
              "yt" + i
            );
          }),
          /* @__PURE__ */ jsxs(
            "text",
            {
              x: L + pw / 2,
              y: H - 6,
              textAnchor: "middle",
              className: "cx-axis-label",
              children: [
                x.label.toUpperCase(),
                " ",
                /* @__PURE__ */ jsxs("tspan", { opacity: ".5", children: [
                  " / ",
                  x.unit
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "text",
            {
              transform: `translate(16 ${T + ph / 2}) rotate(-90)`,
              textAnchor: "middle",
              className: "cx-axis-label",
              children: [
                y.label.toUpperCase(),
                " ",
                /* @__PURE__ */ jsxs("tspan", { opacity: ".5", children: [
                  " / ",
                  y.unit
                ] })
              ]
            }
          )
        ]
      }
    ),
    !atlas && /* @__PURE__ */ jsx("div", { className: "cx-atlas-loading", role: "status", children: "Computing the decision field\u2026" })
  ] });
}

// src/plugin.jsx
import { jsx as jsx2 } from "react/jsx-runtime";
var plugin_default = {
  id: "hermes-crux",
  name: "Crux \u2014 Decision Atlas",
  register(ctx) {
    const api = async (path, options) => {
      const epoch = typeof sdk.gatewayActivationEpoch === "function" ? sdk.gatewayActivationEpoch() : null;
      const result = await ctx.rest(path, options);
      if (epoch !== null && sdk.gatewayActivationEpoch() !== epoch)
        throw Error(
          "The active Hermes connection changed. Reopen Crux to load this profile\u2019s models."
        );
      return result;
    };
    let selectedId = null;
    const listeners = /* @__PURE__ */ new Set();
    const refreshListeners = /* @__PURE__ */ new Set();
    const refresh = () => refreshListeners.forEach((f) => f());
    ctx.onEvent("plugin.hermes-crux.study.changed", refresh);
    ctx.onEvent("gateway.ready", refresh);
    ctx.setInterval(refresh, 3e4);
    const navigate = (id) => {
      selectedId = id || selectedId;
      listeners.forEach((f) => f(selectedId));
      sdk.host.navigate("/crux");
    };
    function Page() {
      const [id, setId] = React2.useState(selectedId), [epoch, setEpoch] = React2.useState(0), [openKey, setOpenKey] = React2.useState(0);
      React2.useEffect(() => {
        const fn = () => setEpoch((x) => x + 1);
        const open = (nextId) => {
          setId(nextId);
          setOpenKey((x) => x + 1);
        };
        listeners.add(open);
        refreshListeners.add(fn);
        return () => {
          listeners.delete(open);
          refreshListeners.delete(fn);
        };
      }, []);
      return /* @__PURE__ */ jsx2(CruxApp, { api, initialId: id, refreshEpoch: epoch }, openKey);
    }
    ctx.registerMany([
      {
        id: "page",
        area: sdk.ROUTES_AREA,
        data: { path: "/crux" },
        render: () => /* @__PURE__ */ jsx2(Page, {})
      },
      {
        id: "nav",
        area: sdk.SIDEBAR_NAV_AREA,
        data: { path: "/crux", label: "Crux", codicon: "compass" }
      },
      {
        id: "open",
        area: sdk.PALETTE_AREA,
        data: {
          id: "crux.open",
          label: "Crux: Open decision atlas",
          keywords: ["decision", "assumptions", "threshold", "crux"],
          run: () => navigate()
        }
      }
    ]);
    if (typeof sdk.TRANSCRIPT_DIRECTIVE_AREA === "string")
      ctx.register({
        id: "crux-card",
        area: sdk.TRANSCRIPT_DIRECTIVE_AREA,
        data: {
          name: "crux",
          render: ({ attrs }) => /^[a-f0-9]{32}$/.test(attrs.id || "") ? /* @__PURE__ */ jsx2(
            CruxApp,
            {
              api,
              initialId: attrs.id,
              compact: true,
              onNavigate: navigate
            }
          ) : null
        }
      });
  }
};
export {
  plugin_default as default
};
