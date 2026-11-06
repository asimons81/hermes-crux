import { build } from "esbuild";
await build({
  entryPoints: ["src/plugin.jsx"],
  outfile: "plugin.js",
  bundle: true,
  loader: { ".css": "text" },
  format: "esm",
  target: "es2022",
  jsx: "automatic",
  external: ["react", "react/jsx-runtime", "@hermes/plugin-sdk"],
  legalComments: "eof",
});
if (process.argv.includes("--preview"))
  await build({
    entryPoints: ["preview/main.jsx"],
    outfile: "preview/app.js",
    bundle: true,
    loader: { ".css": "text" },
    format: "esm",
    target: "es2022",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
  });
