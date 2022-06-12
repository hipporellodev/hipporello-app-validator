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
    const slugs = Object.values(this.appJson?.app?.integrations?.incoming||{})?.filter(item=>item?.id!==this?.nodeJson?.id)?.map(item => item?.slug)
    function uniqueCheck(value, errors, schema, path, parentNode){
      if(slugs.includes(value)){
        errors.push({type: "unique", message: "Form slug must be unique"})
      }
      return value
    }
    const buttonsEl = this.childNodes?.find((a) => a.nodeJson?.input === "Button")?.nodeJson
    const elementIds = this.childNodes?.reduce((a, i)=> {
      if(!i.nodeJson?.props?.schema?.type || i.nodeJson?.props?.name === "Captcha") return a
      a[i?.id] = {
        type: "enum",
        values: hippoFieldIds
      }
      return a;
    }, {});
    let objectValidation = null;
    if(this.nodeJson?.body?.successViews?.[buttonsEl?.id]?.type === "page"){
      objectValidation = {
        page: {
          type: "object",
          props: {
            url: "url",
            target: {
              type: "enum",
              optional: true,
              values: ["_self", "_blank"]
            },
          },
        }
      }
    } else{
      objectValidation = {
        view: {
          type: "object",
          props: {
            id: "string",
            target: {
              type: "object",
              props: {
                type: "string"
              }
            },
          }
        }
      }
    }
    const formCheck = new Validator({useNewCustomCheckerFunction: true}).compile({
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
      slug: {
        type: "custom",
        check: uniqueCheck
      },
      boardId: 'string|optional|empty:false',
      showInTrello : 'boolean|optional',
      body: {
        type: 'object',
        props: {
          formAutoIncrementId: 'number',
          readOnly: 'boolean|optional',
          rows: {
            type: 'array',
            min: 2,
            messages: {
              arrayMin: "At least 1 element required to create form"
            },
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
          successViews: {
            type: "object",
            props: {
              [buttonsEl?.id]: {
                type: "object",
                props: {
                  id: "string|optional",
                  type: {
                    type: "enum",
                    values: ['page', 'view']
                  },
                  props: {
                    type: "object",
                    props: objectValidation
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
      },
      submitter: {
        type: "object",
        optional: true,
        props: {
          type: "string"
        }
      }
    })
    const errors = [];
    const submitterCheck = new Validator().compile({
      submitter: {
        type: "object",
        props: {
          type: 'string',
          field: 'string'
        }
      }
    })
    if (this.nodeJson?.submitter?.type === "specifiedEmail" && !this?.nodeJson?.submitter?.field) {
      errors.pushArray(submitterCheck(this.nodeJson));
    }

    if(this.nodeJson?.enabled){
      errors.pushArray(formCheck(this.nodeJson));
    }

    return errors;
  }
}
