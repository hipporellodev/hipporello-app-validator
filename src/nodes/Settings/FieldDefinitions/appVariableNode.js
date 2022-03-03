import AbstractHippoNode from "../../AbstractHippoNode";
import Validator from "fastest-validator";
const appVariableSchema = {
  id: 'string',
  label: 'string',
  multiple: 'boolean',
  type : {
    type: 'enum',
    values: ["string", "double", "long", "boolean", "attachment", "date", "time"]
  }
}
const appVariableCheck = new Validator().compile(appVariableSchema)
export default class AppVariableNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
  }

  getValidatorFunction() {
    return appVariableCheck;
  }
}
