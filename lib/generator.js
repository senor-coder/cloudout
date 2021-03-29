import fs from "fs";
import handlebars from "handlebars";
import {keyBy} from "lodash-es";

export class CloudoutTemplateGenerator {

  static generate(templateType, sectionResources, outFile) {
    const templateContent = fs.readFileSync(new URL(`../res/templates/${templateType}.handlebars`, import.meta.url), {
      encoding: "utf8",
      flag: "r",
    });

    keyBy(sectionResources, sectionRes => sectionRes.sectionName)
    const template = handlebars.compile(templateContent);
    const output = template(context);
    fs.writeFileSync(outFile, output);
  }
}
