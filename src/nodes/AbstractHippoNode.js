import JSONUtils from "../JSONUtils";
import Validator from "fastest-validator";
const schema = {
  enabled: 'boolean',
  viewProps: {
    type: 'object',
    props: {
      name: 'string',
      cardAware: 'boolean|optional',
      gap: 'number|optional',
      gap1: 'number|optional',
      gap2: 'number|optional',
      gap3: 'number|optional',
      gap4: 'number|optional',
      gap5: 'number|optional',
      gap6: 'number|optional',
      gap7: 'number|optional',
      gap8: 'number|optional',
      gap9: 'number|optional',
      gap10: 'number|optional',
      gap11: 'number|optional',
      gap12: 'number|optional',
      gap13: 'number|optional',
      gap14: 'number|optional',
      gap15: 'number|optional',
      gap16: 'number|optional',
    },
  }
}
const check = new Validator().compile(schema);
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
    return check;
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
