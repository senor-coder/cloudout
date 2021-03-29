import fs from "fs";
import handlebars from "handlebars";
import { groupBy } from "lodash-es";

export class BaseGenerator {
  constructor(templateType, fileExtension) {
    this.templateType = templateType;
    this.fileExtension = fileExtension;
    if (this === BaseGenerator) {
      throw new TypeError("Cannot instantiate AbstractClass");
    }
  }

  generate(sectionResources) {
    throw new TypeError("To be implemented by the deriving class");
  }
}

export class CloudoutBaseTemplateGenerator extends BaseGenerator {
  constructor(templateType, fileExtension) {
    super(templateType, fileExtension);
  }

  generate(sectionResources) {
    const templateContent = fs.readFileSync(
      new URL(`../../res/templates/${this.templateType}.handlebars`, import.meta.url),
      {
        encoding: "utf8",
        flag: "r",
      }
    );
    const template = handlebars.compile(templateContent);
    const context = {
      sections: groupBy(sectionResources, (sectionRes) => sectionRes.sectionName),
    };
    const output = template(context);
    return output;
  }
}
