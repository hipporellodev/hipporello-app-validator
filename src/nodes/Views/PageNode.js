import AbstractHippoNode from "../AbstractHippoNode";
import ChildrenNode from "../Views/ChildrenNode";
import Validator from "fastest-validator";
const schema = {
  enabled: 'boolean',
  viewProps: {
    type: 'object',
    props: {
      name: 'string',
      cardAware: 'boolean|optional',
      gap: 'number|optional',
      gap1: 'number|optional',
      gap2: 'number|optional',
      gap3: 'number|optional',
      gap4: 'number|optional',
      gap5: 'number|optional',
      gap6: 'number|optional',
      gap7: 'number|optional',
      gap8: 'number|optional',
      gap9: 'number|optional',
      gap10: 'number|optional',
      gap11: 'number|optional',
      gap12: 'number|optional',
      gap13: 'number|optional',
      gap14: 'number|optional',
      gap15: 'number|optional',
      gap16: 'number|optional',
    },
  }
}
const slugSchema = {
  enabled: 'boolean',
  viewProps: {
    type: 'object',
    props: {
      slug: 'string',
    },
  }
}
const check = new Validator().compile(schema);
const slugSchemaCheck = new Validator().compile(slugSchema);
export default class PageNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  getValidatorFunction() {
    return (data)=> {
      let webViewExists = this.nodeJson.viewProps?.environments?.indexOf("webView") >= 0
      let errors = [];
      if (webViewExists) {
        slugSchemaCheck(data)
      }
      check(data)
      return errors;
    }
  }

  process(appJson, path, nodeJson) {
    this.env = nodeJson.viewProps?.environments?.[0] || "webView";
    this.addChildNode(new ChildrenNode(appJson, path+".viewProps.children"))
  }
}
