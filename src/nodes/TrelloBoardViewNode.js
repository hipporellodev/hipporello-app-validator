import ViewNode from "./Views/ViewNode";
import Validator from "fastest-validator";

const webViewScheme = {
  enabled: 'boolean',
  id : "string",
  type : "string"
}
const trelloBoardViewCheck = new Validator().compile(webViewScheme)
export default class TrelloBoardViewNode extends ViewNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  getValidatorFunction = () => {
      let errors = [];
      const checkResult = trelloBoardViewCheck(this.nodeJson);
      if (Array.isArray(checkResult)) {
        errors.pushArray(checkResult);
      }
      // if (!this.appJson?.app?.views[this.nodeJson.appHeader]) {
      //   errors.push(this.createValidationError('required', 'appHeader', this.nodeJson.appHeader, 'Error Message'));
      // }
	    if (!this.appJson?.app?.views?.length){
		    errors.push(this.createValidationError('required', 'views', this.nodeJson.views, null, null, "You must create at least one page for the Board View."));
	    }
      if (!this.appJson?.app?.views[this.nodeJson.home]) {
          errors.push(this.createValidationError('required', 'home', this.nodeJson.home, null, null, "One of the Board View pages should be the home page."));
      }
      return () => errors;
  }
}
