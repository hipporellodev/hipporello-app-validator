import AbstractHippoNode from "../AbstractHippoNode";
import ChildrenNode from "../Views/ChildrenNode";
import Validator from "fastest-validator";
const sidebarScheme = {
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
const sidebarCheck = new Validator().compile(sidebarScheme);
export default class SidebarNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
    if(nodeJson?.viewProps?.children?.length){
      this.addChildNode(new ChildrenNode(appJson, path+".viewProps.children"))
    }
  }

  getValidatorFunction() {
    return sidebarCheck;
  }
}
