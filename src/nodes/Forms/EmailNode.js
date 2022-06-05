import AbstractHippoNode from "../AbstractHippoNode";

export default class EmailNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }
  getValidatorFunction() {
    const formsAndEmails =  this?.appJson?.app?.integrations?.incoming || {};
    const allEmails = (Object.values(formsAndEmails||{}) || []).filter( e => e?.type === "email" && e?.id !== this?.nodeJson?.id).map(e => e?.email)
    let errors = [];
    if(!this.nodeJson?.enabled)
      return [];
    else{
      if((allEmails||[]).includes(this?.nodeJson?.email)){
        errors.push({type: "unique", message: "Email must be unique"})
      }
      return errors
    }
  }
}
