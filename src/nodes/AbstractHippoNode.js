import JSONUtils from "../JSONUtils";
Array.prototype.pushArray = function (items) {
  if (!Array.isArray(items)) {
    return this;
  }
  this.splice(this.length, 0, ...items);
  return this;
}
export default class AbstractHippoNode {
  static counter;
  childNodes = [];
  path;
  actions;
  id;
  appJson;
  exists;
  validatorPath;
  checkedPaths = {};
  constructor(appJson, path) {
    this.appJson = appJson;
    this.path = path;
    this.validatorPath = path;
    this.exists = true;
    this.jsonPatchPath = path?"/"+(path.replace(/"/g, "").replace(/]/g, "").replace(/\[/g, ".").replace(/\./g, "/")):null
    if (!AbstractHippoNode.counter) {
      AbstractHippoNode.counter = 0;
    }
  }
  init(actions){
    this.actions = actions;
    this.childNodes = []
    this.nodeJson = JSONUtils.query(this.appJson, this.path);
    if(this.nodeJson) {
      this.id = this.generateNodeId(this.nodeJson);
      this.process(this.appJson, this.path, this.nodeJson)
      this.childNodes.forEach(childNode=>{
        childNode.init(this.actions);
      })
    } else{
      this.exists = false;
    }
  }

  generateNodeId(nodeJson){
    return nodeJson.id;
  }
  addChildNode(node){
    node.parentNode = this;
    this.childNodes.push(node);
  }
  process(appJson, path, nodeJson){}

  getValidatorFunction(){
    return (data) => {

    }
  }
  validate(errors){
    if (this.checkedPaths[this.path]) {
      return;
    }
    this.checkedPaths = this.path;
    if(!this.exists){
      if (this.isMandatory()) {
        errors.push({path:this.path, code:"not_exists"})
      }
      return;
    }
    if(this.getValidatorFunction() != null) {
      AbstractHippoNode.counter += 1;
      const validatorFuncResult = this.getValidatorFunction();
      let newerrors =  typeof validatorFuncResult === 'function' ? validatorFuncResult(this.nodeJson) : validatorFuncResult ;
      if(newerrors && Array.isArray(newerrors) && newerrors.length > 0) {
        newerrors.forEach(err => {
          err.path = `${this.validatorPath}.${err.field}`;
        })
        errors.pushArray(newerrors);
      }
    }
    this.childNodes.forEach(childNode=>{
      childNode.validate(errors);
    })
  };

  isMandatory() {
    return true;
  }

  createValidationError(type, field, actual,expected, message) {
    return {
      type,
      message,
      field,
      actual,
      expected
    }
  }
}
