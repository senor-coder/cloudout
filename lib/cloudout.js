import { flatMap, groupBy, map } from "lodash-es";
import { Services, TemplateType } from "./const.js";
import { CloudoutTemplateGenerator } from "./generator.js";
import { CloudoutParser } from "./parser.js";
import { CloudformationService, ParameterStoreService, PlainTextService } from "./services.js";
import { genOutputFileName } from "./utils.js";

const context = {
  sections: [
    {
      name: "Lambdas",
      resources: [
        {
          key: "dbservice",
          value: "foo",
        },
      ],
    },
  ],
};

export class CloudoutClient {
  constructor(region) {
    this.service_resolvers = {
      [Services.cloudformation]: new CloudformationService(region),
      [Services.parameterStore]: new ParameterStoreService(region),
      [Services.plainText]: new PlainTextService(),
    };
  }

  async generateOutput(inputFile, templateType, inputParams = {}, outfile = null) {
    const parser = CloudoutParser.from(inputFile, inputParams);
    const resources = parser.getResources();
    const serviceResources = groupBy(resources, "serviceName");

    console.log(console.info, "Resolving resources");

    const resolvedResources = flatMap(
      await Promise.all(
        map(serviceResources, (resources, serviceName) =>
          this.service_resolvers[serviceName].resolveResources(resources)
        )
      )
    );

    const inputContext = {
      sections: groupBy(resolvedResources, "sectionName"),
    };

    outfile = outfile == null ? genOutputFileName(inputFile, templateType) : outfile;

    console.log(console.info, `Generating output @ ${outfile} .....`);

    CloudoutTemplateGenerator.generate(templateType, inputContext, outfile);
  }
}
