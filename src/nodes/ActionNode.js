import AbstractHippoNode from "./AbstractHippoNode";
import Validator from "fastest-validator";

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
const check = new Validator().compile(schema);
const schemaExternal = {
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
}
const checkExternal = new Validator().compile(schemaExternal);
const actionWhenMoveTo = new Validator().compile({
    list: 'string'
})
const actionWhenAssignLabel = new Validator().compile({
    labels: 'array'
})
const actionWhenAssignMember = new Validator().compile({
    members: 'array'
})
const actionWhenSendConvMessage = new Validator().compile({
    message: 'string',
    subject: 'string'
})
const actionWhenOpenPage = new Validator().compile({
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
    type: "object"
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
export default class ActionNode extends AbstractHippoNode {
    constructor(appJson, path, external) {
        super(appJson, path);
        this.external = external;
    }

    process(appJson, path, nodeJson) {
        this.formId = nodeJson.props?.formId
    }

    getValidatorFunction() {
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
        if (['update-hipporello-card', 'update-trello-card'].includes(this.nodeJson.type)) {
          errors.pushArray(actionWhenUpdateHipporelloCard(this.nodeJson.props||{}));
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
