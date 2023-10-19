import AbstractHippoNode from "../AbstractHippoNode";
import getValidator from "../../Utils/getValidator";

const roleSchema = {
  id: 'string',
  name: 'string'
}
const roleCheck = getValidator().compile(roleSchema);
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
