import { CloudoutClient } from "../lib/cloudout.js";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import { SSMClient } from "@aws-sdk/client-ssm";
import sinon from "sinon";
import path from "path";
import { expect } from "chai";
import fs from "fs";

describe("Test CloudoutClient", () => {
  sinon.stub(CloudFormationClient.prototype, "send").callsFake((x) => ({
    Stacks: [
      {
        StackName: "teststack",
        Outputs: [
          { OutputKey: "BucketName", OutputValue: "teststack-bucket-name-0998" },
          { OutputKey: "BucketDomainName", OutputValue: "some.domain.name.com" },
          { OutputKey: "fooWorkgroup", OutputValue: "testStackFooWorkgroup" },
          { OutputKey: "barWorkgroup", OutputValue: "testStackBarWorkgroup" },
          { OutputKey: "metricsScheduler", OutputValue: "testStackMetricsScheduler" },
        ],
      },
    ],
  }));

  sinon.stub(SSMClient.prototype, "send").callsFake((x) => ({
    Parameters: [
      {
        Name: "/path/to/my/param",
        Value: "myParamValue",
      },
    ],
    InvalidParameters: [],
  }));

  const cloudoutClient = CloudoutClient.getDefaultClient("us-east-1", false);


  it("Generate output", async () => {
    const actualOutput = await cloudoutClient.generateOutput(path.join("test", "res", "resource.yml"), "python");
    const expectedOutput = fs.readFileSync(new URL(`./res/expected_resource.py`, import.meta.url), {
      encoding: "utf8",
      flag: "r",
    });
    expect(actualOutput).to.be.equals(expectedOutput);
  });


  it("Shows diff", async ()=>{
    const inputFilePath = path.join("test", "res", "resource_test_diff.yml");
    const existingOutputFilePath = path.join("test", "res", "resource_test_diff.py");
    const actualDiff = await cloudoutClient.getDiff(inputFilePath, "python", {}, existingOutputFilePath);

    const expectedDiff = [
      {
        count: 2,
        value: "class Buckets(str):\nBucketName = 'teststack-bucket-name-0998'\n"
      },
      {
        count: 1,
        added: undefined,
        removed: true,
        value: "BucketDomainName = 'some.previousdomain.name.com'\n"
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: "BucketDomainName = 'some.domain.name.com'\n"
      },
      { count: 3, value: '\n\nclass Workgroups(str):\n' },
      {
        count: 1,
        added: undefined,
        removed: true,
        value: "metrics = 'testStackBarWorkgroup'\n"
      },
      {
        count: 1,
        added: true,
        removed: undefined,
        value: "importFilters = 'testStackFooWorkgroup'\n"
      },
      { count: 2, value: '\n\n' },
      { count: 1, added: undefined, removed: true, value: '\n' }
    ]
    expect(actualDiff).to.be.deep.equals(expectedDiff)
  })
});
