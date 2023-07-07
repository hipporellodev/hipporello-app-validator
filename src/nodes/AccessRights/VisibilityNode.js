import AbstractHippoNode from "../AbstractHippoNode";
import {conditionsWithOr} from "../../Utils/conditionWithOr";
import {conditionsWithAnd} from "../../Utils/conditionsWithAnd";



export default class VisibilityNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }
  process(appJson, path, nodeJson) {
  }
  getValidatorFunction() {
    const errors = [];
    if(this?.nodeJson?.conditions?.length > 1){
      errors.pushArray(conditionsWithOr(this.appJson, this.entities)(this?.nodeJson))
    }
    else if(this?.nodeJson?.conditions?.length){
      errors.pushArray(conditionsWithAnd(this.appJson, this.entities)(this?.nodeJson))
    }
    return errors
  }
}