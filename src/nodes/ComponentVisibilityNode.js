import AbstractHippoNode from "./AbstractHippoNode";
import {conditionsWithOr} from "../Utils/conditionWithOr";
import {conditionsWithAnd} from "../Utils/conditionsWithAnd";



export default class ComponentVisibilityNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }
  process(appJson, path, nodeJson) {
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