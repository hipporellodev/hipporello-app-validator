import AbstractHippoNode from "./AbstractHippoNode";
import Validator from "fastest-validator";
const schema = {
  type: { type: "enum", values: ["_self", "_blank", "_modal"] }
}
const check = new Validator().compile(schema);
export default class ActionNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
    this.formId = nodeJson.props?.formId
  }

  getValidatorFunction() {
    if(this.nodeJson.type === "open-page"){
      return (data)=>{
        return check(data.props.target)
      }
    }
    return (data)=>{
      return [];
    };
  }
}
