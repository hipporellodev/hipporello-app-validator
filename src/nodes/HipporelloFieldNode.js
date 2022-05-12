import AbstractHippoNode from "./AbstractHippoNode";
import Validator from "fastest-validator";

const hippoFieldCheck = new Validator().compile({
  id: 'string|empty:false',
  label: 'string|empty:false',
  multiple: 'boolean',
  type: {
    type: 'enum',
    values: ["string", "double", "long", "boolean", "attachment", "date", "datetime", "time"]
  }
})
export default class HipporelloFieldNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {

  }

  getValidatorFunction() {
    return hippoFieldCheck;
  }
}
