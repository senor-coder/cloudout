import { BaseService } from "./base.js";
import pkg from "@aws-sdk/client-ssm";
const { GetParametersCommand, SSMClient } = pkg;
import { SectionResource } from "../models.js";
import {map, keyBy} from "lodash-es";

export class ParameterStoreService extends BaseService {
  static SERVICE_KEY = "$ssm";

  constructor(region, strict) {
    super();
    this.client = new SSMClient({ region: region });
    this.strict = strict;
  }

  async resolveResources(resourceReferences) {
    const parameters = map(resourceReferences, (res) => res.context.parameterName);
    const command = new GetParametersCommand({ Names: parameters, WithDecryption: true });

    const parameterResults = await this.client.send(command);

    const resourceMap = keyBy(resourceReferences, (res) => res.context.parameterName);

    parameterResults.InvalidParameters.forEach((param) => {
      const message = `Invalid SSM parameter: ${param}`;
      if (this.strict) {
        throw new Error(message)
      } else {
        console.log(console.warn, message);
      }
    });

    return map(parameterResults.Parameters, (paramResult) => {
      const resourceRef = resourceMap[paramResult.Name];
      return new SectionResource(resourceRef, paramResult.Value);
    });
  }

  serviceKey() {
    return ParameterStoreService.SERVICE_KEY;
  }

  parse(resourceReference) {
    const [service, parameterName, decrypt] = resourceReference.referenceValue.split(":", 3);

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
}
