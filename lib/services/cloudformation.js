import { CloudFormationClient, DescribeStacksCommand } from "@aws-sdk/client-cloudformation";
import { each, isEmpty, keyBy, map, uniq } from "lodash-es";
import { SectionResource } from "../models.js";
import { BaseService } from "./base.js";

export class CloudformationService extends BaseService {
  static SERVICE_KEY = "$cf";
  constructor(region, strict) {
    super();
    this.client = new CloudFormationClient({ Region: region });
    this.strict = strict;
  }

  serviceKey() {
    return CloudformationService.SERVICE_KEY;
  }

  parse(resourceReference) {
    const [_, stackName, outputKey] = resourceReference.referenceValue.split(":", 3);

    return {
      stackName: stackName,
      outputKey: outputKey,
    };
  }

  _getResourceKey(stackName, outputKey) {
    return `${stackName}:${outputKey}`;
  }

  _getAllStackDefinitions(stackNames) {
    return map(stackNames, async (stackName) => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      try {
        let result = await this.client.send(command);
        return result;
      } catch (err) {
        if (this.strict) {
          throw new Error(`Cloudformation stack: ${stackName} not found.`);
        } else {
          return null;
        }
      }
    });
  }

  async resolveResources(resourceReferences) {
    const unresolvedResourceMap = keyBy(resourceReferences, (res) =>
      this._getResourceKey(res.stackName, res.context.outputKey)
    );

    const resolvedResources = [];

    const stackNames = uniq(map(resourceReferences, (res) => res.context.stackName));

    for await (let stack of this._getAllStackDefinitions(stackNames)) {
      if (stack != null) {
        stack = stack.Stacks[0];
        for (const item of stack.Outputs) {
          const resourceKey = this._getResourceKey(stack.StackName, item.OutputKey);
          if (resourceKey in unresolvedResourceMap) {
            let resferenceRes = unresolvedResourceMap[resourceKey];
            resolvedResources.push(new SectionResource(resferenceRes, item.OutputValue));

            delete unresolvedResourceMap[resourceKey];

            if (isEmpty(unresolvedResourceMap)) {
              break;
            }
          }
        }
      }
    }

    each(unresolvedResourceMap, (res, key) =>
      console.log(console.warn, `Could not resolve value for ${res.sectionName} -> ${res.referenceName} -> ${key}`)
    );

    return resolvedResources;
  }
}
