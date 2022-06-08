import AbstractHippoNode from "../AbstractHippoNode";
import ActionGroupNode from "../ActionGroupNode";
import Validator from "fastest-validator";
import JSONUtils from "../../JSONUtils";

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
  constructor(appJson, path, id) {
    super(appJson, path);
    this.id = id;
  }

  process(appJson, path, nodeJson) {
    if(nodeJson?.input === "Button" && nodeJson?.props?.['optional-actionGroupId']){
      const actionGroupId = nodeJson?.props?.['optional-actionGroupId'];
      this.addChildNode(new ActionGroupNode(appJson, "app.actionGroups."+actionGroupId));
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
    const buttonCheck = new Validator().compile(ButtonSchema);
    const visibilityRuleSchema =  {
      visibilityRules: {
        type: 'object',
        props: {
          rules: {
            type: 'array',
            items: {
              type: "object",
              props: {
                field: "string|required",
                value: "array",
                operator: "string"
              }
            }
          }
        }
      }
    }
    const visibilityRuleCheck = new Validator().compile(visibilityRuleSchema);
    const errors = [];
    errors.pushArray(formInputCheck(this.nodeJson));
    if (this.nodeJson?.input === "Button") {
      errors.pushArray(buttonCheck(this.nodeJson));
    }
    if (this.nodeJson.props.visibilityRules) {
      errors.pushArray(visibilityRuleCheck(this.nodeJson.props));
    }

    return errors;
  }
}
