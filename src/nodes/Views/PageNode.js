import AbstractHippoNode from "../AbstractHippoNode";
import ChildrenNode from "../Views/ChildrenNode";
import Validator from "fastest-validator";
import VisibilityNode from "../AccessRights/VisibilityNode";
import CollectionNode from "../AccessRights/CollectionNode";
import {PAGE_SLUG_BLACKLIST} from "../../constants";


export default class PageNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  getValidatorFunction() {
    const isFormThankYouPage = !this.nodeJson?.viewProps?.environments?.length
    const slugs = Object.values(this.appJson?.app?.views||{})?.filter(item=>item?.id!==this?.nodeJson?.id)?.map(item => item?.viewProps?.slug)
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
    const pageSlugCheck = new Validator({useNewCustomCheckerFunction: true}).compile({
      viewProps: {
        type: 'object',
        props: {
          slug: {
            type: "custom",
            check:  (value, errors, schema) => {
              if(PAGE_SLUG_BLACKLIST.includes(value)){
                errors.push({type: "notOneOf", label: "Page Slug", expected: PAGE_SLUG_BLACKLIST})
              }
              else if(slugs.includes(value)){
                errors.push({type: "unique", message: "Page slug must be unique"})
              }
              return value;
            }
          }
        }
      }
    });
      let errors = [];
      const pageCheckResult = pageCheck(this.nodeJson);
      if (Array.isArray(pageCheckResult)) {
        errors.pushArray(pageCheckResult);
      }
      if (this.nodeJson?.viewProps?.environments?.some(env => ["webView", "trelloBoardView"].includes(env))) {
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
    if(nodeJson?.viewProps?.cardAware && nodeJson?.viewProps?.environments?.length){
      this.addChildNode(new CollectionNode(appJson, `${path}.accessRight.dataRule`))
    }
    if(nodeJson?.viewProps?.children?.length){
      this.addChildNode(new ChildrenNode(appJson, path+".viewProps.children"))
    }
  }
}
