import fs from "fs";
import handlebars from "handlebars";
import jsyaml from "js-yaml";
import { entries, filter, flatMap, flow, map, partialRight } from "lodash-es";
import { SectionResourceReference } from "./models.js";
import { PlainTextService } from "./services/plaintext.js";

export class CloudoutParserError extends Error {
  constructor(message) {
    super(message);
    Error.captureStackTrace(this, CloudoutParserError);
  }
}

export class CloudoutParser {
  constructor(serviceMap, templateResources) {
    this.serviceMap = serviceMap;
    this.templateResources = templateResources;
  }

  _parseSectionRes(sectionRes) {
    let [serviceName, _] = sectionRes.referenceValue.split(":", 2);

    if (!(serviceName in this.serviceMap)) {
      serviceName = PlainTextService.SERVICE_KEY;
    }
    const context = this.serviceMap[serviceName].parse(sectionRes);
    const sectionResourceRef = new SectionResourceReference(
      sectionRes.sectionName,
      sectionRes.referenceName,
      sectionRes.referenceValue,
      serviceName,
      context
    );

    return sectionResourceRef;
  }

  getResources(serviceName = null) {
    return flow([
      entries,
      partialRight(flatMap, (section) =>
        map(entries(section[1]), (res) => ({
          sectionName: section[0],
          referenceName: res[0],
          referenceValue: res[1],
        }))
      ),
      partialRight(map, (sectionReference) => this._parseSectionRes(sectionReference)),
      partialRight(filter, (res) => serviceName == null || res.serviceName == serviceName),
    ])(this.templateResources);
  }

  static from(serviceMap, resourceFilePath, inputParams) {
    let templateContent = fs.readFileSync(resourceFilePath, "utf-8");
    const template = handlebars.compile(templateContent);
    templateContent = template(inputParams);
    const templateResources = jsyaml.load(templateContent);
    return new CloudoutParser(serviceMap, templateResources);
  }
}
