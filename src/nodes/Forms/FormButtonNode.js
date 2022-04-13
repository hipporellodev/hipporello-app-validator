import AbstractHippoNode from "../AbstractHippoNode";
import ActionGroupNode from "../ActionGroupNode";
import Validator from "fastest-validator";

export default class FormButtonNode extends AbstractHippoNode{
  constructor(appJson, path, type) {
    super(appJson, path);
    this.type = type;
  }

  process(appJson, path, nodeJson) {
    if(nodeJson?.props?.['optional-actionGroupId']){
      const actionGroupId = nodeJson?.props?.['optional-actionGroupId'];
      this.addChildNode(new ActionGroupNode(appJson, "app.actionGroups."+actionGroupId));
    }
  }
  getValidatorFunction() {
    return new Validator().compile({
      input: {
        type: "enum",
        values: ["Button"]
      },
      id: 'string|empty:false',
      props: {
        type: "object",
        props: {
          value: "string",
          label: "string",
          name: "string",
          settings: "any|optional",
          "mandatory-action": {
            type: "object",
            optional: this.type === "updateform",
            nullable: this.type === "updateform",
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
                  list: "string|empty:false",
                  description: "string|optional",
                }
              }
            }
          }
        }
      }
    })
  }
}
