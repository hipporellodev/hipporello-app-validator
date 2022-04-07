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
          value: 'any|empty:false',
          valueType: {
            type: 'enum',
            values: ["variable", "value"]
          }
        }
      }
    }
  }
}

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
    if(!this.nodeJson?.filter?.conditions && !this.nodeJson?.filter?.collections){
      return [this.createValidationError('required', 'filter', this.nodeJson?.filter, null, null, 'Collections or Conditions filter must be entered for automation action')]
    }
    return ruleCheck;
  }
}
