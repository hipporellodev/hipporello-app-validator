import AbstractHippoNode from "./AbstractHippoNode";

import EventNode from "./EventNode";
import ChildrenNode from "./Views/ChildrenNode";

export default class ComponentNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  getValidatorFunction() {
    return super.getValidatorFunction();
  }

  process(appJson, path, nodeJson) {
    this.id = nodeJson.id;
    if(nodeJson?.viewProps?.children) {
      this.addChildNode(new ChildrenNode(appJson, path+".viewProps.children"))
    }
    let events = nodeJson?.viewProps?.events;
    if(events){
      Object.entries(events).forEach((entry=>{
        this.addChildNode(new EventNode(appJson, path+".viewProps.events."+entry[0]))
      }))
    }
  }
}
