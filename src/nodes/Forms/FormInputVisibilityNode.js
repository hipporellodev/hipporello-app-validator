import AbstractHippoNode from "../AbstractHippoNode";
import {formConditionsWithAnd} from "../../Utils/formConditionWithAnd";
import VisibilityRuleNode from "./VisibilityRuleNode";

export default class FormInputVisibilityNode extends AbstractHippoNode{
 process(appJson, path, nodeJson) {
   if (nodeJson?.rules?.length) {
     nodeJson.rules.map((i, index) => {
       this.addChildNode(new VisibilityRuleNode(appJson, `${this.path}.rules.${index}`))
     })
   }
 }

  getValidatorFunction() {
    const errors = [];
    errors.pushArray(formConditionsWithAnd(this?.nodeJson))
    return errors
  }
}