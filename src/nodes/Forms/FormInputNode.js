import AbstractHippoNode from "../AbstractHippoNode";
import ActionGroupNode from "../ActionGroupNode";
import Validator from "fastest-validator";
import JSONUtils from "../../JSONUtils";

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
              listHippoId: "string|empty:false",
              description: "string|optional",
            }
          }
        }
      }
    }
    return new Validator().compile({
      input: "string",
      id: 'string|empty:false',
      props: {
        type: "object",
        props: {
          value: "string|optional",
          label: "string|optional",
          name: "string",
          settings: "any|optional",
          ...(this.nodeJson?.input === "Button" ? ButtonSchema : {})
        }
      }
    })
  }
}
