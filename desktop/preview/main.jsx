import React from "react";
import { createRoot } from "react-dom/client";
import { CruxApp } from "../src/App.jsx";
const api = async (path, options = {}) => {
  const response = await fetch("/api/plugins/hermes-crux" + path, {
    ...options,
    headers: { "Content-Type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw Error("The backend did not return JSON.");
  }
  if (!response.ok)
    throw Error(
      typeof data.detail === "string"
        ? data.detail
        : JSON.stringify(data.detail || data.error || data),
    );
  return data;
};
createRoot(document.getElementById("root")).render(<CruxApp api={api} />);
