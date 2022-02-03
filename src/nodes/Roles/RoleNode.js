import AbstractHippoNode from "../AbstractHippoNode";
import Validator from "fastest-validator";

const roleSchema = {
  id: 'string',
  name: 'string'
}
const roleCheck = new Validator().compile(roleSchema);
export default class RoleNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
  }

  getValidatorFunction() {
    return roleCheck;
  }
}
