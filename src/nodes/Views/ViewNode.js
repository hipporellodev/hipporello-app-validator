import AbstractHippoNode from "../AbstractHippoNode";

import PageNode from "../Views/PageNode";
import HeaderNode from "../Views/HeaderNode";
import JSONUtils from "../../JSONUtils";
import SidebarNode from "./SidebarNode";

export default class ViewNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
    let envType = nodeJson.type
    let appHeaderId = nodeJson.appHeader;
    let sidebarId = nodeJson.sidebar;
    let views = JSONUtils.query(appJson, "app.views")
    if(views){
      views = Object.values(views);
      views.forEach(view=>{
        if(view?.enabled){
          if(view.type === "page"){
            if(view.viewProps.environments != null && view.viewProps.environments.indexOf(envType) >= 0){
              this.addChildNode(new PageNode(appJson, "app.views."+view.id))
            }
          }
          else if(view.id === appHeaderId){
            this.addChildNode(new HeaderNode(appJson, "app.views."+view.id))
          }
          else if(view.id === sidebarId){
            this.addChildNode(new SidebarNode(appJson, "app.views."+view.id))
          }
        }
      })
    }
  }
}
