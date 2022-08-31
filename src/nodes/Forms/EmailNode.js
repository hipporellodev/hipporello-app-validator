import AbstractHippoNode from "../AbstractHippoNode";
import FormInputNode from "./FormInputNode";

export default class EmailNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }
  process(appJson, path, nodeJson) {
    if(nodeJson?.enabled){
      nodeJson?.body?.rows.forEach((row, rowIndex) =>{
        if(row?.columns?.length){
          row?.columns.forEach((column, colIndex) =>{
            this.addChildNode(new FormInputNode(appJson, `${this.path}.body.rows.${rowIndex}.columns.${colIndex}.element`, column?.element?.id, nodeJson))
          })
        }
      })
    }
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
