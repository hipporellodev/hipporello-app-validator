import AbstractHippoNode from "./AbstractHippoNode";
import ActionNode from "./ActionNode";
import Validator from "fastest-validator";
const schema = {
  id: {
    type: 'string'
  },
  shared: {
    type: 'boolean', optional:true
  },
  title: {
    type: 'string', optional:true
  },
  name: {
    type: 'string', optional:true
  }
}
const check = new Validator().compile(schema);
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
    return check;
  }
}
