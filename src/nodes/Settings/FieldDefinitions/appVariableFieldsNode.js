import AbstractHippoNode from "../../AbstractHippoNode";
import AppVariableNode from "./appVariableNode";
import JSONUtils from "../../../JSONUtils";

export default class AppVariableFieldsNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  process(appJson, path, nodeJson) {

    let appVariableFields = JSONUtils.query(appJson, "app.fieldDefinitions.appVariableFields");
    if(appVariableFields){
      appVariableFields = Object.values(appVariableFields)
      appVariableFields.forEach(appVariableField=>{
        this.addChildNode(new AppVariableNode(appJson, "app.fieldDefinitions.appVariableFields."+appVariableField.id))
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
