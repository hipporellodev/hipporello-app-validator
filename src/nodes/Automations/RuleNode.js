import AbstractHippoNode from "../AbstractHippoNode";
import EventNode from "../EventNode";
import Validator from "fastest-validator";

export const ruleConditionSchema = {
  collections:{
    type: 'array',
    optional: true,
    items: {
      type: 'string'
    }
  },
  includeArchived:{
    type: 'enum',
    optional: true,
    values: ['all', "archived", "notarchived"]
  },
}
function conditionValueCheckFunc(value, errors, schema, path, parentNode){
  if(!["empty", "notempty"].includes(parentNode?.operator)){
    if(value === "[[[nullValue]]]" && parentNode?.valueType === "value"){
      errors.push({type: "required"})
    }
  }
  return value
}
const conditionsWithAnd = new Validator({useNewCustomCheckerFunction: true}).compile({
  conditions: {
    type: 'array',
    optional: true,
    items: {
      type: 'array',
      items: {
        type: 'object',
        props: {
          field: 'string|empty:false',
          operator: {
            type: 'enum',
            values: [
              "equals",
              "notequals",
              "contains",
              "notcontains",
              "startswith",
              "notstartswith",
              "endswith",
              "notendswith",
              "lessthan",
              "lessthanequals",
              "greaterthan",
              "greaterthanequals",
              "in",
              "allin",
              "anyin",
              "notin",
              "empty",
              "notempty",
              "has",
              "doesnthave",
            ]
          },
          value: {
            type: "custom",
            nullable: true,
            default: "[[[nullValue]]]",
            check: conditionValueCheckFunc
          },
          valueType: {
            type: 'enum',
            values: ["variable", "value"]
          }
        }
      }
    }
  }
})
const conditionsWithOr = new Validator({useNewCustomCheckerFunction: true}).compile({
  conditions: {
    type: 'array',
    optional: true,
    items: {
      type: 'array',
      props: {
        field: 'string|empty:false',
        operator: {
          type: 'enum',
          values: [
            "equals",
            "notequals",
            "contains",
            "notcontains",
            "startswith",
            "notstartswith",
            "endswith",
            "notendswith",
            "lessthan",
            "lessthanequals",
            "greaterthan",
            "greaterthanequals",
            "in",
            "allin",
            "anyin",
            "notin",
            "empty",
            "notempty",
            "has",
            "doesnthave",
          ]
        },
        value: {
          type: 'custom',
          nullable: true,
          default: "[[[nullValue]]]",
          check: conditionValueCheckFunc
        },
        valueType: {
          type: 'enum',
          values: ["variable", "value"]
        }
      }
    }
  }
})
const ruleCheck = new Validator().compile({
  id: 'string',
  order: 'number',
  enabled: 'boolean|optional',
  filter: {
    type: 'object',
    optional: true,
    props: {
      ...ruleConditionSchema
    }
  }
})
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
    errors.pushArray(ruleCheck(this.nodeJson));
    // if(!this.nodeJson?.filter?.conditions && !this.nodeJson?.filter?.collections){
    //   errors.push(this.createValidationError('required', 'filter', this.nodeJson?.filter, null, null, 'Collections or Conditions filter must be entered for automation action'))
    // }
    if(this.nodeJson?.filter?.conditions?.length > 1){//Or Condition
      errors.pushArray(conditionsWithOr(this.nodeJson?.filter))
    }
    else if(this.nodeJson?.filter?.conditions?.length){
      errors.pushArray(conditionsWithAnd(this.nodeJson?.filter))
    }
    return errors;
  }
}
