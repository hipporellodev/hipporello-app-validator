import ViewNode from "./Views/ViewNode";
import Validator from "fastest-validator";
import getValidator from "../Utils/getValidator";

const webViewScheme = {
  enabled: 'boolean',
  id : "string",
  type : "string"
}
const webViewCheck = getValidator().compile(webViewScheme)
export default class WebViewNode extends ViewNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  getValidatorFunction = () => {
      let errors = [];
      const checkResult = webViewCheck(this.nodeJson);
      if (Array.isArray(checkResult)) {
        errors.pushArray(checkResult);
      }
      if (!this.appJson?.app?.views[this.nodeJson.appHeader]) {
        errors.push(this.createValidationError('oneOf', 'appHeader', this.nodeJson.appHeader, 'Errore Message'));
      }
      if (!this.appJson?.app?.views[this.nodeJson.home]) {
          errors.push(this.createValidationError('oneOf', 'home', this.nodeJson.home, 'Errore Message'));
      }
      return () => errors;
  }
}
