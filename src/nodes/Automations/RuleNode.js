import AbstractHippoNode from "../AbstractHippoNode";
import EventNode from "../EventNode";
import Validator from "fastest-validator";
import {conditionsWithOr} from "../../Utils/conditionWithOr";
import {conditionsWithAnd} from "../../Utils/conditionsWithAnd";

export default class RuleNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
    let events = nodeJson?.events;
    if(events){
      let eventsPath = path+".events";
      Object.entries(events).forEach((entry=>{
        this.addChildNode(new EventNode(appJson, eventsPath+"."+entry[0]))
      }))
    }
  }

  getValidatorFunction() {
    let errors = []
    const ruleCheck = new Validator().compile({
      id: 'string',
      order: 'number',
      enabled: 'boolean|optional',
      filter: {
        type: 'object',
        optional: true,
        props: this.getCollectionValidateJson()
      }
    })
    errors.pushArray(ruleCheck(this.nodeJson));
    // if(!this.nodeJson?.filter?.conditions && !this.nodeJson?.filter?.collections){
    //   errors.push(this.createValidationError('required', 'filter', this.nodeJson?.filter, null, null, 'Collections or Conditions filter must be entered for automation action'))
    // }
    if(this.nodeJson?.filter?.conditions?.length > 1){//Or Condition
      errors.pushArray(conditionsWithOr(this.appJson, this.entities)(this.nodeJson?.filter))
    }
    else if(this.nodeJson?.filter?.conditions?.length){
      errors.pushArray(conditionsWithAnd(this.appJson, this.entities)(this.nodeJson?.filter))
    }
    return errors;
  }
}
