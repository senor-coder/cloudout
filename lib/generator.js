import fs from "fs";
import handlebars from "handlebars";

export class CloudoutTemplateGenerator {

  static generate(templateType, context, outFile) {
    const templateContent = fs.readFileSync(new URL(`../res/templates/${templateType}.handlebars`, import.meta.url), {
      encoding: "utf8",
      flag: "r",
    });
    const template = handlebars.compile(templateContent);
    const output = template(context);
    fs.writeFileSync(outFile, output);
  }
}
