import AbstractHippoNode from "../AbstractHippoNode";
import ActionNode from "../ActionNode";

export default class ButtonActionNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
    this.shared = nodeJson.shared;
    if(nodeJson.actions && Object.keys(nodeJson.actions).length > 0){
      Object.keys(nodeJson.actions).forEach((action)=>{
        this.addChildNode(new ActionNode(appJson, "app.actionGroups."+nodeJson.id+".actions."+action));
      })
    }
  }
}
