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
  constructor(appJson, path, id) {
    super(appJson, path);
    this.id = id;
  }

  process(appJson, path, nodeJson) {
    if(nodeJson?.input === "Button" && nodeJson?.props?.['optional-actionGroupId']){
      const actionGroupId = nodeJson?.props?.['optional-actionGroupId'];
      this.addChildNode(new ActionGroupNode(appJson, "app.actionGroups."+actionGroupId));
    }
    if (nodeJson.props?.visibilityRules?.rules?.length) {
      nodeJson.props.visibilityRules.rules.forEach((it, index) => {
        this.addChildNode(new VisibilityRuleNode(appJson, `${this.path}.props.visibilityRules.rules.${index}`));
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
    const buttonCheck = new Validator().compile(ButtonSchema);
    const errors = [];
    errors.pushArray(formInputCheck(this.nodeJson));
    if (this.nodeJson?.input === "Button") {
      errors.pushArray(buttonCheck(this.nodeJson?.props));
    }
    return errors;
  }
}
