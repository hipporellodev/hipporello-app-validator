import AbstractHippoNode from "../AbstractHippoNode";
import ChildrenNode from "../Views/ChildrenNode";
import Validator from "fastest-validator";
const pageSchema = {
  enabled: 'boolean',
  id: 'string',
  viewProps: {
    type: 'object',
    props: {
      name: 'string',
      align: {
        type: 'enum',
        values: ['left', 'center', 'right'],
        optional: true
      },
      cardAware: 'boolean|optional',
      children: 'array|optional'
    }
  }
}
const pageSlugSchema = {
  viewProps: {
    type: 'object',
    props: {
      slug: 'string',
    }
  }
}
const pageCheck = new Validator().compile(pageSchema);
const pageSlugCheck = new Validator().compile(pageSlugSchema);
export default class PageNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  getValidatorFunction() {
      let errors = [];
      const pageCheckResult = pageCheck(this.nodeJson);
      if (Array.isArray(pageCheckResult)) {
        errors.pushArray(pageCheckResult);
      }
      if (this.nodeJson?.environments?.includes('webview')) {
        const slugCheckResult = pageSlugCheck(this.nodeJson);
        errors.pushArray(slugCheckResult);
      }
      return () => errors;
  }

  process(appJson, path, nodeJson) {
    this.env = nodeJson.viewProps?.environments?.[0] || "webView";
    this.addChildNode(new ChildrenNode(appJson, path+".viewProps.children"))
  }
}
