import AbstractHippoNode from "./AbstractHippoNode";
import Validator from "fastest-validator";
const tcMayUpdateFields = [
  "tc_desc",
  "tc_name",
  "tc_labelHippoIds",
  "tc_idMembers",
  "tc_listHippoId",
  "tc_startDate",
  "tc_dueDate",
  "tc_dueReminder",
  "tc_dueComplete",
  "tc_shortUrl",
  "tc_url",
]
const schema = {
    id: 'string',
    order: 'number',
    type: {
        type: 'enum',
        values: [
            "send-conversation-message",
            "update-hipporello-card",
            "update-trello-card",
            "add-comment",
            "open-form",
            "open-page",
            "open-url",
            "update-card-members",
            "update-card-labels",
            "move-card",
            "archive-card"
        ]
    },
    props: {
        type: 'object',
        optional: true,
        props: {
            onSuccess: {
                type: 'object',
                optional: true,
                props: {
                    id: 'string',
                    required: 'string'
                }
            },
            params: {
                type: 'object',
                optional: true,
                props: {
                    context: {
                        type: 'enum',
                        values: ["parent", "self", "children"]
                    }
                }
            }
        }
    }
}
export default class ActionNode extends AbstractHippoNode {
    constructor(appJson, path, external) {
        super(appJson, path);
        this.external = external;
    }

