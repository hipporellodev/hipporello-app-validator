import AbstractHippoNode from "../AbstractHippoNode";
import ActionGroupNode from "../ActionGroupNode";
import Validator from "fastest-validator";
import VisibilityRuleNode from "./VisibilityRuleNode";

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
      nodeJson.props.visibilityRules.rules.forEach((it, index) => {
        this.addChildNode(new VisibilityRuleNode(appJson, `${this.path}.props.visibilityRules.rules.${index}`, this.formJson));
      })
    }
  }
  getValidatorFunction() {
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
              name: "string|empty:false",
              listHippoId: {
                type: "enum",
                values: (this.entities?.trelloLists||[])?.map(i=>i?.hippoId)
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
                values: ['selected', 'all']
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
    const errors = [];
    errors.pushArray(formInputCheck(this.nodeJson));
    if (this.nodeJson?.input === "Button") {
      const checker = new Validator().compile(ButtonSchema);
      errors.pushArray(checker(this.nodeJson?.props));
    }
    if (this.nodeJson?.input === "TrelloLabelSelector") {
      const checker = new Validator().compile(TrelloLabelScheme);
      errors.pushArray(checker(this.nodeJson.props))
    }
    return errors;
  }
}
