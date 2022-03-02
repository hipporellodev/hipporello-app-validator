import AbstractHippoNode from "./AbstractHippoNode";
import ActionGroupNode from "./ActionGroupNode";
import Validator from "fastest-validator";
import ActionNode from "./ActionNode";

const eventCheck = new Validator().compile({
  id: 'string'
})
export default class EventNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
    if(nodeJson.actionGroupId){
      this.addChildNode(new ActionGroupNode(appJson, "app.actionGroups."+nodeJson.actionGroupId));
    }
    else{
      if(typeof nodeJson.action === 'string'){
        this.addChildNode(new ActionGroupNode(appJson, "app.actionGroups."+nodeJson.action));
      } else {
        this.addChildNode(new ActionNode(appJson, `${this.path}.action`, true));
      }
    }
  }
  getValidatorFunction() {
    return eventCheck;
  }
}