    process(appJson, path, nodeJson) {
        this.formId = nodeJson.props?.formId
    }
    getValidatorFunction() {
        const check = new Validator().compile(schema);
        const checkExternal = new Validator().compile({
          id: 'string|optional',
          type: {
            type: 'enum',
            values: [
              "send-conversation-message",
              "update-hipporello-card",
              "update-trello-card",
              "add-comment",
              "open-form",
              "open-page",
              "open-url",
              "update-card-members",
              "update-card-labels",
              "move-card",
              "archive-card",
              "conversation-get-board-members",
              "conversation-get-contacts",
              "conversation-get-roles",
              "conversation-reply",
              "conversation-delete-message",
              "conversation-delete-thread",
              "conversation-update-members",
              "conversation-new-thread",
              "conversation-reply"
            ]
          },
          props: {
            type: 'object',
            optional: true,
            props: {
              onSuccess: {
                type: 'object',
                optional: true,
                props: {
                  id: 'string',
                  required: 'string'
                }
              },
              params: {
                type: 'object',
                optional: true,
                props: {
                  context: {
                    type: 'enum',
                    values: ["parent", "self", "children"]
                  }
                }
              }
            }
          }
        });
        const staticListOptions = ["nextListOnBoard", "previousListOnBoard"]
        const trelloListOptions =  (this.entities?.trelloLists||[])?.map(i=>i?.hippoId)
        const trelloLabels =  (this.entities?.trelloLabels||[])?.map(i=>i?.hippoId)
        const allListOptions = [...staticListOptions, ...trelloListOptions]
        const allHippoFields = this?.appJson?.app?.fieldDefinitions?.hippoFields||{}
        const roles = Object.values((this.appJson?.app?.roles || {})).map(role => role?.id)
      const actionWhenMoveTo = new Validator().compile({
          listHippoId: {
            type: "enum",
            values: allListOptions
          }
        })
        const actionWhenAssignLabel = new Validator().compile({
          labels: {
            type: "array",
            items: {
              type: "enum",
              values: trelloLabels || []
            }
          }
        })
        const actionWhenAssignMember = new Validator().compile({
          members: {
            type: "array",
            items: {
              type: "object",
              props:{
                type: {
                  type: "enum",
                  values: ["trelloMember", "trelloRole"]
                },
                value: {
                  type: "enum",
                  values: [
                    ...(this.entities?.members||[])?.map(i=>i?.id),
                    "allTrelloCardMembers",
                    "allTrelloBoardMembers",
                    "allTrelloBoardAdminMembers",
                    "allTrelloNormalMembers",
                    "allTrelloObserverMembers",
                  ]
                }
              }
            }
          }
        })
        const actionWhenSendConvMessage = new Validator().compile({
          message: 'string',
          subject: 'string',
          conversationMembers: {
            type: "array",
            items: {
              type: "object",
              props: {
                type: {
                  type: "enum",
                  values: ["trelloMember", "trelloRoles", "submissionOwner", "hipporelloMember", "hipporelloRole"]
                },
                id: {
                  type: "enum",
                  values: [
                    ...(this.entities?.members||[])?.map(i=>i?.id),
                    ...(roles||[]),
                    "allTrelloCardMembers",
                    "allTrelloBoardMembers",
                    "allTrelloBoardAdminMembers",
                    "allTrelloNormalMembers",
                    "allTrelloObserverMembers",
                    "submissionOwner",
                  ]
                },
                isContributor: "boolean|optional"
              }
            }
          }
        })
        const actionWhenOpenPage = new Validator().compile({
          viewId: {
            type: "enum",
            values: this.getPageIds()
          },
          target: {
            type: 'object',
            props: {
              type: {
                type: 'enum',
                values: ["_self", "_blank", "_modal"]
              }
            }
          },
          type: {
            type: 'enum',
            values: ['internal', 'external']
          }
        })
        const actionWhenOpenURL = new Validator().compile({
          target: {
            type: 'object',
            props: {
              type: {
                type: 'enum',
                values: ["_self", "_blank"]
              }
            }
          },
          url: 'string|empty:false'
        })
        const actionWhenOpenPageExternal = new Validator().compile({
          url: 'string|empty:false'
        });
        const actionWhenUpdateHipporelloCard = new Validator().compile({
          cardUpdateFields: {
            type: "object",
            props: tcMayUpdateFields.reduce((a, i) => {
              a[i] = {
                type: "object",
                optional: true,
                props: {
                  type: {
                    type: "equal",
                    value: "replacement"
                  },
                  valueType: {
                    type: "enum",
                    optional: true,
                    values: ["value", "variable"]
                  },
                  value: {
                    type: "string",
                    nullable: true,
                    default: "[[[nullValue]]]",
                    check(value, errors, schema, path, parentNode){
                      if(value === "[[[nullValue]]]" && parentNode?.valueType === "variable"){
                        errors.push({type: "required"})
                      }
                      return value
                    }
                  }
                }
              }
              return a
            }, {})
          },
          params: {
            type: "object",
            props: {
              context: {
                type: 'enum',
                values: ["parent", "self", "children"]
              }
            }
          }
        })
      const hippoTypes = {
          "attachment": "array",
          "double": "number",
          "datetime": "number",
          "time": "number",
          "date": "number"
      }
      const getHippoFieldType = (hippoId) => {
          const valueType = this.nodeJson.props?.cardUpdateFields?.[hippoId]?.valueType||"value"
          let type = "string"
          if(valueType === "value"){
            type = hippoTypes?.[allHippoFields?.[hippoId]?.type]||"string"
          }
          return type
      }
      const actionWhenUpdateHippoFields = new Validator().compile({
        cardUpdateFields: {
          type: "object",
          props: Object.keys(allHippoFields||{}).reduce((a, i) => {
            a[i] = {
              type: "object",
              optional: true,
              props: {
                type: {
                  type: "equal",
                  value: "replacement"
                },
                valueType: {
                  type: "enum",
                  optional: true,
                  values: ["value", "variable"]
                },
                value: {
                  type:  getHippoFieldType(i),
                  check(value, errors, schema, path, parentNode){
                    if(value === "[[[nullValue]]]" && parentNode?.valueType === "variable"){
                      errors.push({type: "required"})
                    }
                    return value
                  }
                }
              }
            }
            return a
          }, {})
        },
        params: {
          type: "object",
          props: {
            context: {
              type: 'enum',
              values: ["parent", "self", "children"]
            }
          }
        }
      })
        const actionWhenOpenForm = new Validator().compile({
          formId: {
            type: "enum",
            values: this.getFormIds(false, (i) => ["form", "updateform"]?.includes(i?.type))
          },
          target: {
            type: 'object',
            props: {
              type: {
                type: 'enum',
                values: ["_modal", "_blank", "_self"]
              }
            }
          }
        });
        const actionWhenOpenFormModal = new Validator().compile({
          title: "string|optional",
          size: {
            optional: true,
            type: 'enum',
            values: ["small", "medium", "large"]
          }
        });
        const errors = [];
        if (this.external) {
            errors.pushArray(checkExternal(this.nodeJson));
        } else {
            errors.pushArray(check(this.nodeJson));
        }
        this.validatorPath = `${this.path}.props`;
        if (this.nodeJson.type === 'move-card') {
            errors.pushArray(actionWhenMoveTo(this.nodeJson.props||{}));
        }
        if (this.nodeJson.type === 'update-card-labels') {
            errors.pushArray(actionWhenAssignLabel(this.nodeJson.props||{}));
        }
        if (this.nodeJson.type === 'update-card-members') {
            errors.pushArray(actionWhenAssignMember(this.nodeJson.props||{}));
        }
        if (this.nodeJson.type === 'send-conversation-message') {
            errors.pushArray(actionWhenSendConvMessage(this.nodeJson.props||{}));
        }
        if (this.nodeJson.type === 'update-trello-card') {
          errors.pushArray(actionWhenUpdateHipporelloCard(this.nodeJson.props||{}));
        }
        if (this.nodeJson.type === 'update-hipporello-card') {
          if(Object.keys(allHippoFields||{}).includes(Object.keys(this.nodeJson.props?.cardUpdateFields)?.[0]))
            errors.pushArray(actionWhenUpdateHippoFields(this.nodeJson.props||{}));
          else{
            this.validatorPath = `${this.path}.props.cardUpdateFields.${Object.keys(this.nodeJson.props?.cardUpdateFields)?.[0]}` || this.path
            errors.pushArray([{type: "Not Exist", message: "Hippo Field id does not exist"}])
          }
        }
        if (this.nodeJson.type === 'open-page') {
            errors.pushArray(actionWhenOpenPage(this.nodeJson.props||{}));
            if (this.nodeJson.props.type === 'internal' && !this.appJson.app.views[this.nodeJson.props.viewId]) {
                errors.push(this.createValidationError('oneOf', 'viewId', this.nodeJson.props.viewId, Object.keys(this.appJson.app.views), this.getPageNames()))
            }
            if (this.nodeJson.props.type === 'external') {
                errors.pushArray(actionWhenOpenPageExternal(this.nodeJson.props||{}));
            }
        }
        if (this.nodeJson.type === 'open-url') {
          errors.pushArray(actionWhenOpenURL(this.nodeJson.props||{}));
        }
        // TODO Caner Add open URL checks here
        if (this.nodeJson.type === 'open-form') {
            errors.pushArray(actionWhenOpenForm(this.nodeJson.props||{}))
            if (!(this.appJson?.app?.integrations?.incoming || {})[this.nodeJson.props.formId]) {
                errors.push(this.createValidationError('oneOf', 'formId', this.nodeJson.props.formId, Object.keys(this.appJson?.app?.integrations?.incoming || {})))
            }
            if (this.nodeJson.props?.target?.type === '_modal') {
                this.validatorPath = `${this.path}.props.target`;
                errors.pushArray(actionWhenOpenFormModal(this.nodeJson.props.target));
            }
        }
        return errors;
    }
}
