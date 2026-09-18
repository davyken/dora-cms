#!/usr/bin/env node
import { runInit } from "./init.js";

function printHelp(): void {
  console.log(`dora-cms — setup for the dora-cms backend

Usage:
  npx dora-cms init [dir]   Interactively generate .env for @dora-cms/server
                            (default dir: current directory)
`);
}

async function main(): Promise<void> {
  const [, , command, ...rest] = process.argv;
  const targetDir = rest.find((a) => !a.startsWith("-")) ?? process.cwd();

  switch (command) {
    case "init":
      await runInit(targetDir);
      return;
    case undefined:
    case "--help":
    case "-h":
      printHelp();
      return;
    default:
      console.error(`Unknown command: ${command}\n`);
      printHelp();
      process.exitCode = 1;
  }
}

main();
