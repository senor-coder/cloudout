export class Services {
  static cloudformation = "$cf";
  static parameterStore = "$ssm";
  static plainText = "$plain"
}

export class TemplateType {
  static python = "python";
  static yaml = "yaml";
}

export const TemplateTypeExtensionMap = {
  [TemplateType.python]: "py",
  [TemplateType.yaml]: "yml",
};