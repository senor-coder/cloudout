import pkg from '@aws-sdk/client-cloudformation';
const { CloudFormationClient, DescribeStacksCommand } = pkg;
import { each, isEmpty, keyBy, map, uniq, join } from "lodash-es";
import { SectionResource } from "../models.js";
import { BaseService } from "./base.js";

export class CloudformationService extends BaseService {
  static SERVICE_KEY = "$cf";
  constructor(region, strict) {
    super();
    this.client = new CloudFormationClient({ region: region });
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
      this._getResourceKey(res.context.stackName, res.context.outputKey)
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

    const unresolvedResources = join(
      map(unresolvedResourceMap, (res, key) => `${res.sectionName} -> ${res.referenceName} -> ${key}`),
      "\n"
    );
    const unresolvedResourcesMessage = `Unable to resolve the following \n${unresolvedResources}`;

    if (this.strict) {
      throw new Error(unresolvedResourcesMessage);
    } else if (unresolvedResources.length > 0) {
      console.log(console.warn, unresolvedResourcesMessage);
    }

    return resolvedResources;
  }
}
