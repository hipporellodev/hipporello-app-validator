import AbstractHippoNode from "../../AbstractHippoNode";
import AppVariableNode from "./appVariableNode";

export default class AppVariableFieldsNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {
    const appVariableIds = this.getAppParameters(true)
    if(appVariableIds){
      appVariableIds.forEach(appVariableId=>{
        this.addChildNode(new AppVariableNode(appJson, "app.fieldDefinitions.appVariableFields."+appVariableId))
      })
    }
  }
  getValidatorFunction() {
    if (typeof this.nodeJson !== 'object') {
      return [
          this.createValidationError('object', null, typeof this.nodeJson)
      ]
    }
  }
}
