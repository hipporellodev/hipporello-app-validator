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
  lists = [];
  members = [];
  constructor(appJson, path) {
    if (appJson.appJson) {
      this.appJson = appJson.appJson;
      this.lists = appJson.lists || [];
      this.members = appJson.members || [];
    } else {
      this.appJson = appJson;
    }
    this.path = path;
    this.validatorPath = path;
    this.exists = true;
    this.jsonPatchPath = path?"/"+(path.replace(/"/g, "").replace(/]/g, "").replace(/\[/g, ".").replace(/\./g, "/")):null
    if (!AbstractHippoNode.counter) {
      AbstractHippoNode.counter = 0;
    }
  }
  init(actions, entities){
    this.actions = actions;
    this.entities = entities;
    this.entitiesIds = {
      trelloLists: (this.entities?.trelloLists||[])?.map(i=>i?.hippoId),
      trelloLabels: (this.entities?.trelloLabels||[])?.map(i=>i?.hippoId)
    }
    this.childNodes = []
    this.nodeJson = JSONUtils.query(this.appJson, this.path);
    if(this.nodeJson) {
      this.id = this.generateNodeId(this.nodeJson);
      this.process(this.appJson, this.path, this.nodeJson)
      this.childNodes.forEach(childNode=>{
        childNode.init(this.actions, this.entities);
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
    this.checkedPaths[this.path] = true;
    if(!this.exists){
      if (this.isMandatory()) {
        errors.push({path: this.parentNode?.path, type:"notExists"})
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
          err.relativePath = err?.field;
        })
        errors.pushArray(newerrors);
      }
    }
    this.childNodes.forEach(childNode=>{
      return childNode.validate(errors);
    });
  };

  isMandatory() {
    return true;
  }

  getPageNames() {
    if (!this.viewNames) {
      this.viewNames = (Object.values(this.appJson?.app?.views) || [])
          ?.filter(it => it.type === 'page')
          ?.map(it => it?.viewProps?.name)
    }
    return this.viewNames;
  }
  getViewIds = (isValue) => {
    if (isValue)
      return Object.keys(this.appJson?.app?.views || {})?.map(i => i?.viewProps?.name)
    return Object.keys(this.appJson?.app?.views || {});
  }

  getPageIds = (isValue) => {
    if (isValue)
      return Object.values(this.appJson?.app?.views || {}).filter(it => it.type === "page")?.map(i => i?.viewProps?.name || "")
    return Object.values(this.appJson?.app?.views || {}).filter(it => it.type === "page").map(it => {
      return it.id;
    });
  }

  getActions = (isValue) => {
    if (isValue)
      return Object.values(this.appJson?.app?.actionGroups || {})?.map(i => i?.actions?.name)
    return Object.keys(this.appJson?.app?.actionGroups || {});
  }

  getCollections = (isValue) => {
    if (isValue)
      return Object.values(this.appJson?.app?.cardCollections || {})?.map(i => i?.name)
    return Object.keys(this.appJson?.app?.cardCollections || {})
  }

  getOneOfMessage = (names, e) => {
    return `${e?.label || e?.path} one of ${names?.join(', ')}`
  }

  getFormIds = (isValue, filter) => {
    let inComings = Object.values(this.appJson?.app?.integrations?.incoming || {});
    if(filter) inComings = inComings.filter(filter)
    if (isValue)
      return inComings?.map(i => i?.name)
    return inComings?.map(i => i?.id);
  }

  getRoles = (isValue) => {
    if (isValue)
      return Object.values(this.appJson?.app?.roles || {})?.map(i => i?.name)
    return Object.keys(this.appJson?.app?.roles || {});
  }

  getHippoFields = (isValue, filter) => {
    let hippoFields = Object.values(this.appJson?.app?.fieldDefinitions?.hippoFields || {})
    if(filter){
      hippoFields = hippoFields.filter(filter)
    }
    if (isValue){
      return hippoFields?.map(i => i?.id)
    }
    return hippoFields;
  }
  getAllHippoAttachmentFields = () => {
    let hippoFields = this.getHippoFields(true, (hippoField) => hippoField?.type === "attachment")
    return ['c_attachments', ...hippoFields, ...hippoFields.map( h => `card.${h}`),  ...hippoFields.map( h => `parentCard.${h}`)]
  }

  getEnvironments = () => {
    return Object.keys(this.appJson?.app?.environments);
  }

  getComponents = (isValue) => {
    if (isValue)
      return Object.values(this.appJson?.app?.components || {}).map(i => i?.type)
    return Object.keys(this?.data?.components || {});
  }
  getCollectionValidateJson = () => {
    const collections = {
      type: 'array',
      optional: true,
      items: {
        type: 'enum',
        values: this.getCollections()
      }
    }
    const includeArchived = {
      type: 'enum',
      optional: true,
      values: ['all', "archived", "notarchived"]
    }
    return {
      collections,
      includeArchived,
    }
  }
  createValidationError(type, field, actual,expected, expectedMeaningful, message) {
    return {
      type,
      message,
      field,
      actual,
      expectedMeaningful: expectedMeaningful || expected,
      expected
    }
  }
}
