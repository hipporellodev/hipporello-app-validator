import AbstractHippoNode from "../AbstractHippoNode";
import PageNode from "../Views/PageNode";
import Validator from "fastest-validator";
import FormInputNode from "./FormInputNode";
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
          this.addChildNode(new FormInputNode(appJson, `${this.path}.body.rows.${rowIndex}.columns.${colIndex}.element`, column?.element?.id))
          // if(column?.element?.input === "Button"){
          //   this.addChildNode(new FormButtonNode(appJson, `${this.path}.body.rows.${rowIndex}.columns.${colIndex}.element`, nodeJson?.type))
          // }
          // else{
          //
          // }
        })
      }
    })
  }

  getValidatorFunction() {
    const hippoFieldIds = Object.keys(this.appJson?.app?.fieldDefinitions?.hippoFields||{})
    const cardCollectionsIds = Object.keys(this.appJson?.app?.cardCollections||{})
    const elementIds = this.childNodes?.reduce((a, i)=> {
      if(!i.nodeJson?.props?.schema?.type) return a
      a[i?.id] = {
        type: "enum",
        values: hippoFieldIds
      }
      return a;
    }, {});
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
      slug: 'string',
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
          },
          hippoFieldMapping: (Object?.keys(elementIds))?.length ? {
            type: "object",
            props: elementIds
          } : {
            type: "object",
            optional: true
          }
        }
      },
      accessRight: {
        type: "object",
        props: {
          dataRule: {
            type: "object",
            props: {
              collections: {
                type: "array",
                items: {
                  type: "enum",
                  values: cardCollectionsIds
                },
                optional: this.nodeJson.type === "form" && !this.nodeJson.usesParent
              },
              includeArchived: {
                type: "enum",
                values: ["all","archived","notarchived"],
                optional: this.nodeJson.type === "form" && !this.nodeJson.usesParent
              }
            },
            optional: this.nodeJson.type === "form" && !this.nodeJson.usesParent
          },
          roleRules: {
            type: "array",
            items:{
              type: "object",
              props:{
                type: "string",
                roles: "array"
              }
            },
            optional: true
          }
        },
        optional: true
      }
    })
    return formCheck;
  }
}
