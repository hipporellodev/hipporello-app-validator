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
];
const checkExternal = new Validator().compile({
  id: "string|optional",
  type: {
    type: "enum",
    values: [
      "send-conversation-message",
      "update-hipporello-card",
      "update-trello-card",
      "add-comment",
      "open-form",
      "open-page",
      "open-url",
      "navigate-to-card",
      "update-card-members",
      "update-card-labels",
      "move-card",
      "archive-card",
      "send-card-to-board",
      "conversation-get-board-members",
      "conversation-get-contacts",
      "conversation-get-roles",
      "conversation-reply",
      "conversation-delete-message",
      "conversation-delete-thread",
      "conversation-update-members",
      "conversation-get-card-fields",
      "conversation-new-thread",
      "conversation-reply",
      "UpdateAppVariable",
      "UpdateHippoField",
      "user-management-add-user",
      "user-management-update-user",
      "user-management-check-user",
    ],
  },
  props: {
    type: "object",
    optional: true,
    props: {
      onSuccess: {
        type: "object",
        optional: true,
        props: {
          id: "string",
          required: "string",
        },
      },
      params: {
        type: "object",
        optional: true,
        props: {
          context: {
            type: "enum",
            values: ["parent", "self", "children"],
          },
        },
      },
    },
  },
});
const PRECISE_PATTERN =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const schema = new Validator().compile({
  id: "string",
  order: "number",
  type: {
    type: "enum",
    values: [
      "send-conversation-message",
      "update-hipporello-card",
      "update-trello-card",
      "add-comment",
      "open-form",
      "open-page",
      "open-url",
      "navigate-to-card",
      "update-card-members",
      "update-card-labels",
      "move-card",
      "archive-card",
      "send-card-to-board",
      "copy-to-clipboard",
      "feedback-message",
      "confirmation-box"
    ],
  },
  props: {
    type: "object",
    optional: true,
    props: {
      onSuccess: {
        type: "object",
        optional: true,
        props: {
          id: "string",
          required: "string",
        },
      },
      params: {
        type: "object",
        optional: true,
        props: {
          context: {
            type: "enum",
            values: ["parent", "self", "children"],
          },
        },
      },
    },
  },
});
const staticListOptions = ["nextListOnBoard", "previousListOnBoard"];
const actionWhenOpenURL = new Validator().compile({
  target: {
    type: "object",
    props: {
      type: {
        type: "enum",
        values: ["_self", "_blank"],
      },
    },
  },
  url: "string|empty:false",
});
const actionWhenOpenPageExternal = new Validator().compile({
  url: "string|empty:false",
});
const hippoTypes = {
  attachment: "array",
  double: "number",
  datetime: "number",
  time: "number",
  date: "number",
};
const actionWhenUpdateHippoFieldsContext = new Validator().compile({
  params: {
    type: "object",
    props: {
      context: {
        type: "enum",
        values: ["parent", "self", "children"],
      },
    },
  },
  cardUpdateFields: {
    type: "object",
  },
});
const actionWhenOpenFormModal = new Validator().compile({
  title: "string|optional",
  size: {
    optional: true,
    type: "enum",
    values: ["small", "medium", "large", "fullscreen"],
  },
});
const actionCopyToClipboard = new Validator().compile({
  dataToBeCopied: {
    type: "string",
    messages: {
      required: "Source can not be empty.",
    },
  },
});
const actionFeedbackMessage = new Validator().compile({
  title: {
    type: "string",
    messages: {
      required: "Title can not be empty.",
    },
  },
  type: {
    type: "enum",
    values: ["info", "error", "warning", "success"],
  },
  icon: {
    type: "enum",
    values: [
      "check-circle",
      "exclamation-circle",
      "exclamation-triangle",
      "info-circle",
    ],
  },
  message: {
    type: "string",
    optional: true,
  },
  duration: {
    type: "number",
    min: 0,
    max: 20,
  },
  position: {
    type: "enum",
    values: [
      "top-left",
      "top-left",
      "top-center",
      "top-right",
      "bottom-left",
      "bottom-center",
      "bottom-right",
    ],
  },
});
export default class ActionNode extends AbstractHippoNode {
  constructor(appJson, path, external) {
    super(appJson, path);
    this.external = external;
  }

