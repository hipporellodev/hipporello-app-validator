import AbstractHippoNode from "../AbstractHippoNode";
import ChildrenNode from "../Views/ChildrenNode";

export default class HeaderNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
    this.addChildNode(new ChildrenNode(appJson, path+".viewProps.children"))
  }
}
