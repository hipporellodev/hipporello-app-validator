import AbstractHippoNode from "../AbstractHippoNode";
import PageNode from "../Views/PageNode";
import ActionGroupNode from "../ActionGroupNode";
import Validator from "fastest-validator";

const formCheck = new Validator().compile({
  id: 'string|empty:false',
  anonymous: 'boolean|optional',
  enabled: 'boolean|optional',
  formatVersion: 'number',
  icon: 'string|empty:false',
  name: 'string|empty:false',
  type: {
    type: 'enum',
    values: ['form', 'updateform']
  },
  aliases: 'array|optional',
  usesParent: 'boolean|optional',
  boardId: 'string|optional|empty:false',
  showInTrello : 'boolean|optional',
  body: {
    type: 'object',
    props: {
      formAutoIncrementId: 'number',
      readOnly: 'boolean|optional',
      rows: {
        type: 'array',
        items: {
          type: 'object',
          props: {
            id: 'string',
            columns: {
              type: 'array',
              items: {
                type: 'object',
                props: {
                  id: 'string',
                  element: {
                    type: 'object',
                    props: {
                      id: 'string'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
})
export default class FormNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }
  process(appJson, path, nodeJson) {
    let successViewObj = nodeJson.body?.successViews || {};
    let successView = Object.values(successViewObj||{})
    if(successView && successView?.[0]?.props?.type === "view" || successView?.[0]?.type === "view"){
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

  getValidatorFunction() {
    return formCheck;
  }
}
