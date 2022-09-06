import AbstractHippoNode from "../AbstractHippoNode";
import ChildrenNode from "../Views/ChildrenNode";
import Validator from "fastest-validator";
import VisibilityNode from "../AccessRights/VisibilityNode";
import CollectionNode from "../AccessRights/CollectionNode";


export default class PageNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  getValidatorFunction() {
    const isFormThankYouPage = !this.nodeJson?.viewProps?.environments?.length
    const pageCheck = new Validator().compile({
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
          children: 'array|optional',
          title: isFormThankYouPage ? "string|optional": "string"
        }
      }
    });
    const pageSlugCheck = new Validator().compile({
      viewProps: {
        type: 'object',
        props: {
          slug: 'string',
        }
      }
    });
      let errors = [];
      const pageCheckResult = pageCheck(this.nodeJson);
      if (Array.isArray(pageCheckResult)) {
        errors.pushArray(pageCheckResult);
      }
      if (this.nodeJson?.environments?.includes('webview')) {
        const slugCheckResult = pageSlugCheck(this.nodeJson);
        errors.pushArray(slugCheckResult);
      }
      if(this.nodeJson?.enabled)
        return () => errors;
      return () => []
  }

  process(appJson, path, nodeJson) {
    this.env = nodeJson.viewProps?.environments?.[0] || "webView";
    if(nodeJson?.accessRight?.dataRule?.conditions){
      this.addChildNode(new VisibilityNode(appJson, `${path}.accessRight.dataRule`))
    }
    if(nodeJson?.viewProps?.cardAware){
      this.addChildNode(new CollectionNode(appJson, `${path}.accessRight.dataRule`))
    }
    if(nodeJson?.viewProps?.children?.length){
      this.addChildNode(new ChildrenNode(appJson, path+".viewProps.children"))
    }
  }
}
