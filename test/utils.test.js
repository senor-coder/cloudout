import { expect} from 'chai';
import { genOutputFileName } from '../lib/utils.js';


describe("Test genOutputFileName", () => {

  it("test outoutFilename", () => {
    const outFile = genOutputFileName('/foo/bar.yml', 'py');
    expect(outFile).to.equal('/foo/bar.py')
  });
});