  process(appJson, path, nodeJson) {
    this.formId = nodeJson.props?.formId;
  }
  getValidatorFunction() {
    const trelloListOptions = this.getTrelloList(true, true, false);
    const trelloLabels = this.entitiesIds?.trelloLabels;
    const allListOptions = staticListOptions.concat(trelloListOptions);
    const allHippoFields = this.getHippoFields(true);
    const roles = Object.values(this.appJson?.app?.roles || {}).map(
      (role) => role?.id
    );
    const allFieldWithContext = this.getCardFieldsWithContext(
      ["card", "parentCard"],
      true,
      (field) => field?.type === "string"
    );
    const actionWhenMoveTo = new Validator({
      useNewCustomCheckerFunction: true,
    }).compile({
      listHippoId: {
        type: "string",
        label: "List",
        custom: (value, errors) => {
          const isQuery = /\{\{\{.*}}}/gi.test(String(value));
          if (isQuery) {
            //Query Validation
          } else if (!allListOptions.includes(value)) {
            errors.push({
              type: "enum",
              expected: allListOptions,
              actual: value,
              message: "Choose another List",
            });
          }
        },
        // values: allListOptions,
        messages: {
          required: this.createMustacheLabel("list"),
        },
      },
    });
    const actionWhenAssignLabel = new Validator().compile({
      updateLabelActionType: {
        type: "enum",
        values: [
          "remove-all-labels",
          "remove-labels",
          "set-labels",
          "add-labels",
        ],
      },
      labels: {
        type: "array",
        optional:
          this.nodeJson.props?.updateLabelActionType === "remove-all-labels",
        items: {
          type: "enum",
          values: trelloLabels || [],
          messages: {
            enumValue: this.createMustacheLabel("label"),
            required: this.createMustacheLabel("label"),
          },
        },
      },
    });
    const actionWhenAssignMember = new Validator().compile({
      updateMemberActionType: {
        type: "enum",
        values: [
          "add-members",
          "set-members",
          "remove-members",
          "remove-all-members",
        ],
      },
      members: {
        type: "array",
        items: {
          type: "object",
          props: {
            type: {
              type: "enum",
              values: ["trelloMember", "trelloRole"],
            },
            value: {
              type: "enum",
              values: [
                ...(this.entities?.members || [])?.map((i) => i?.id),
                "all",
                "allTrelloCardMembers",
                "allTrelloBoardMembers",
                "allTrelloBoardAdminMembers",
                "allTrelloNormalMembers",
                "allTrelloObserverMembers",
              ],
              messages: {
                enumValue: this.createMustacheLabel("member"),
                required: this.createMustacheLabel("member"),
              },
            },
          },
        },
      },
    });
    const conversationMembersCheck = (value, errors, schema) => {
      if (!(schema?.props?.type?.values || []).includes(value?.type)) {
        errors.push({
          type: "enumValue",
          actual: value?.type,
          field: "type",
          expected: schema?.props?.type?.values || [],
        });
      }
      if (value?.type === "email") {
        if (!PRECISE_PATTERN.test(value?.id)) {
          errors.push({ type: "email", actual: value?.id, field: "id" });
        }
      } else {
        if (value?.type === "cardField") {
          //Variable Validator
        } else if (!(schema?.props?.id?.values || []).includes(value?.id)) {
          errors.push({
            type: "enumValue",
            actual: value?.id,
            field: "id",
            expected: schema?.props?.id?.values || [],
          });
        }
      }
      return value;
    };
    const actionWhenSendConvMessage = new Validator({
      useNewCustomCheckerFunction: true,
    }).compile({
      message: "string",
      subject: "string",
      conversationMembers: {
        type: "array",
        items: {
          type: "custom",
          check: conversationMembersCheck,
          props: {
            type: {
              type: "enum",
              values: [
                "trelloMember",
                "cardField",
                "trelloRoles",
                "submissionOwner",
                "hipporelloMember",
                "hipporelloRole",
                "email",
              ],
            },
            id: {
              type: "enum",
              values: [
                ...(this.entities?.members || [])?.map((i) => i?.id),
                ...(roles || []),
                ...(allFieldWithContext || []),
                "allTrelloCardMembers",
                "allTrelloBoardMembers",
                "allTrelloBoardAdminMembers",
                "allTrelloNormalMembers",
                "allTrelloObserverMembers",
                "submissionOwner",
              ],
            },
            isContributor: "boolean|optional",
          },
        },
      },
    });
    const actionWhenOpenPage = new Validator().compile({
      viewId: {
        type: "enum",
        values: this.getPageIds(),
        messages: {
          enumValue: this.createMustacheLabel("page"),
          required: this.createMustacheLabel("page"),
        },
      },
      target: {
        type: "object",
        props: {
          type: {
            type: "enum",
            values: ["_self", "_blank", "_modal"],
          },
        },
      },
      type: {
        type: "enum",
        values: ["internal", "external"],
      },
    });
    const updateHippoFieldGenerateScheme = (key) => {
      const actionWhenUpdateHippoFields = new Validator({useNewCustomCheckerFunction: true}).compile({
        cardUpdateFields: {
          type: "object",
          props: {
            [key]: {
              type: "object",
              optional: true,
              props: {
                type: {
                  type: "enum",
                  optional: true,
                  values: ["replacement", "minus", "plus", "multiply", "remove"],
                },
                valueType: {
                  type: "enum",
                  optional: true,
                  values: ["value", "variable"]
                },
                value: {
                  type: "custom",
                  nullable: true,
                  default: "[[[nullValue]]]",
                  check: (value, errors, schema, path, parentNode) => {
                    if (
                      value === "[[[nullValue]]]" &&
                      parentNode?.valueType === "variable"
                    ) {
                      errors.push({ type: "required", field: "value" });
                    }
                    const hasEmptyItem = Array.isArray(value) ? Object.values(value).length !== value.length : false;
                    if(hasEmptyItem && parentNode?.valueType === "value"){
                      errors.push({ type: "required", field: "value", message: "Any of the added items must not be empty" });
                    }
                    return value;
                  },
                },
              },
            },
          },
        },
        params: {
          type: "object",
          props: {
            context: {
              type: "enum",
              values: ["parent", "self", "children"],
            },
          },
        },
      });
      return actionWhenUpdateHippoFields;
    };
    const actionWhenOpenForm = new Validator().compile({
      formId: {
        type: "enum",
        values: this.getFormIds(false, (i) =>
          ["form", "updateform"]?.includes(i?.type)
        ),
        messages: {
          enumValue: this.createMustacheLabel("form"),
          required: this.createMustacheLabel("form"),
        },
      },
      target: {
        type: "object",
        props: {
          type: {
            type: "enum",
            values: ["_modal", "_blank", "_self"],
          },
        },
      },
    });
    const errors = [];
    if (this.external) {
      errors.pushArray(checkExternal(this.nodeJson));
    } else {
      errors.pushArray(schema(this.nodeJson));
    }
    this.validatorPath = `${this.path}.props`;
    if (this.nodeJson.type === "move-card") {
      errors.pushArray(actionWhenMoveTo(this.nodeJson.props || {}));
    } else if (this.nodeJson.type === "update-card-labels") {
      errors.pushArray(actionWhenAssignLabel(this.nodeJson.props || {}));
    } else if (this.nodeJson.type === "update-card-members") {
      errors.pushArray(actionWhenAssignMember(this.nodeJson.props || {}));
    } else if (this.nodeJson.type === "send-conversation-message") {
      errors.pushArray(actionWhenSendConvMessage(this.nodeJson.props || {}));
    } else if (
      this.nodeJson.type === "update-hipporello-card" ||
      this.nodeJson.type === "update-trello-card"
    ) {
      const firstField = Object.keys(
        this.nodeJson.props?.cardUpdateFields || {}
      )?.[0];
      if (allHippoFields.includes(firstField)) {
        this.validatorPath = `${this.path}.props.cardUpdateFields.${firstField}`;
        errors.pushArray(
          updateHippoFieldGenerateScheme(firstField)(this.nodeJson.props || {})
        );
      } else {
        this.validatorPath = `${this.path}.props.cardUpdateFields`;
        errors.pushArray(
          actionWhenUpdateHippoFieldsContext(this.nodeJson.props || {})
        );
        // this.validatorPath = `${this.path}.props.cardUpdateFields.${Object.keys(this.nodeJson.props?.cardUpdateFields||{})?.[0]}` || this.path
        // errors.pushArray([{type: "Not Exist", message: "Hippo Field id does not exist"}])
      }
    } else if (this.nodeJson.type === "open-page") {
      errors.pushArray(actionWhenOpenPage(this.nodeJson.props || {}));
      // Todo: Disabled pages is not error for usage actions, actually warning
      // if (this.nodeJson.props.type === 'internal' && !this.appJson.app.views[this.nodeJson.props.viewId]?.enabled) {
      //     const availables = Object.entries(this.appJson.app.views)
      //         .filter(it => it?.[1].enabled)
      //         .map(it => it?.[0]);
      //     errors.push(this.createValidationError('oneOf', 'viewId', this.nodeJson.props.viewId, availables, this.getPageNames()))
      // }
      if (this.nodeJson.props.type === "external") {
        errors.pushArray(actionWhenOpenPageExternal(this.nodeJson.props || {}));
      }
    } else if (this.nodeJson.type === "open-url") {
      errors.pushArray(actionWhenOpenURL(this.nodeJson.props || {}));
    } else if (this.nodeJson.type === "open-form") {
      errors.pushArray(actionWhenOpenForm(this.nodeJson.props || {}));
      // if (!(this.appJson?.app?.integrations?.incoming || {})[this.nodeJson.props.formId]?.enabled) {
      //   const availables = Object.entries(this.appJson?.app?.integrations?.incoming || {})
      //     .filter(it => it?.[1]?.enabled)
      //     .map(it => it?.[0]);
      //   errors.push(this.createValidationError('oneOf', 'formId', this.nodeJson.props.formId, availables))
      // }
      if (this.nodeJson.props?.target?.type === "_modal") {
        this.validatorPath = `${this.path}.props.target`;
        errors.pushArray(actionWhenOpenFormModal(this.nodeJson.props.target));
      }
    } else if (this.nodeJson.type === "copy-to-clipboard") {
      errors.pushArray(actionCopyToClipboard(this.nodeJson.props || {}));
    } else if (this.nodeJson.type === "feedback-message") {
      errors.pushArray(actionFeedbackMessage(this.nodeJson.props || {}));
    }
    return errors;
  }
}
