import AbstractHippoNode from "../AbstractHippoNode";
import ComponentNode from "../ComponentNode";
import Validator from "fastest-validator";
const childSchema = {
  id: 'string',
  view: {
    type: 'object',
    optional: true,
    props: {
      'id': 'string',
      'children': 'array|optional'
    }
  }
}
const childCheck = new Validator().compile(childSchema);
export default class ChildNode extends AbstractHippoNode{
  rootNode;
  index;
  constructor(appJson, path, rootNode, index) {
    super(appJson, path);
    this.index = index;
    this.rootNode = rootNode;
  }

  process(appJson, path, nodeJson) {
    let componentId = nodeJson.id;
    this.rootNode.childNodeRegistry[componentId] = this;
    let componentPath = "app.components."+componentId;
    this.addChildNode(new ComponentNode(appJson, componentPath))
    if(nodeJson?.children) {
      nodeJson.children.forEach((childNode, index)=>{
        this.addChildNode(new ChildNode(appJson, path+".children["+index+"]", this.rootNode, index))
      })
    }
    else if(nodeJson?.view) {
      this.addChildNode(new ChildNode(appJson, path + ".view", this.rootNode, 0))
    }
    else if(nodeJson?.columns) {
      nodeJson.columns.forEach((childNode, index)=>{
        this.addChildNode(new ChildNode(appJson, path+".columns["+index+"]", this.rootNode, index))
      })
    }
  }
  getValidatorFunction() {
    let errors = [];
    const childCheckResult = childCheck(this.nodeJson);
    if (Array.isArray(childCheckResult)) {
      errors.pushArray(childCheckResult);
    }
    const childNodeId = this?.nodeJson?.id;
    if (!this.appJson?.app?.components?.[childNodeId]) {
      errors.push(this.createValidationError('oneOf', 'id', this.nodeJson.id));
    }
    return errors;
  }
}
