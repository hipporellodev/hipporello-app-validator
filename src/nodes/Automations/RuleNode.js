import AbstractHippoNode from "../AbstractHippoNode";
import EventNode from "../EventNode";
import Validator from "fastest-validator";

const ruleCheck = new Validator().compile({
  id: 'string',
  order: 'number',
  trigger: {
    type: 'object',
    props: {
      type: {
        type: 'enum',
        values: ["card-created", "moved", "commented", "archived",]
      }
    }
  },

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
    return ruleCheck;
  }
}
