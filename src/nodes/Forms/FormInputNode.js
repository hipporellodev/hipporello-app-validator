import AbstractHippoNode from "../AbstractHippoNode";
import ActionGroupNode from "../ActionGroupNode";
import Validator from "fastest-validator";
import VisibilityRuleNode from "./VisibilityRuleNode";
import {FORM_INPUT_NAMES} from "../../Utils/formInputNames";
import FormInputVisibilityNode from "./FormInputVisibilityNode";

const formInputSchema = {
  input: "string",
  id: 'string|empty:false',
  props: {
    type: "object",
    props: {
      value: "string|optional",
      label: "string|optional",
      name: "string",
      settings: "any|optional",
    }
  }
};
const formInputCheck = new Validator().compile(formInputSchema);
export default class FormInputNode extends AbstractHippoNode{
  constructor(appJson, path, id, formJson) {
    super(appJson, path);
    this.id = id;
    this.formJson = formJson;
  }

  process(appJson, path, nodeJson) {
    if(nodeJson?.input === "Button" && nodeJson?.props?.['optional-actionGroupId']){
      const actionGroupId = nodeJson?.props?.['optional-actionGroupId'];
      this.addChildNode(new ActionGroupNode(appJson, "app.actionGroups."+actionGroupId));
    }
    if (nodeJson.props?.visibilityRules?.rules?.length) {
      this.addChildNode(new FormInputVisibilityNode(appJson, `${this.path}.props.visibilityRules`))
    }
  }
  getValidatorFunction() {
    let hasParent = this?.parentNode?.nodeJson?.type === "updateform" || this?.parentNode?.nodeJson?.usesParent
    const formMapping = this.parentNode.nodeJson.body.fieldMapping || {}
    for (const formMappingKey in formMapping) {
      if(formMapping[formMappingKey]?.["cardField"]?.targetField === "c_parentCardId"){
        hasParent = true
      }
    }
    const trelloListIds = this.getTrelloList(true, hasParent)
    let isNameOptional = false;
    const fieldMapping = this?.parentNode?.nodeJson?.body?.fieldMapping;
    Object.values(fieldMapping||{}).forEach((fieldMap) => {
      if(fieldMap?.trelloCardField && fieldMap.trelloCardField?.targetField === "name"){
        isNameOptional = true
      }
    })
    const ButtonSchema = {
      "mandatory-action": {
        type: "object",
        optional: this?.parentNode?.nodeJson?.type === "updateform",
        nullable: this?.parentNode?.nodeJson?.type === "updateform",
        props: {
          type: {
            type: 'enum',
            values: ['create-card', 'update-card']
          },
          variables: {
            type: "object",
            props: {
              cardCollection: {
                type: "string",
                optional: true,
                nullable: true
              },
              name: {
                type: "string",
                empty: false,
                optional: isNameOptional,
                messages: {
                  required: "Card Name is a required field"
                }
              },
              listHippoId: {
                type: "enum",
                values: trelloListIds
              },
              description: "string|optional",
            }
          }
        }
      }
    }
    const TrelloLabelScheme = {
      label: "string",
      name: "string",
      schema: "object",
      settings: "object",
      validationRules: "object",
      elementData: {
        type: "object",
        props: {
          include: {
            type: "object",
            props: {
              type: {
                type: "enum",
                values: ['selected', 'all', 'variable']
              },
              variable: {
                type: "string",
                optional: true,
              },
              selected: {
                type: "array",
                nullable: this.nodeJson?.props?.elementData?.include?.type === "all",
                optional: this.nodeJson?.props?.elementData?.include?.type === "all",
                minItems: 1,
                messages: {
                  required: "No label selected for Trello Label Selector",
                }
              }
            }
          },
          fields: 'array'
        }
      }
    }
    const TrelloUserSelectorSchema = {
      label: "string",
      name: "string",
      schema: "object",
      settings: "object",
      validationRules: "object",
      elementData: {
        type: "object",
        props: {

        }
      }
    }
    const BooleanSchema = {
      label: "string",
      description: "string|optional",
      name: "string",
      schema: "object",
      validationRules: "object",
      settings: {
        type: "object",
        props: {
          inputType: "string",
          noText: {
            type: "string",
            optional: this.nodeJson?.props?.settings?.inputType !== "selectBox",
            messages: {
              required: "The 'No' field is required."
            }
          },
          yesText: {
            type: "string",
            optional: this.nodeJson?.props?.settings?.inputType !== "selectBox",
            messages: {
              required: "The 'Yes' field is required."
            }
          },
          placeholder: "string|optional",
          descriptionSwitch: "boolean",
          defaultValue: "boolean|optional"
        }
      }
    }
    const errors = [];
    let propsErrors = [];
    errors.pushArray(formInputCheck(this.nodeJson));
    if (this.nodeJson?.input === FORM_INPUT_NAMES.BUTTON) {
      const checker = new Validator().compile(ButtonSchema);
      propsErrors.pushArray(checker(this.nodeJson?.props));
    }
    if (this.nodeJson?.input === FORM_INPUT_NAMES.TRELLO_LABEL_SELECTOR) {
      const checker = new Validator().compile(TrelloLabelScheme);
      propsErrors.pushArray(checker(this.nodeJson.props))
    }
    if (this.nodeJson?.input === FORM_INPUT_NAMES.USER_SELECTOR) {
      const checker = new Validator().compile(TrelloUserSelectorSchema);
      propsErrors.pushArray(checker(this.nodeJson.props))
    }
    if (this.nodeJson?.input === FORM_INPUT_NAMES.BOOLEAN) {
      const checker = new Validator().compile(BooleanSchema);
      propsErrors.pushArray(checker(this.nodeJson.props))
    }
    propsErrors = propsErrors.map( error => ({
      ...error,
      field: `props.${error?.field}`
    }))
    errors.pushArray(propsErrors)
    return errors;
  }
}
