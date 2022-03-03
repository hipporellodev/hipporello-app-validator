import AbstractHippoNode from "../AbstractHippoNode";

import RuleNode from "./RuleNode";
import Validator from "fastest-validator";

export const triggerSchema = {
  type: {
    type: 'enum',
    values: ['card-created', 'moved', 'commented', 'archived']
  }
}

const automationCheck = new Validator().compile({
  id: 'string|empty:false',
  name: 'string|empty:false',
  order: 'number',
  trigger: {
    type: 'object',
    props: {
      ...triggerSchema
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

  getValidatorFunction() {
    const errors = [];
    errors.pushArray(automationCheck(this.nodeJson));
    return errors;
  }
}
