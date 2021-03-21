import fs from "fs";
import handlebars from "handlebars";
import jsyaml from "js-yaml";
import { flow, map, partialRight, entries, flatMap, groupBy, filter } from "lodash-es";
import { Services } from "./const.js";

export class CloudoutParserError extends Error {
  constructor(message) {
    super(message);
    Error.captureStackTrace(this, CloudoutParserError);
  }
}

export class CloudoutParser {
  static serviceParserMap = {
    [Services.parameterStore]: CloudoutParser._parseSSM,
    [Services.cloudformation]: CloudoutParser._parseCF,
    [Services.plainText]: CloudoutParser._parsePlainText
  };

  constructor(templateResources) {
    this.templateResources = templateResources;
  }

  static _parseCF(sectionRes) {
    const [_, stackName, outputKey] = sectionRes.value.split(":", 3);

    return {
      stackName: stackName,
      outputKey: outputKey,
    };
  }

  static _parseSSM(sectionRes) {
    const [service, parameterName, decrypt] = sectionRes.value.split(":", 3);

    if (parameterName == null) {
      throw new CloudoutParserError(
        `ParameterName cannot be empty in section -> ${sectionRes.sectionName} -> ${sectionRes.referenceName}`
      );
    }

    return {
      parameterName: parameterName,
      decrypt: decrypt === "True" || decrypt === "true",
    };
  }

  static _parsePlainText(sectionRes){
    return {
      text: sectionRes.value
    }
  }

  static _parseSectionRes(sectionRes) {
    let [serviceName, _] = sectionRes.value.split(":", 2);

    if (_ == null) {
      serviceName = Services.plainText;
    }

    if (!(serviceName in CloudoutParser.serviceParserMap)) {
      throw new CloudoutParserError(`Unknow service in ${sectionRes.sectionName} -> ${sectionRes.referenceName}`);
    }

    const res = CloudoutParser.serviceParserMap[serviceName](sectionRes);
    res.serviceName = serviceName;
    res.referenceName = sectionRes.referenceName;
    res.sectionName = sectionRes.sectionName;
    return res;
  }

  getResources(serviceName = null) {
    return flow([
      entries,
      partialRight(flatMap, (section) =>
        map(entries(section[1]), (res) => ({
          sectionName: section[0],
          referenceName: res[0],
          value: res[1],
        }))
      ),
      partialRight(map, CloudoutParser._parseSectionRes),
      partialRight(filter, (res) => serviceName == null || res.serviceName == serviceName),
    ])(this.templateResources);
  }

  getCloudformationResources() {
    return this.getResources(Services.cloudformation);
  }

  getSSMResources() {
    return this.getResources(Services.parameterStore);
  }

  static from(resourceFilePath, inputParams) {
    let templateContent = fs.readFileSync(resourceFilePath, 'utf-8');
    const template = handlebars.compile(templateContent)
    templateContent = template(inputParams);
    const templateResources = jsyaml.load(templateContent);
    return new CloudoutParser(templateResources);
  }
}
