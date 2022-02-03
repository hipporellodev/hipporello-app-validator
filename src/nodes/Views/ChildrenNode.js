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
  getValidatorFunction() {
    if (!Array.isArray(this.nodeJson)) {
      return [
          this.createValidationError('array', null, typeof this.nodeJson)
      ]
    }
    return null;
  }
}
