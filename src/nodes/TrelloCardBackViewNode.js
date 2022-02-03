import ViewNode from "./Views/ViewNode";
import Validator from "fastest-validator";

const trelloCardBackScheme = {
  enabled: 'boolean',
  id : "string",
  type : "string"
}
const trelloCardBackCheck = new Validator().compile(trelloCardBackScheme)
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
    if (!this.appJson?.app?.views[this.nodeJson.appHeader]) {
      errors.push(this.createValidationError('oneOf', 'appHeader', this.nodeJson.appHeader, 'Errore Message'));
    }
    return () => errors;
  }
}
