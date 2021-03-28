import fs from "fs";
import handlebars from "handlebars";

export class BaseGenerator {
  constructor(templateType, fileExtension) {
    this.templateType = templateType;
    this.fileExtension = fileExtension;
    if (this === BaseGenerator) {
      throw new TypeError("Cannot instantiate AbstractClass");
    }
  }

  generate(context, outFile) {
    throw new TypeError("To be implemented by the deriving class");
  }
}

export class CloudoutBaseTemplateGenerator extends BaseGenerator {
  constructor(templateType, fileExtension) {
    super(templateType, fileExtension);
  }

  generate(context, outFile) {
    const templateContent = fs.readFileSync(
      new URL(`../res/templates/${this.templateType}.handlebars`, import.meta.url),
      {
        encoding: "utf8",
        flag: "r",
      }
    );
    const template = handlebars.compile(templateContent);
    const output = template(context);
    fs.writeFileSync(outFile, output);
  }
}
