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
  deleted = false;
  initialValidate = true;
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
      this.deleted = !!this.nodeJson?.deleted
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
	findNodeWithPath(path){
		let node = null
		if(path === this.path){
			node =  this;
		} else{
			for (let childNode of this.childNodes) {
				node = childNode.findNodeWithPath(path)
				if(node) break;
			}
		}
		return node;
	}
  validate(errors,path){
	  if(path){
		  const foundNode =	this.findNodeWithPath(path)
		  if(foundNode){
				return foundNode.validate(errors)
		  }else {
				return false;
		  }
	  }
    if (this.checkedPaths[this.path] || this.deleted) {
      return;
    }
    this.checkedPaths[this.path] = true;
    if(!this.exists && this.initialValidate){
      if (this.isMandatory()) {
        errors.push({path: this?.path, type:"notExists"})
      }
      return;
    }
    const validationErrors = this.getValidatorFunction();
    if(validationErrors != null) {
      AbstractHippoNode.counter += 1;
      const validatorFuncResult = validationErrors
      let newerrors =  typeof validatorFuncResult === 'function' ? validatorFuncResult(this.nodeJson) : validatorFuncResult ;
      if(newerrors && Array.isArray(newerrors) && newerrors.length > 0) {
        newerrors.forEach(err => {
          err.path = `${this.validatorPath}.${err.field}`;
          err.relativePath = err?.field;
        })
        errors.pushArray(newerrors);
      }
    }
    if(!this.exists) return;
    this.childNodes.forEach(childNode=>{
      return childNode.validate(errors);
    });
  };

  isMandatory() {
    return true;
  }

  getApps(isValue, filter){
    let apps =  this.entities?.apps ||[]
    if(filter){
      apps = apps.filter(filter)
    }
    if(isValue){
      return apps.map( app => app?.id)
    }
    return apps
  }
  getPageNames() {
    if (!this.viewNames) {
      this.viewNames = (Object.values(this.appJson?.app?.views) || [])
          ?.filter(it => it.type === 'page')
          ?.map(it => it?.viewProps?.name)
    }
    return this.viewNames;
  }
  getViewIds = (onlyId = true, filter) => {
    let views = Object.values(this.appJson?.app?.views || {}).filter(it => !it.deleted);
    if(typeof filter === "function"){
      views = views.filter(filter)
    }
    if (onlyId)
      return views.map(i => i?.id)
    return views
  }

  getPageIds = (isValue) => {
    if (isValue)
      return Object.values(this.appJson?.app?.views || {}).filter(it => it.type === "page" && !it.deleted)?.map(i => i?.viewProps?.name || "")
    return Object.values(this.appJson?.app?.views || {}).filter(it => it.type === "page" && !it.deleted).map(it => {
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
      return Object.values(this.appJson?.app?.cardCollections || {})
    return Object.keys(this.appJson?.app?.cardCollections || {})
  }
  getAutomations = (onlyId = false, filter) => {
    let automations = Object.values(this.appJson?.app?.automations || {}).filter(field => !field.deleted)
    if(filter){
      automations = automations.filter(filter)
    }
    return onlyId ? automations?.map(i => i?.id) : automations
  }
  getOneOfMessage = (names, e) => {
    return `${e?.label || e?.path} one of ${names?.join(', ')}`
  }

  getFormIds = (isValue, filter) => {
    let inComings = Object.values(this.appJson?.app?.integrations?.incoming || {}).filter(ic => !ic.deleted);
    if(filter) inComings = inComings.filter(filter)
    if (isValue)
      return inComings
    return inComings?.map(i => i?.id);
  }

  getRoles = (isValue) => {
    if (isValue)
      return Object.values(this.appJson?.app?.roles || {})?.map(i => i?.name)
    return Object.keys(this.appJson?.app?.roles || {});
  }
	getAppParameters = (onlyId, filter) => {
		let appVariables = Object.values(this.appJson?.app?.fieldDefinitions?.appVariableFields || {}).filter(i => !i?.deleted)
		if(filter){
			appVariables = appVariables.filter(filter)
		}
		if (onlyId){
			return appVariables?.map(i => i?.id)
		}
		return appVariables;
	}
  getHippoFields = (onlyId, filter) => {
    let hippoFields = Object.values(this.appJson?.app?.fieldDefinitions?.hippoFields || {}).filter(field => !field.deleted)
    if(filter){
      hippoFields = hippoFields.filter(filter)
    }
    if (onlyId){
      return hippoFields?.map(i => i?.id)
    }
    return hippoFields;
  }
	getStaticFields = () => {
		return [
			{
				"id": "c_id",
				"label": "Card Id",
				"type": "string",
				"multiple": false
			},
			{
				"id": "c_boardId",
				"label": "Card Board Id",
				"type": "string",
				"multiple": false
			},
			{
				"id": "c_shortId",
				"label": "Card Short Id",
				"type": "string",
				"multiple": false
			},
			{
				"id": "tc_closed",
				"label": "Is Archived",
				"type": "boolean",
				"multiple": false
			},
			{
				"id": "c_insertedAt",
				"label": "Card Creation Time",
				"type": "datetime",
				"multiple": false
			},
			{
				"id": "c_updatedAt",
				"label": "Card Last Update Time",
				"type": "datetime",
				"multiple": false
			},
			{
				"id": "c_attachments",
				"label": "All Trello Attachments",
				"type": "attachment",
				"multiple": true
			},
			{
				"id": "c_parentCardId",
				"label": "Parent Card Id",
				"type": "string",
				"multiple": false
			},
			{
				"id": "tc_desc",
				"label": "Trello Card Description",
				"type": "string",
				"multiple": false
			},
			{
				"id": "tc_name",
				"label": "Trello Card Name",
				"type": "string",
				"multiple": false
			},
			{
				"id": "tc_labelHippoIds",
				"label": "Trello Labels",
				"type": "string",
				"multiple": true
			},
			{
				"id": "tc_labelHippoIdsObject.name",
				"label": "Trello Label Names",
				"type": "string",
				"multiple": true
			},
			{
				"id": "tc_idMembers",
				"label": "Trello Card Members",
				"type": "string",
				"multiple": true
			},
			{
				"id": "tc_idMembersObject.fullName",
				"label": "Trello Card Member Names",
				"type": "string",
				"multiple": true
			},
			{
				"id": "tc_listHippoId",
				"label": "Trello List",
				"type": "string",
				"multiple": false
			},
			{
				"id": "tc_listHippoIdObject.name",
				"label": "Trello List Name",
				"type": "string",
				"multiple": false
			},
			{
				"id": "tc_startDate",
				"label": "Card Start Date",
				"type": "date",
				"multiple": false
			},
			{
				"id": "tc_dueDate",
				"label": "Card Due Date",
				"type": "datetime",
				"multiple": false
			},
			{
				"id": "tc_dueDateReminder",
				"label": "Card Due Reminder (Minutes)",
				"type": "double",
				"multiple": false
			},
			{
				"id": "tc_dueComplete",
				"label": "Card Due Complete",
				"type": "boolean",
				"multiple": false
			},
			{
				"id": "tc_shortUrl",
				"label": "Trello Card Short URL",
				"type": "string",
				"multiple": false
			},
			{
				"id": "tc_url",
				"label": "Trello Card URL",
				"type": "string",
				"multiple": false
			},
			{
				"id": "user.name",
				"label": "User Full Name",
				"type": "string",
				"multiple": false
			},
			{
				"id": "user.id",
				"label": "User ID",
				"type": "string",
				"multiple": false
			},
			{
				"id": "user.firstName",
				"label": "User Firstname",
				"type": "string",
				"multiple": false
			},
			{
				"id": "user.lastName",
				"label": "User Lastname",
				"type": "string",
				"multiple": false
			},
			{
				"id": "user.email",
				"label": "User Email",
				"type": "string",
				"multiple": false
			},
			{
				"id": "user.emailDomain",
				"label": "User Email Domain",
				"type": "string",
				"multiple": false
			},{
				"id": "user.tags",
				"label":"User Segments",
				"type": "string",
				"multiple": true
			},
			{
				"id": "system.currentTimeMillis",
				"label": "Current Time",
				"type": "datetime",
				"multiple": false
			},
			{
				"id": "system.environment",
				"label": "Current Environment",
				"type": "string",
				"multiple": false
			},
			{
				"id": "cardOwner.name",
				"label": "Card Owner Full Name",
				"type": "string",
				"multiple": false
			},
			{
				"id": "cardOwner.id",
				"label": "Card Owner ID",
				"type": "string",
				"multiple": false
			},
			{
				"id": "cardOwner.firstName",
				"label": "Card Owner Firstname",
				"type": "string",
				"multiple": false
			},
			{
				"id": "cardOwner.lastName",
				"label": "Card Owner Lastname",
				"type": "string",
				"multiple": false
			},
			{
				"id": "cardOwner.email",
				"label": "Card Owner Email",
				"type": "string",
				"multiple": false
			},
			{
				"id": "cardOwner.emailDomain",
				"label": "Card Owner Email Domain",
				"type": "string",
				"multiple": false
			},
			{
				"id": "cardOwner.tags",
				"label": "Card Owner Segments",
				"type": "string",
				"multiple": true
			},
			{
				"id": "c_userIdObject.name",
				"label": "Card Owner Full Name",
				"type": "string",
				"multiple": false
			},
			{
				"id": "c_userIdObject.id",
				"label": "Card Owner ID",
				"type": "string",
				"multiple": false
			},
			{
				"id": "c_userIdObject.firstName",
				"label":"Card Owner Firstname",
				"type": "string",
				"multiple": false
			},
			{
				"id": "c_userIdObject.lastName",
				"label": "Card Owner Lastname",
				"type": "string",
				"multiple": false
			},
			{
				"id": "c_userIdObject.email",
				"label": "Card Owner Email",
				"type": "string",
				"multiple": false
			},
			{
				"id": "c_userIdObject.emailDomain",
				"label": "Card Owner Email Domain",
				"type": "string",
				"multiple": false
			},
			{
				"id": "c_userIdObject.tags",
				"label": "Card Owner Segments",
				"type": "string",
				"multiple": true
			},
			{
				"id": "triggeringUser.name",
				"label": "Triggering User Full Name",
				"type": "string",
				"multiple": false
			},
			{
				"id": "triggeringUser.id",
				"label":"Triggering User ID",
				"type": "string",
				"multiple": false
			},
			{
				"id": "triggeringUser.firstName",
				"label": "Triggering Firstname",
				"type": "string",
				"multiple": false
			},
			{
				"id": "triggeringUser.lastName",
				"label": "Triggering Lastname",
				"type": "string",
				"multiple": false
			},
			{
				"id": "triggeringUser.email",
				"label": "Triggering User Email",
				"type": "string",
				"multiple": false
			},
			{
				"id": "triggeringUser.emailDomain",
				"label": "Triggering User Email Domain",
				"type": "string",
				"multiple": false
			},
			{
				"id": "triggeringUser.tags",
				"label": "Triggering User Segments",
				"type": "string",
				"multiple": true
			},
			{
				"id": "portal.name",
				"label": "Workspace Name",
				"type": "string",
				"multiple": false
			},
			{
				"id": "portal.url",
				"label": "Workspace URL",
				"type": "string",
				"multiple": false
			},
			{
				"id": "board.name",
				"label": "Board Name",
				"type": "string",
				"multiple": false
			},
			{
				"id": "board.desc",
				"label": "Board Description",
				"type": "string",
				"multiple": false
			},
			{
				"id": "portal.name",
				"label": "Workspace Name",
				"type": "string",
				multiple: false
			}
		]
	}
	getCardFieldsWithContext = (contexts = ['parentCard', 'card'], isValue, filter) => {
		const hippoFields = this.getHippoFields(false)
		const staticFields = this.getStaticFields()
		const appVariables = this.getAppParameters()
		let allFieldsList = [...hippoFields, ...staticFields, ...appVariables];
		if(filter){
			allFieldsList = allFieldsList.filter(filter)
		}
		let allFields = {};
		allFieldsList.forEach((value) => {
			if (value.id.startsWith("tc_") || value.id.startsWith("hf_") || value.id.startsWith("c_")) {
				contexts.forEach(context => {
					let name = context + "." + value?.id;
					allFields[name] = {
						...value,
						field: name,
					};
				})
			} else {
				allFields[value?.id] = value;
			}
		});
		if (isValue){
			return Object.keys(allFields)
		}
		return allFields
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
