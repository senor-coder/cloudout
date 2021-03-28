import { expect } from "chai";
import path from "path";
import { CloudoutParser } from "../lib/parser.js";
import { CloudformationService } from "../lib/services/cloudformation.js";
import { ParameterStoreService } from "../lib/services/parameterstore.js";
import { PlainTextService } from "../lib/services/plaintext.js";

const testResource = {
  Foo: {
    BucketName: "$cf:some-stack:x",
    BucketDomainName: "$cf:some-other-stack:y",
    Bar: "$cf:some-stack:z",
  },
};

const serviceMap = {
  [CloudformationService.SERVICE_KEY]: new CloudformationService("us-east-1", false),
  [ParameterStoreService.SERVICE_KEY]: new ParameterStoreService("us-east-1", false),
  [PlainTextService.SERVICE_KEY]: new PlainTextService(),
};

describe("Test Cloudout Parser", () => {
  const parser = new CloudoutParser(serviceMap, testResource);

  it("test getResources", () => {
    const actualValue = parser.getResources(CloudformationService.SERVICE_KEY);
    const expectedValue = [
      {
        sectionName: "Foo",
        referenceName: "BucketName",
        referenceValue: "$cf:some-stack:x",
        serviceName: "$cf",
        context: { stackName: "some-stack", outputKey: "x" },
      },
      {
        sectionName: "Foo",
        referenceName: "BucketDomainName",
        referenceValue: "$cf:some-other-stack:y",
        serviceName: "$cf",
        context: { stackName: "some-other-stack", outputKey: "y" },
      },
      {
        sectionName: "Foo",
        referenceName: "Bar",
        referenceValue: "$cf:some-stack:z",
        serviceName: "$cf",
        context: { stackName: "some-stack", outputKey: "z" },
      },
    ];
    expect(actualValue).to.deep.equal(expectedValue);
  });
});

describe("Test getResources From File", () => {
  const parser = CloudoutParser.from(serviceMap, path.join("test", "res", "resource.yml"), { env: "prod" });
  it("test getResources", () => {
    const actualValue = parser.getResources(CloudformationService.SERVICE_KEY);

    const expectedValue = [
      {
        sectionName: "Buckets",
        referenceName: "BucketName",
        referenceValue: "$cf:teststack:BucketName",
        serviceName: "$cf",
        context: { stackName: "teststack", outputKey: "BucketName" },
      },
      {
        sectionName: "Buckets",
        referenceName: "BucketDomainName",
        referenceValue: "$cf:teststack:BucketDomainName",
        serviceName: "$cf",
        context: { stackName: "teststack", outputKey: "BucketDomainName" },
      },
      {
        sectionName: "Workgroups",
        referenceName: "importFilters",
        referenceValue: "$cf:teststack:fooWorkgroup",
        serviceName: "$cf",
        context: { stackName: "teststack", outputKey: "fooWorkgroup" },
      },
      {
        sectionName: "Workgroups",
        referenceName: "metrics",
        referenceValue: "$cf:teststack:barWorkgroup",
        serviceName: "$cf",
        context: { stackName: "teststack", outputKey: "barWorkgroup" },
      },
      {
        sectionName: "SQS",
        referenceName: "scheduler",
        referenceValue: "$cf:teststack:metricsScheduler",
        serviceName: "$cf",
        context: { stackName: "teststack", outputKey: "metricsScheduler" },
      },
    ];
    expect(actualValue).to.deep.equal(expectedValue);
  });
});

describe("Test Cloudout parsing for SSM", () => {
  const parser = new CloudoutParser(serviceMap, testResource);

  it("test parseSectionRes for SSM", () => {
    const actualValue = parser._parseSectionRes({
      referenceName: "fooResource",
      referenceValue: "$ssm:bar/something",
      sectionName: "foo",
    });


    const expectedValue = {
      sectionName: 'foo',
      referenceName: 'fooResource',
      referenceValue: '$ssm:bar/something',
      serviceName: '$ssm',
      context: { parameterName: 'bar/something', decrypt: false }
    };
    expect(actualValue).to.deep.equal(expectedValue);
  });

  it("test parseSectionRes for SSM with decryption", () => {
    const actualValue = parser._parseSectionRes({
      referenceName: "fooResource",
      referenceValue: "$ssm:bar/something:true",
      sectionName: "foo",
    });

    const expectedValue = {
      sectionName: 'foo',
      referenceName: 'fooResource',
      referenceValue: '$ssm:bar/something:true',
      serviceName: '$ssm',
      context: { parameterName: 'bar/something', decrypt: true }
    };
    expect(actualValue).to.deep.equal(expectedValue);
  });
});
