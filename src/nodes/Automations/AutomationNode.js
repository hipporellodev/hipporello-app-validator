import AbstractHippoNode from "../AbstractHippoNode";

import RuleNode from "./RuleNode";

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
}
