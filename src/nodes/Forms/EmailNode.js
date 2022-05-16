import AbstractHippoNode from "../AbstractHippoNode";

export default class EmailNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }
  getValidatorFunction() {
    let errors = [];
    if(!this.nodeJson?.enabled)
      return [];
    else
      return errors
  }
}
