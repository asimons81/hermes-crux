/* Exercise the actual preview REST service. Start preview/serve.py with isolated data first. */
const assert = require("node:assert/strict");
const { chromium } = require("@playwright/test");

(async () => {
  const base = process.env.CRUX_PREVIEW_URL || "http://127.0.0.1:9141";
  const seeded = await fetch(
    base + "/api/plugins/hermes-crux/demos/project-delivery",
    { method: "POST" },
  );
  assert.equal(seeded.status, 201, "Create a fresh real-backend example");
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.CRUX_BROWSER_CHANNEL || "chrome",
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page
      .locator(".cx-result h2")
      .filter({ hasText: "Specialist assist" })
      .waitFor();
    await page.waitForFunction(
      () => document.querySelectorAll(".cx-region-label").length === 3,
    );
    // New examples can have identical defaults. The loaded model identity must
    // still start a fresh field request after its guard rejected the old model.
    for (let attempt = 0; attempt < 2; attempt++) {
      const previousId = await page
        .getByRole("combobox", { name: "Choose decision model" })
        .inputValue();
      const rasterResponse = page.waitForResponse((response) => {
        const request = response.request();
        return (
          response.url().endsWith("/evaluate") &&
          !response.url().includes(previousId) &&
          request.postDataJSON()?.axes
        );
      });
      await page.getByRole("button", { name: "Open example" }).click();
      const response = await rasterResponse;
      assert.equal(
        response.status(),
        200,
        "Same-default example gets a real field response",
      );
      await page.waitForFunction(
        (previousId) =>
          document.querySelector('select[aria-label="Choose decision model"]')
            .value !== previousId,
        previousId,
      );
      await page.waitForFunction(
        () =>
          document.querySelectorAll(".cx-region-label").length === 3 &&
          !document.querySelector(".cx-atlas-loading"),
      );
      assert.equal(await page.locator("#cx-scope").inputValue(), "16");
      assert.equal(await page.locator("#cx-deadline").inputValue(), "12");
    }
    async function dragDecisionPoint(scope, days) {
      const svg = page.getByRole("img", { name: /Decision atlas/ });
      await svg.scrollIntoViewIfNeeded();
      async function clientPosition(scopeValue, daysValue) {
        return page.evaluate(
          ({ scopeValue, daysValue }) => {
            const svg = document.querySelector(".cx-atlas");
            const plot = svg.querySelector(":scope > rect");
            const sx = document.querySelector("#cx-scope"),
              sy = document.querySelector("#cx-deadline");
            const p = svg.createSVGPoint();
            p.x =
              Number(plot.getAttribute("x")) +
              ((scopeValue - Number(sx.min)) /
                (Number(sx.max) - Number(sx.min))) *
                Number(plot.getAttribute("width"));
            p.y =
              Number(plot.getAttribute("y")) +
              (1 -
                (daysValue - Number(sy.min)) /
                  (Number(sy.max) - Number(sy.min))) *
                Number(plot.getAttribute("height"));
            const screen = p.matrixTransform(svg.getScreenCTM());
            return { x: screen.x, y: screen.y };
          },
          { scopeValue, daysValue },
        );
      }
      const current = await clientPosition(
        Number(await page.locator("#cx-scope").inputValue()),
        Number(await page.locator("#cx-deadline").inputValue()),
      );
      const target = await clientPosition(scope, days);
      await page.mouse.move(current.x, current.y);
      await page.mouse.down();
      await page.mouse.move(target.x, target.y, { steps: 8 });
      await page.mouse.up();
      await page.waitForFunction(
        ({ scope, days }) =>
          Number(document.querySelector("#cx-scope").value) === scope &&
          Number(document.querySelector("#cx-deadline").value) === days,
        { scope, days },
      );
      await page
        .locator(".cx-result h2")
        .filter({ hasText: "Solo sprint" })
        .waitFor();
    }
    // 1600px produces a wide plot whose SVG is max-height letterboxed.
    await page.setViewportSize({ width: 1600, height: 1000 });
    await dragDecisionPoint(16, 20);
    await page.locator("#cx-deadline").fill("12");
    await page
      .locator(".cx-result h2")
      .filter({ hasText: "Specialist assist" })
      .waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(
      () => document.querySelector(".cx-atlas").viewBox.baseVal.width === 480,
    );
    const geometry = await page.evaluate(() => {
      const svg = document.querySelector(".cx-atlas"),
        plot = svg.querySelector(":scope > rect");
      const right =
        Number(plot.getAttribute("x")) + Number(plot.getAttribute("width"));
      const cells = [...svg.querySelectorAll("g[clip-path] > rect")];
      return {
        plotRight: right,
        cellRight: Math.max(
          ...cells.map(
            (r) =>
              Number(r.getAttribute("x")) + Number(r.getAttribute("width")),
          ),
        ),
      };
    });
    assert.ok(
      geometry.cellRight <= geometry.plotRight + 0.31,
      "Existing field recomputes its geometry after narrow resize",
    );
    await dragDecisionPoint(16, 20);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.waitForFunction(
      () => document.querySelector(".cx-atlas").viewBox.baseVal.width === 820,
    );
    let atlasRequests = 0;
    page.on("request", (request) => {
      if (request.url().endsWith("/evaluate") && request.postDataJSON()?.axes)
        atlasRequests++;
    });
    await page.locator("#cx-deadline").fill("20");
    await page
      .locator(".cx-result h2")
      .filter({ hasText: "Solo sprint" })
      .waitFor();
    await page.locator("#cx-scope").fill("18");
    await page
      .locator(".cx-result-state")
      .filter({ hasText: "EXACT TIE" })
      .waitFor();
    assert.match(
      await page.locator(".cx-result h2").innerText(),
      /Solo sprint.*Specialist assist/,
    );
    await page.locator("#cx-scope").fill("20");
    await page
      .locator(".cx-result h2")
      .filter({ hasText: "Specialist assist" })
      .waitFor();
    assert.equal(atlasRequests, 0, "Axis moves reuse the sampled field");
    await page.locator("#cx-scope").fill("16");
    await page.locator("#cx-deadline").fill("8");
    await page.locator("#cx-budget").fill("2400");
    await page
      .locator(".cx-result-state")
      .filter({ hasText: "NO FEASIBLE OPTION" })
      .waitFor();
    await page.locator(".cx-conflict").waitFor();
    assert.match(
      await page.locator(".cx-conflict p").innerText(),
      /Deliver by the deadline.*Stay within budget/,
    );
    const budget = page.getByRole("checkbox", { name: "Stay within budget" });
    const deadline = page.getByRole("checkbox", {
      name: "Deliver by the deadline",
    });
    await budget.uncheck();
    await page
      .locator(".cx-result h2")
      .filter({ hasText: "Studio build" })
      .waitFor();
    await page
      .getByRole("textbox", { name: "Scenario name" })
      .fill("Deadline first");
    await page.getByRole("button", { name: "Save scenario" }).click();
    await page.getByRole("button", { name: "Deadline first" }).waitFor();
    await budget.check();
    await page
      .locator(".cx-result-state")
      .filter({ hasText: "NO FEASIBLE OPTION" })
      .waitFor();
    await page.getByRole("button", { name: "Deadline first" }).click();
    await page
      .locator(".cx-result h2")
      .filter({ hasText: "Studio build" })
      .waitFor();
    assert.equal(
      await budget.isChecked(),
      false,
      "Snapshot restores disabled requirement",
    );
    await deadline.uncheck();
    await page
      .locator(".cx-result h2")
      .filter({ hasText: "Solo sprint" })
      .waitFor();
    await page
      .getByRole("textbox", { name: "Scenario name" })
      .fill("No requirements");
    await page.getByRole("button", { name: "Save scenario" }).click();
    await page.getByRole("button", { name: "No requirements" }).waitFor();
    await budget.check();
    await deadline.check();
    await page
      .locator(".cx-result-state")
      .filter({ hasText: "NO FEASIBLE OPTION" })
      .waitFor();
    await page.getByRole("button", { name: "No requirements" }).click();
    await page
      .locator(".cx-result h2")
      .filter({ hasText: "Solo sprint" })
      .waitFor();
    assert.equal(await budget.isChecked(), false);
    assert.equal(
      await deadline.isChecked(),
      false,
      "Empty requirement mask restores exactly",
    );
    await page.getByRole("button", { name: "Inspect model" }).click();
    await page.locator(".cx-inspector").waitFor();
    await page.getByRole("img", { name: /Decision atlas/ }).focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(
      () => document.querySelector("#cx-scope").value === "17",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(
      () => document.querySelector(".cx-atlas").viewBox.baseVal.width === 480,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => {
      document.querySelector("#root").style.cssText =
        "width:450px;margin:0 auto";
      document.documentElement.style.setProperty("--background", "#fff");
      document.documentElement.style.setProperty("--foreground", "#111");
    });
    await page.waitForFunction(
      () =>
        !getComputedStyle(
          document.querySelector(".cx-workspace"),
        ).gridTemplateColumns.includes(" "),
    );
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.querySelector(".crux")).backgroundColor,
      ),
      "rgb(12, 17, 25)",
    );
    assert.equal(
      await page.evaluate(
        () =>
          document.querySelector(".crux").scrollWidth >
          document.querySelector(".crux").clientWidth,
      ),
      false,
    );
    const isolated = {
      title: "Isolated-point display check",
      question: "Can the one exact feasible point be seen?",
      assumptions: [
        {
          id: "x",
          label: "Position",
          unit: "units",
          min: 0,
          max: 10,
          step: 1,
          default: 4,
          kind: "estimate",
        },
      ],
      metrics: [
        { id: "cost", label: "Cost", unit: "USD" },
        { id: "position", label: "Position", unit: "units" },
        { id: "tiny", label: "Small signal", unit: "units" },
      ],
      candidates: [
        {
          id: "only",
          label: "Only option",
          metrics: {
            cost: { constant: 0.01, coefficients: {} },
            position: { constant: 0, coefficients: { x: 1 } },
            tiny: { constant: 0.0004, coefficients: {} },
          },
        },
      ],
      constraints: [
        {
          id: "lower",
          label: "At least five",
          metric_id: "position",
          operator: ">=",
          value: 5,
        },
        {
          id: "upper",
          label: "At most five",
          metric_id: "position",
          operator: "<=",
          value: 5,
        },
      ],
      objective: { metric_id: "cost", direction: "min" },
    };
    async function createModel(model) {
      const response = await fetch(base + "/api/plugins/hermes-crux/studies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ study: model }),
      });
      assert.equal(response.status, 201);
      await page.reload();
      await page
        .locator(".cx-heading h1")
        .filter({ hasText: model.title })
        .waitFor();
    }
    await createModel(isolated);
    await page
      .getByText("Only option wins only at this exact boundary.")
      .waitFor();
    await page.getByRole("cell", { name: "$0.01", exact: true }).waitFor();
    assert.match(await page.locator(".cx-comparison").innerText(), /0.0004/);
    await createModel({
      ...isolated,
      title: "Endpoint display check",
      constraints: [
        {
          id: "endpoint",
          label: "At the origin",
          metric_id: "position",
          operator: "<=",
          value: 0,
        },
      ],
    });
    await page
      .getByText("Only option wins only at this exact boundary.")
      .waitFor();
    assert.match(
      await page.locator(".cx-threshold-card").innerText(),
      /Range endpoint|Hard-limit boundary/,
    );
    assert.deepEqual(errors, [], "No browser runtime errors");
    console.log(
      "Crux browser smoke passed: winner, exact tie, boundaries, conflict, zero-map-refetch, requirement relaxation, snapshot masks including empty, inspector, keyboard atlas, mobile and narrow host pane, repeated same-default example field loading, true pointer drags in letterboxed1600px and resized390px maps, isolated feasible point and endpoint outcomes, cents and tiny-value display.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
