import AbstractHippoNode from "./AbstractHippoNode";
import ActionGroupNode from "./ActionGroupNode";

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
      }
    }
  }
}
