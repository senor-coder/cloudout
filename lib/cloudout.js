import { flatMap, groupBy, keyBy, map, join, some } from "lodash-es";
import { PythonGenerator } from "./generators/pythongen.js";
import { YamlGenerator } from "./generators/yamlgen.js";
import {  PropertiesGenerator } from "./generators/propertiesgen.js";
import {  JavascriptGenerator } from "./generators/javascriptgen.js";

import { CloudoutParser } from "./parser.js";
import { CloudformationService } from "./services/cloudformation.js";
import { ParameterStoreService } from "./services/parameterstore.js";
import { PlainTextService } from "./services/plaintext.js";
import { genOutputFileName } from "./utils.js";
import fs from "fs";
import { diffLines } from "diff";
import chalk from "chalk";

export class CloudoutClient {
  constructor(services, generators, strict = false) {
    this.serviceMap = keyBy(services, (service) => service.serviceKey());
    this.genertorMap = keyBy(generators, (gen) => gen.templateType);
    this.strict = strict;
  }

  async generateOutput(inputFile, templateType, inputParams = {}) {
    const parser = CloudoutParser.from(this.serviceMap, inputFile, inputParams);
    const resources = parser.getResources();
    const serviceResources = groupBy(resources, (resourceRef) => resourceRef.serviceName);

    const resolvedResources = flatMap(
      await Promise.all(
        map(serviceResources, (resources, serviceName) => {
          try {
            return this.serviceMap[serviceName].resolveResources(resources);
          } catch (err) {
            if (this.strict) {
              throw err;
            } else {
              console.log(console.warn, err.message);
            }
          }
        })
      )
    );

    const generator = this.genertorMap[templateType];
    return generator.generate(resolvedResources);
  }

  async generateOutputToFile(inputFile, templateType, inputParams = {}, outFile = null) {
    const output = await this.generateOutput(inputFile, templateType, inputParams);
    const generator = this.genertorMap[templateType];
    outFile = outFile == null ? genOutputFileName(inputFile, generator.fileExtension) : outFile;
    console.log(console.info, `Generating output @ ${outFile} .....`);
    fs.writeFileSync(outFile, output);
  }

  async getDiff(inputFile, templateType, inputParams = {}, outFile) {
    const output = await this.generateOutput(inputFile, templateType, inputParams);
    const existingOutput = fs.readFileSync(outFile, {
      encoding: "utf8",
      flag: "r",
    });

    return diffLines(existingOutput, output, {ignoreWhitespace:true, newlineIsToken : false});
  }

  async printDiff(inputFile, templateType, inputParams = {}, outFile) {
    const diffs = await this.getDiff(inputFile, templateType, inputParams, outFile)
    const displayDiffs = map(diffs, (diff) => {
      let value = chalk.white(`${diff.value}`);
      if (diff.added) {
        value = chalk.green(`+ ${diff.value}`);
      } else if (diff.removed) {
        value = chalk.red(`- ${diff.value}`);
      }
      return value;
    });
    console.log(join(displayDiffs, ""));
  }

  async verify(inputFile, templateType, inputParams = {}, outFile) {
    const diffs = await this.getDiff(inputFile, templateType, inputParams, outFile);
    const hasChanged = some(diffs, (diff)=> diff.added || diff.removed);
    return hasChanged;
  }

  static getDefaultClient(region, strict = false) {
    return new CloudoutClient(
      [new CloudformationService(region, strict), new ParameterStoreService(region, strict), new PlainTextService()],
      [new PythonGenerator(), new YamlGenerator(), new PropertiesGenerator(), new JavascriptGenerator()]
    );
  }
}
