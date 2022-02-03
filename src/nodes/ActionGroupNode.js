import AbstractHippoNode from "./AbstractHippoNode";
import ActionNode from "./ActionNode";
import Validator from "fastest-validator";
const schema = {
  id: {
    type: 'string'
  },
  shared: {
    type: 'boolean'
  },
  title: {
    type: 'string', optional:true
  },
  name: {
    type: 'string', optional:true
  }
}
const check = new Validator().compile(schema);
const nameSchema = {
  name: 'string|min:1'
}
const nameCheck = new Validator().compile(nameSchema);
export default class ActionGroupNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
    this.shared = nodeJson.shared;
    if(nodeJson.actions && Object.keys(nodeJson.actions).length > 0){
      Object.keys(nodeJson.actions).forEach((action)=>{
        this.addChildNode(new ActionNode(appJson, `app.actionGroups.${nodeJson.id}.actions.${action}`));
      })
    }
  }

  getValidatorFunction() {
    const errors = [];
    const checkResult = check(this.nodeJson);
    if (Array.isArray(checkResult)) {
      errors.pushArray(checkResult);
    }
    if (this.nodeJson.shared) {
      const result = nameCheck(this.nodeJson);
      if (Array.isArray(result)) {
        errors.pushArray(result);
      }
    }
    return errors;
  }
}
