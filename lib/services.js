import { CloudFormationClient, paginateListExports, DescribeStacksCommand } from "@aws-sdk/client-cloudformation";
import { GetParametersCommand, SSMClient } from "@aws-sdk/client-ssm";
import { keyBy, isEmpty, map, uniq, each } from "lodash-es";

class Service {
  constructor() {
    if (this === Service) {
      throw new TypeError("Cannot instantiate AbstractClass");
    }
  }
  async resolvedResources() {
    throw new TypeError("To be implemented by the deriving class");
  }
}

export class CloudformationService extends Service {
  constructor(region) {
    super();
    this.client = new CloudFormationClient({ Region: region });
  }

  _getResourceKey(stackName, outputKey) {
    return `${stackName}:${outputKey}`;
  }

  _getAllStackDefinitions(stackNames) {
    return map(stackNames, (stackName) => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      return this.client.send(command);
    });
  }

  async resolveResources(resources) {
    const unresolvedResourceMap = keyBy(resources, (res) => this._getResourceKey(res.stackName, res.outputKey));

    const resolvedResources = [];

    const stackNames = uniq(map(resources, (res) => res.stackName));

    for await (let stack of this._getAllStackDefinitions(stackNames)) {
      stack = stack.Stacks[0];
      for (const item of stack.Outputs) {
        const resourceKey = this._getResourceKey(stack.StackName, item.OutputKey);
        if (resourceKey in unresolvedResourceMap) {
          let resource = unresolvedResourceMap[resourceKey];
          resolvedResources.push({ ...resource, ...{ value: item.OutputValue } });
          delete unresolvedResourceMap[resourceKey];

          if (isEmpty(unresolvedResourceMap)) {
            break;
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

export class ParameterStoreService extends Service {
  constructor(region) {
    super();
    this.client = new SSMClient({ Region: region });
  }

  async resolveResources(resources) {
    const parameters = map(resources, (res) => res.parameterName);
    const command = new GetParametersCommand({ Names: parameters, WithDecryption: true });
    
    const parameterResults = await this.client.send(command);

    const resourceMap = keyBy(resources, res => res.parameterName)

    parameterResults.InvalidParameters.forEach(param => console.log(console.warn, `Invalid SSM parameter: ${param}`))

    return map(parameterResults.Parameters, paramResult =>{
      const resource = resourceMap[paramResult.Name]
      return {...resource, ...{value: paramResult.Value}}
    });
  }
}

export class PlainTextService extends Service {

  constructor() {
    super();
  }

  async resolveResources(resources) {
    return map(resources, res =>{
      return {...res, ...{value: res.text}}
    });
  }


}