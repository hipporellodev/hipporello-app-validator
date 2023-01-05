import AbstractHippoNode from "../AbstractHippoNode";

import RuleNode from "./RuleNode";
import Validator from "fastest-validator";


export default class AutomationNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, automation) {
    const rules = Object.values(automation?.rules||{});
    if(rules?.length && automation?.enabled){
      rules.forEach(rule=>{
        this.addChildNode(new RuleNode(
          appJson,
          `app.automations.${automation?.id}.rules.${rule?.id}`
        ))
      })
    }
  }

  getValidatorFunction() {
    const allListOptions = this.getTrelloList(true)
    const trelloListEnum = {
      type: "enum",
      values: allListOptions,
      optional: true
    }
    const trelloListEnumArray = {
      type: "array",
      items: {
        type: "enum",
        values: allListOptions,
      },
      optional: true
    }
    let triggerSchema = {
      type: {
        type: 'enum',
        values: ['card-created', 'moved', 'commented', 'archived']
      },
    }
    switch (this.nodeJson?.trigger?.type){
      case "card-created": triggerSchema.lists = trelloListEnumArray;break;
      case "moved": triggerSchema.fromList = trelloListEnum;triggerSchema.toList = trelloListEnum;break;
      case "commented": triggerSchema.list = trelloListEnum;break;
      default: break;
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
    const errors = [];
    errors.pushArray(automationCheck(this.nodeJson));
    if(!this.nodeJson?.enabled)
      return []
    else
      return errors;
  }
}
