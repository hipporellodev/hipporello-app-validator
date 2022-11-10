import AbstractHippoNode from "../AbstractHippoNode";
import {conditionsWithOr} from "../../Utils/conditionWithOr";
import {conditionsWithAnd} from "../../Utils/conditionsWithAnd";
import ConditionNode from "./ConditionNode";



export default class VisibilityNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);

  }
  process(appJson, path, nodeJson) {
    nodeJson?.conditions?.forEach((conditions, index) => {
      conditions?.forEach((condition, cIndex) => {
        this.addChildNode(new ConditionNode(appJson, `${path}.conditions.${index}.${cIndex}`))
      })
    })
  }
  getValidatorFunction() {
    const errors = [];
    if(this?.nodeJson?.conditions?.length > 1){
      errors.pushArray(conditionsWithOr(this?.nodeJson))
    }
    else if(this?.nodeJson?.conditions?.length){
      errors.pushArray(conditionsWithAnd(this?.nodeJson))
    }
    return errors
  }
}