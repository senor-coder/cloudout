import crypto from "crypto";
import os from "os";
import path from "path";
import {  TemplateTypeExtensionMap } from "./const.js";

export const tempfile = (prefix="tmp", suffix = '') => {
  const tmpdir = tmpdir ? tmpdir : os.tmpdir();
  return path.join(tmpdir, prefix + crypto.randomBytes(16).toString("hex") + suffix);
};


export const genOutputFileName = (inputFile, templateType) =>{
  const extension = TemplateTypeExtensionMap[templateType];
  return `${inputFile.substr(0, inputFile.lastIndexOf("."))}.${extension}`;
}
