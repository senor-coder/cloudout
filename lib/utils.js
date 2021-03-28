import crypto from "crypto";
import os from "os";
import path from "path";

export const tempfile = (prefix="tmp", suffix = '') => {
  const tmpdir = tmpdir ? tmpdir : os.tmpdir();
  return path.join(tmpdir, prefix + crypto.randomBytes(16).toString("hex") + suffix);
};


export const genOutputFileName = (inputFile, extension) =>{
  return `${inputFile.substr(0, inputFile.lastIndexOf("."))}.${extension}`;
}
