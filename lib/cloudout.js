import { flatMap, groupBy, keyBy, map } from "lodash-es";
import { PythonGenerator } from "./generators/pythongen.js";
import { YamlGenerator } from "./generators/yamlgen.js";
import { CloudoutParser } from "./parser.js";
import { CloudformationService } from "./services/cloudformation.js";
import { ParameterStoreService } from "./services/parameterstore.js";
import { PlainTextService } from "./services/plaintext.js";
import { genOutputFileName } from "./utils.js";

export class CloudoutClient {
  constructor(services, generators, strict = false) {
    this.serviceMap = keyBy(services, (service) => service.serviceKey());
    this.genertorMap = keyBy(generators, (gen) => gen.templateType);
    this.strict = strict;
  }

  async generateOutput(inputFile, templateType, inputParams = {}, outfile = null) {
    const parser = CloudoutParser.from(this.services, inputFile, inputParams);
    const resources = parser.getResources();
    const serviceResources = groupBy(resources, (resourceRef) => resourceRef.serviceName);

    console.log(console.info, "Resolving resources");

    const resolvedResources = flatMap(
      await Promise.all(
        map(serviceResources, (resources, serviceName) => {
          try {
            this.serviceMap[serviceName].resolveResources(resources);
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

    const inputContext = {
      sections: groupBy(resolvedResources, (res) => res.serviceName),
    };

    const generator = this.genertorMap[templateType];

    outfile = outfile == null ? genOutputFileName(inputFile, generator.fileExtension) : outfile;

    console.log(console.info, `Generating output @ ${outfile} .....`);

    generator.generate(inputContext, outfile);
  }

  static getDefaultClient(region, strict = false) {
    return new CloudoutClient(
      [new CloudformationService(region, strict), new ParameterStoreService(region), new PlainTextService()],
      [new PythonGenerator(), new YamlGenerator()],
      strict
    );
  }
}
