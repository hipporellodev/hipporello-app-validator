import AbstractHippoNode from "../AbstractHippoNode";
import ChildrenNode from "../Views/ChildrenNode";
import Validator from "fastest-validator";
const headerScheme = {
  id: 'string',
  viewProps: {
    type: 'object',
    props: {
        login: 'boolean|optional',
        menu: 'boolean|optional',
        logo: 'boolean|optional',
    }
  }
}
const headerCheck = new Validator().compile(headerScheme);
export default class HeaderNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
    if(nodeJson?.viewProps?.children?.length){
      this.addChildNode(new ChildrenNode(appJson, path+".viewProps.children"))
    }
  }

  getValidatorFunction() {
    return headerCheck;
  }
}
