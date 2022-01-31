import JSONUtils from "../JSONUtils";
export default class AbstractHippoNode {
  childNodes = [];
  path;
  actions;
  id;
  appJson;
  exists;
  constructor(appJson, path) {
    this.appJson = appJson;
    this.path = path;
    this.exists = true;
    this.jsonPatchPath = path?"/"+(path.replace(/"/g, "").replace(/]/g, "").replace(/\[/g, ".").replace(/\./g, "/")):null
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
    }
    else{
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
    return null;
  }
  validate(errors){
    if(!this.exists){
      errors.push({path:this.path, code:"not_exists"})
      return;
    }
    if(this.getValidatorFunction() != null) {
      let newerrors = this.getValidatorFunction()(this.nodeJson);
      if(newerrors && Array.isArray(newerrors) && newerrors.length > 0) {
        newerrors.forEach(err => {
          err.path = this.path;
        })
        errors.splice(errors.length, 0, newerrors);
      }
    }
    this.childNodes.forEach(childNode=>{
      childNode.validate(errors);
    })
  };
}
