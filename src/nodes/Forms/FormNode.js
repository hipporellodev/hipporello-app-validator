import AbstractHippoNode from "../AbstractHippoNode";
import PageNode from "../Views/PageNode";
import ActionGroupNode from "../ActionGroupNode";

export default class FormNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }
  process(appJson, path, nodeJson) {
    let successViewObj = nodeJson.body?.successViews;
    let successView = Object.values(successViewObj)
    if(successView?.[0].props?.type === "view" || successView?.[0]?.type === "view"){
      const pageId = successView?.[0]?.props?.view?.id;
      this.addChildNode(new PageNode(appJson, "app.views."+pageId))
    }
    nodeJson?.body?.rows.forEach((row, rowIndex) =>{
      if(row?.columns?.length){
        row?.columns.forEach((column, colIndex) =>{
          if(column?.element?.props?.['optional-actionGroupId']){
            const actionGroupId = column?.element?.props?.['optional-actionGroupId'];
            this.addChildNode(new ActionGroupNode(appJson, "app.actionGroups."+actionGroupId));
          }
        })
      }
    })
  }
}
