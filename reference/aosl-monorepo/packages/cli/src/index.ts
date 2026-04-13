#!/usr/bin/env node
import { summarizePlan } from "@aosl/runtime";

console.log("aosl CLI booting...");
console.log("commands: run | plan | lint | replay | inspect");

const summary = summarizePlan([
  { kind: "fs.read", paths: ["package.json", "src/**"] },
  { kind: "process.run", commands: ["npm"], timeoutMs: 30000 },
  { kind: "git.read", repos: ["."] },
]);

console.log(JSON.stringify(summary, null, 2));
