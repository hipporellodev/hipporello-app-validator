import AbstractHippoNode from "../AbstractHippoNode";
import ChildNode from "../Views/ChildNode";

export default class ChildrenNode extends AbstractHippoNode{
  childNodeRegistry = {};
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
    nodeJson.forEach((childNode, index)=>{
      this.addChildNode(new ChildNode(appJson, path+"["+index+"]", this, index))
    })
  }
}
