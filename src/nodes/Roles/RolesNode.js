import AbstractHippoNode from "../AbstractHippoNode";

import RoleNode from "../Roles/RoleNode";
import JSONUtils from "../../JSONUtils";

export default class RolesNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
    let roles = JSONUtils.query(appJson, "app.roles");
    if(roles){
      roles = Object.values(roles)
      roles.forEach(role=>{
        this.addChildNode(new RoleNode(appJson, "app.roles."+role.id))
      })
    }
  }
}
