import { expect} from 'chai';
import { genOutputFileName } from '../lib/utils.js';
import { TemplateType } from '../lib/const.js';


describe("Test genOutputFileName", () => {

  it("test outoutFilename", () => {
    const outFile = genOutputFileName('/foo/bar.yml', TemplateType.python);
    expect(outFile).to.equal('/foo/bar.py')
  });
});
