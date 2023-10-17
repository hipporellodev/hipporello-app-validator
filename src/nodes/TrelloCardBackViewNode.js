import ViewNode from "./Views/ViewNode";
import Validator from "fastest-validator";
import getValidator from "../Utils/getValidator";

const trelloCardBackScheme = {
  enabled: 'boolean',
  id : "string",
  type : "string"
}
const trelloCardBackCheck = getValidator().compile(trelloCardBackScheme)
export default class TrelloCardBackViewNode extends ViewNode{
  constructor(appJson, path) {
    super(appJson, path);
  }
  getValidatorFunction() {
    let errors = [];
    const checkResult = trelloCardBackCheck(this.nodeJson);
    if (Array.isArray(checkResult)) {
      errors.pushArray(checkResult);
    }
    if (this.nodeJson.appHeader && !this.appJson?.app?.views[this.nodeJson.appHeader]) {
      errors.push(this.createValidationError('oneOf', 'appHeader', this.nodeJson.appHeader, 'Error Message'));
    }
    return () => errors;
  }
}
