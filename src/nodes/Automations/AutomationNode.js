import AbstractHippoNode from "../AbstractHippoNode";

import RuleNode from "./RuleNode";
import Validator from "fastest-validator";

export const actionConditionSchema = {
  conditions: {
    type: 'array',
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
const automationCheck = new Validator().compile({
  id: 'string|empty:false',
  name: 'string|empty:false',
  order: 'number',
  matching: {
    type: 'object',
    props: {
      ...actionConditionSchema,
      type: {
        type: 'enum',
        values: ['basic']
      }
    }
  }
});

export default class AutomationNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, automation) {
    const rules = Object.values(automation?.rules||{});
    if(rules?.length){
      rules.forEach(rule=>{
        this.addChildNode(new RuleNode(
          appJson,
          `app.automations.${automation?.id}.rules.${rule?.id}`
        ))
      })
    }
  }

/*  getValidatorFunction() {
    const errors = [];
    errors.pushArray(automationCheck(this.nodeJson));
    return errors;
  }*/
}
