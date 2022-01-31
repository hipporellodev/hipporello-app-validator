import AbstractHippoNode from "../AbstractHippoNode";
import ChildrenNode from "../Views/ChildrenNode";

export default class PageNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
    this.env = nodeJson.viewProps?.environments?.[0] || "webView";
    this.addChildNode(new ChildrenNode(appJson, path+".viewProps.children"))
  }
}
