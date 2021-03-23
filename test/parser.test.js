import { expect } from "chai";
import path from "path";
import { Services } from "../lib/const.js";
import { CloudoutParser } from "../lib/parser.js";

const testResource = {
  Foo: {
    BucketName: "$cf:some-stack:x",
    BucketDomainName: "$cf:some-other-stack:y",
    Bar: "$cf:some-stack:z",
  },
};

describe("Test Cloudout Parser", () => {
  const parser = new CloudoutParser(testResource);

  it("test getResources", () => {
    const actualValue = parser.getResources(Services.cloudformation);
    const expectedValue = [
      {
        stackName: 'some-stack',
        outputKey: 'x',
        serviceName: '$cf',
        referenceName: 'BucketName',
        sectionName: 'Foo'
      },
      {
        stackName: 'some-other-stack',
        outputKey: 'y',
        serviceName: '$cf',
        referenceName: 'BucketDomainName',
        sectionName: 'Foo'
      },
      {
        stackName: 'some-stack',
        outputKey: 'z',
        serviceName: '$cf',
        referenceName: 'Bar',
        sectionName: 'Foo'
      }
    ];
    expect(actualValue).to.deep.equal(expectedValue);
  });
});

describe("Test getResources From File", () => {
  const parser = CloudoutParser.from(path.join('test','res','resource.yml'), { env: "prod" });

  it("test getResources", () => {
    const actualValue = parser.getResources(Services.cloudformation);

    const expectedValue =[
      {
        stackName: 'teststack',
        outputKey: 'BucketName',
        serviceName: '$cf',
        referenceName: 'BucketName',
        sectionName: 'Buckets'
      },
      {
        stackName: 'teststack',
        outputKey: 'BucketDomainName',
        serviceName: '$cf',
        referenceName: 'BucketDomainName',
        sectionName: 'Buckets'
      },
      {
        stackName: 'teststack',
        outputKey: 'fooWorkgroup',
        serviceName: '$cf',
        referenceName: 'importFilters',
        sectionName: 'Workgroups'
      },
      {
        stackName: 'teststack',
        outputKey: 'barWorkgroup',
        serviceName: '$cf',
        referenceName: 'metrics',
        sectionName: 'Workgroups'
      },
      {
        stackName: 'teststack',
        outputKey: 'metricsScheduler',
        serviceName: '$cf',
        referenceName: 'scheduler',
        sectionName: 'SQS'
      }
    ]
    expect(actualValue).to.deep.equal(expectedValue);
  });
});

describe("Test Cloudout parsing for SSM", () => {
  it("test parseSectionRes for SSM", () => {
    const actualValue = CloudoutParser._parseSectionRes({
      serviceName: "$ssm",
      referenceName: "fooResource",
      value: "$ssm:bar/something",
      section: "foo",
    });

    const expectedValue = {
      parameterName: 'bar/something',
      decrypt: false,
      serviceName: '$ssm',
      referenceName: 'fooResource',
      sectionName: undefined
    };
    expect(actualValue).to.deep.equal(expectedValue);
  });

  it("test parseSectionRes for SSM with decryption", () => {
    const actualValue = CloudoutParser._parseSectionRes({
      serviceName: "ssm",
      referenceName: "fooResource",
      value: "$ssm:bar/something:true",
      section: "foo",
    });

    const expectedValue = {
      parameterName: 'bar/something',
      decrypt: true,
      serviceName: '$ssm',
      referenceName: 'fooResource',
      sectionName: undefined
    };
    expect(actualValue).to.deep.equal(expectedValue);
  });
});
