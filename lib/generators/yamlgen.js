import { CloudoutBaseTemplateGenerator } from "./base.js";

export class YamlGenerator extends CloudoutBaseTemplateGenerator {
  constructor() {
    super("yaml", "yml");
  }
}
