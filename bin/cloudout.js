#!/usr/bin/env node
"use strict";

import { ArgumentParser } from "argparse";
import { readFile } from "fs/promises";
import { CloudoutClient } from "../lib/cloudout.js";

const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url)));

const parser = new ArgumentParser({
  description: pkg.description,
});

parser.add_argument("cmd", {
  type: "string",
  help: "command to execute.",
  choices: ["gen", "diff"],
});

parser.add_argument("-v", "--version", {
  action: "version",
  version: pkg.version,
});

parser.add_argument("-r", "--region", {
  help: "Region in which the cloudformation stacks are present",
  required: true,
});

parser.add_argument("-t", "--type", {
  help: "Output type of the file",
  choices: ["python", "yaml"],
  required: true,
});

parser.add_argument("-p", "--params", {
  help: 'Input params defined in your template. Pass the params as "key=value"',
  nargs: "*",
});

parser.add_argument("-i", "--input", {
  help: "Input file path",
  default: "cloudout.yml",
});

parser.add_argument("-o", "--output", {
  help:
    "Path in which the file needs to be generated. Incase of java, path to the directory as separate files will be created for each section. If not specified it will be generated in the same directory as the template",
});

const args = parser.parse_args();

let inputParams = {};
if (args.params != null) {
  for (const param of args.params) {
    if (param.includes("=")) {
      const [key, value] = param.split("=", 2);
      inputParams[key] = value;
    } else {
      throw new SyntaxError("Please pass params as key=value");
    }
  }
}

const client = new CloudoutClient(args.region);

COMMAND_EXEC = {
  gen: (args) => client.generateOutput(args.input, args.type, inputParams, args.output),
  diff: (args) => client.diff(args.input, args.type, inputParams, args.output),
};

COMMAND_EXEC[args.cmd](args);
