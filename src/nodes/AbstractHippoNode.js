import JSONUtils from "../JSONUtils";
import {TransText} from "../localize/localize";
Array.prototype.pushArray = function (items) {
  if (!Array.isArray(items)) {
    return this;
  }
  this.splice(this.length, 0, ...items);
  return this;
};
export default class AbstractHippoNode {
  static RESOLVE_LIST_BY_HIPPO_ID = "list";
  static RESOLVE_LABEL_BY_HIPPO_ID = "label";
  static RESOLVE_MEMBER_BY_TRELLO_ID = "member";
  static RESOLVE_USER_BY_USER_ID = "user";
  static RESOLVE_BOARD_BY_TRELLO_BOARD_ID = "board";
  static RESOLVE_CARD_BY_CARD_ID = "card";
  static RESOLVE_ROLE_BY_ROLE_BY_ID = "role";
  static RESOLVE_APP_BY_APP_ID = "app";
  static RESOLVE_FIELD_DEFINITION_BY_ID = "field";
  static RESOLVE_CUSTOM_FIELD_ITEM_BY_TRELLO_ID = "ref_cfdditem"
  static RESOLVE_COLOR_BY_CUSTOM_FIELD_ITEM_COLOR = "color"
  static RESOLVE_CHECKLIST_BY_HIPPO_ID = "checklist"

  static RESOLVE_APP_VARS = "appVariables";
  static RESOLVE_SYSTEM = "system";
  static RESOLVE_TRIGGER = "trigger";
  static RESOLVE_PORTAL = "portal";
  static RESOLVE_FORM = "form";

  static FIELD_RESOLVE_BY_TO_VALIDATOR = {
    RESOLVE_LIST_BY_HIPPO_ID: AbstractHippoNode.RESOLVE_LIST_BY_HIPPO_ID,
    RESOLVE_LABEL_BY_HIPPO_ID: AbstractHippoNode.RESOLVE_LABEL_BY_HIPPO_ID,
    RESOLVE_MEMBER_BY_TRELLO_ID: AbstractHippoNode.RESOLVE_MEMBER_BY_TRELLO_ID,
    RESOLVE_USER_BY_USER_ID: AbstractHippoNode.RESOLVE_USER_BY_USER_ID,
    RESOLVE_BOARD_BY_TRELLO_BOARD_ID:
      AbstractHippoNode.RESOLVE_BOARD_BY_TRELLO_BOARD_ID,
    RESOLVE_CARD_BY_CARD_ID: AbstractHippoNode.RESOLVE_CARD_BY_CARD_ID,
    RESOLVE_ROLE_BY_ROLE_BY_ID: AbstractHippoNode.RESOLVE_ROLE_BY_ROLE_BY_ID,
    RESOLVE_APP_BY_APP_ID: AbstractHippoNode.RESOLVE_APP_BY_APP_ID,
    RESOLVE_FIELD_DEFINITION_BY_ID: AbstractHippoNode.RESOLVE_FIELD_DEFINITION_BY_ID,
    RESOLVE_CUSTOM_FIELD_ITEM_BY_TRELLO_ID: AbstractHippoNode.RESOLVE_CUSTOM_FIELD_ITEM_BY_TRELLO_ID,
    RESOLVE_COLOR_BY_CUSTOM_FIELD_ITEM_COLOR: ""
  };
  static counter;
  childNodes = [];
  path;
  id;
  appJson;
  exists;
  validatorPath;
  deleted = false;
  initialValidate = true;
  checkedPaths = {};
  lists = [];
  members = [];
  entries = []
  actions = []
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
    this.jsonPatchPath = path
      ? "/" +
        path
          .replace(/"/g, "")
          .replace(/]/g, "")
          .replace(/\[/g, ".")
          .replace(/\./g, "/")
      : null;
    if (!AbstractHippoNode.counter) {
      AbstractHippoNode.counter = 0;
    }
  }
  init(actions, entities) {
    if(actions) this.actions = actions;
    if(entities) this.entities = entities;
    this.entitiesIds = {
      trelloLists: (this.entities?.trelloLists || [])?.map((i) => i?.hippoId),
      trelloLabels: (this.entities?.trelloLabels || [])?.map((i) => i?.hippoId),
    };
    this.childNodes = [];
    this.nodeJson = JSONUtils.query(this.appJson, this.path);
    if (this.nodeJson) {
      this.id = this.generateNodeId(this.nodeJson);
      this.deleted = !!this.nodeJson?.deleted;
      this.process(this.appJson, this.path, this.nodeJson);
      this.childNodes.forEach((childNode) => {
        childNode.init(this.actions, this.entities);
      });
    } else {
      this.exists = false;
    }
  }

  generateNodeId(nodeJson) {
    return nodeJson.id;
  }
  addChildNode(node) {
    node.parentNode = this;
    this.childNodes.push(node);
  }
  process(appJson, path, nodeJson) {}

  getValidatorFunction() {
    return (data) => {};
  }
  findNodeWithPath(path) {
    let node = null;
    if (path === this.path) {
      node = this;
    } else {
      for (let childNode of this.childNodes) {
        node = childNode.findNodeWithPath(path);
        if (node) break;
      }
    }
    return node;
  }
  validate(errors, path) {
    if (path) {
      const foundNode = this.findNodeWithPath(path);
      if (foundNode) {
        return foundNode.validate(errors);
      } else {
        return false;
      }
    }
    if (this.checkedPaths[this.path] || this.deleted) {
      return;
    }
    this.checkedPaths[this.path] = true;
    if (!this.exists && this.initialValidate) {
      if (this.isMandatory()) {
        errors.push({ path: this?.path, type: "notExists" });
      }
      return;
    }
    const validationErrors = this.getValidatorFunction();
    if (validationErrors != null) {
      AbstractHippoNode.counter += 1;
      const validatorFuncResult = validationErrors;
      let newerrors =
        typeof validatorFuncResult === "function"
          ? validatorFuncResult(this.nodeJson)
          : validatorFuncResult;
      if (newerrors && Array.isArray(newerrors) && newerrors.length > 0) {
        newerrors.forEach((err) => {
          err.path = err.path ? err.path : `${this.validatorPath}.${err.field}`;
          err.relativePath = err?.field;
        });
        errors.pushArray(newerrors);
      }
    }
    if (!this.exists) return;
    this.childNodes.forEach((childNode) => {
      return childNode.validate(errors);
    });
  }

  isMandatory() {
    return true;
  }

  getApps(isValue, filter) {
    let apps = this.entities?.apps || [];
    if (filter) {
      apps = apps.filter(filter);
    }
    if (isValue) {
      return apps.map((app) => app?.id);
    }
    return apps;
  }
  getTrelloList(onlyIds = true, hasParent = false, onlyActives = true) {
    let lists = this.entities?.trelloLists || [];
    if (onlyActives) {
      lists = (lists || [])?.filter((i) => !i?.closed);
    }
    if (hasParent) {
      lists = [
        ...lists,
        {
          hippoId:
            "{{{card.c_parentCardIdObject.tc_listHippoIdObject.hippoId}}}",
          value: "{{{card.c_parentCardIdObject.tc_listHippoIdObject.hippoId}}}",
        },
      ];
    }
    if (onlyIds) {
      return lists?.map((i) => i?.hippoId);
    }
    return lists;
  }
  getTrelloLabels(onlyIds = false, onlyActives = true){
    let labels = this.entities?.trelloLabels || [];
    if (onlyActives) {
      labels = (labels || [])?.filter((i) => !i?.deleted);
    }
    if (onlyIds) {
      return labels?.map((i) => i?.hippoId);
    }
    return  labels;
  }
  getTrelloMembers(onlyIds = false, onlyActives){
    let members = this.entities?.members || [];
    if (onlyActives) {
      members = (members || [])?.filter((i) => !i?.deleted);
    }
    if (onlyIds) {
      return members?.map((i) => i?.id);
    }
    return  members.map((member) => ({...member, label: member?.fullName}));
  }
  getFieldDefinitions = (onlyId) => {
    const appVariables = this?.appJson.app?.fieldDefinitions?.appVariableFields || {};
    const customFields = this.getCustomFields(false).reduce((acc, item) => {
      acc[item?.hippoId] = item;
      return acc;
    }, {})
    const hippoFields = this.appJson.app?.fieldDefinitions?.hippoFields;
    const allFields = {...appVariables, ...hippoFields, ...customFields}
    if (!onlyId)
      return Object.values(allFields)?.map((i) => i?.label);
    return Object.keys(allFields);
  };
  getPageNames() {
    if (!this.viewNames) {
      this.viewNames = (Object.values(this.appJson?.app?.views) || [])
        ?.filter((it) => it.type === "page")
        ?.map((it) => it?.viewProps?.name);
    }
    return this.viewNames;
  }
  getViewIds = (onlyId = true, filter) => {
    let views = Object.values(this.appJson?.app?.views || {}).filter(
      (it) => !it.deleted
    );
    if (typeof filter === "function") {
      views = views.filter(filter);
    }
    if (onlyId) return views.map((i) => i?.id);
    return views;
  };

  getPageIds = (isValue) => {
    if (isValue)
      return Object.values(this.appJson?.app?.views || {})
        .filter((it) => it.type === "page" && !it.deleted)
        ?.map((i) => i?.viewProps?.name || "");
    return Object.values(this.appJson?.app?.views || {})
      .filter((it) => it.type === "page" && !it.deleted)
      .map((it) => {
        return it.id;
      });
  };

  getActions = (isValue) => {
    if (isValue)
      return Object.values(this.appJson?.app?.actionGroups || {})?.map(
        (i) => i?.actions?.name
      );
    return Object.keys(this.appJson?.app?.actionGroups || {});
  };

  getCollections = (onlyId = true, filter) => {
    let collections = Object.values(
      this.appJson?.app?.cardCollections || {}
    ).filter((field) => !field.deleted);
    if (filter) {
      collections = collections.filter(filter);
    }
    return onlyId ? collections?.map((i) => i?.id) : collections;
  };
  getAutomations = (onlyId = false, filter) => {
    let automations = Object.values(
      this.appJson?.app?.automations || {}
    ).filter((field) => !field.deleted);
    if (filter) {
      automations = automations.filter(filter);
    }
    return onlyId ? automations?.map((i) => i?.id) : automations;
  };
  getOneOfMessage = (names, e) => {
    return `${e?.label || e?.path} one of ${names?.join(", ")}`;
  };

  getFormIds = (isValue, filter) => {
    let inComings = Object.values(
      this.appJson?.app?.integrations?.incoming || {}
    ).filter((ic) => !ic.deleted);
    if (filter) inComings = inComings.filter(filter);
    if (isValue) return inComings;
    return inComings?.map((i) => i?.id);
  };

  getRoles = (isValue) => {
    const roles = Object.values(this.appJson?.app?.roles || {}).filter(
      (i) => !i?.deleted
    );
    if (isValue) return roles?.map((i) => i?.id);
    return roles;
  };
  getCustomFields = (onlyId, filter, showDeleted) => {
    let customFields = (this.entities?.customFields || []).map(item => ({...item, id: item?.hippoId}))
    if (filter) {
      customFields = customFields.filter(filter);
    }
    if(onlyId) return customFields.map(i => i?.hippoId);
    return customFields;
  }
  getAppParameters = (onlyId, filter, showDeleted) => {
    let appVariables = Object.values(
      this.appJson?.app?.fieldDefinitions?.appVariableFields || {}
    );
    if (!showDeleted) appVariables = appVariables.filter((i) => !i?.deleted);
    if (filter) {
      appVariables = appVariables.filter(filter);
    }
    if (onlyId) {
      return appVariables?.map((i) => i?.id);
    }
    return appVariables;
  };
  getHippoFields = (onlyId, filter, showDeleted) => {
    let hippoFields = Object.values(
      this.appJson?.app?.fieldDefinitions?.hippoFields || {}
    );
    if (!showDeleted) hippoFields = hippoFields.filter((i) => !i?.deleted);
    if (filter) {
      hippoFields = hippoFields.filter(filter);
    }
    if (onlyId) {
      return hippoFields?.map((i) => i?.id);
    }
    return hippoFields;
  };
  getStaticFields = () => {
    return [
      {
        id: "member",
        label: TransText.getTranslate("members"),
        type: AbstractHippoNode.RESOLVE_MEMBER_BY_TRELLO_ID,
      },
      {
        id: "card",
        label: TransText.getTranslate("cards"),
        type: AbstractHippoNode.RESOLVE_CARD_BY_CARD_ID,
      },
      {
        id: "user",
        label: TransText.getTranslate("userFields"),
        type: AbstractHippoNode.RESOLVE_USER_BY_USER_ID,
      },
      {
        id: "triggeringUser",
        label: TransText.getTranslate("triggeringUserFields"),
        type: AbstractHippoNode.RESOLVE_USER_BY_USER_ID,
        resolveBy: AbstractHippoNode.RESOLVE_USER_BY_USER_ID,
      },
      {
        id: "portal",
        label: TransText.getTranslate("workspaceFields"),
        type: AbstractHippoNode.RESOLVE_PORTAL,
      },
      {
        id: "role",
        label: TransText.getTranslate("rolesGroups"),
        type: AbstractHippoNode.RESOLVE_ROLE_BY_ROLE_BY_ID,
      },
      {
        id: "list",
        label: TransText.getTranslate("list"),
        type: AbstractHippoNode.RESOLVE_LIST_BY_HIPPO_ID,
      },
      {
        id: "label",
        label: TransText.getTranslate("label"),
        type: AbstractHippoNode.RESOLVE_LABEL_BY_HIPPO_ID,
      },
      {
        id: "checklist",
        label: TransText.getTranslate("checklist"),
        type: AbstractHippoNode.RESOLVE_CHECKLIST_BY_HIPPO_ID,
      },
      {
        id: "board",
        label: TransText.getTranslate("board"),
        type: AbstractHippoNode.RESOLVE_BOARD_BY_TRELLO_BOARD_ID,
      },
      {
        id: "system",
        label: TransText.getTranslate("system"),
        type: AbstractHippoNode.RESOLVE_SYSTEM,
      },
      {
        id: "app",
        label: TransText.getTranslate("powerUp"),
        type: AbstractHippoNode.RESOLVE_SYSTEM,
      },
      {
        id: "trigger",
        label: TransText.getTranslate("trigger"),
        type: AbstractHippoNode.RESOLVE_TRIGGER,
      },
      {
        id: "appVariables",
        label: TransText.getTranslate("appVariables"),
        type: AbstractHippoNode.RESOLVE_APP_VARS,
      },
      {
        id: "appVariables",
        label: TransText.getTranslate("appVariables"),
        type: AbstractHippoNode.RESOLVE_PORTAL,
      },

      // {
      //   "id": "tc_pos",
      //   "label": "Trello Card Position",
      //   "type": "long",
      //   "multiple": false,
      //   "sortable": true
      // },
      {
        id: "card.c_boardOrder",
        label: TransText.getTranslate("trelloBoardOrder"),
        type: "long",
        multiple: false,
        sortable: true,
        onlySortable: true,
      },
      {
        id: "card.c_userId",
        label: TransText.getTranslate("owner"),
        type: "string",
        resolveBy: AbstractHippoNode.RESOLVE_USER_BY_USER_ID,
        multiple: false,
        sortable: true,
      },
      {
        id: "card.c_parentCardId",
        label: TransText.getTranslate("parentCard"),
        type: "string",
        resolveBy: AbstractHippoNode.RESOLVE_CARD_BY_CARD_ID,
        multiple: false,
        sortable: true,
      },
      {
        id: "card.c_id",
        label: TransText.getTranslate("ID"),
        type: "string",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.c_boardId",
        label: TransText.getTranslate("boardId"),
        type: "string",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.c_shortId",
        label: TransText.getTranslate("shortId"),
        type: "string",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.tc_closed",
        label: TransText.getTranslate("isArchived"),
        type: "boolean",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.c_insertedAt",
        label: TransText.getTranslate("creationTime"),
        type: "datetime",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.c_updatedAt",
        label: TransText.getTranslate("lastUpdateTime"),
        type: "datetime",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.c_attachments",
        label: TransText.getTranslate("allTrelloAttachments"),
        type: "attachment",
        multiple: true,
        sortable: false,
      },
      {
        id: "card.c_parentCardId",
        label: TransText.getTranslate("parentCard"),
        type: "string",
        resolveBy: AbstractHippoNode.RESOLVE_CARD_BY_CARD_ID,
        multiple: false,
        sortable: true,
        disabledDisplay: true,
      },
      {
        id: "card.c_coverAttachment",
        label: TransText.getTranslate("trelloCardCover"),
        type: "attachment",
        multiple: false,
        sortable: false,
      },
      {
        id: "card.c_ticketId",
        label: TransText.getTranslate("cardTicketId"),
        type: "string",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.tc_desc",
        label: TransText.getTranslate("cardDescription"),
        type: "string",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.tc_name",
        label: TransText.getTranslate("cardName"),
        type: "string",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.label",
        label: TransText.getTranslate("label"),
        type: "string",
        resolveBy: AbstractHippoNode.RESOLVE_LABEL_BY_HIPPO_ID,
        multiple: true,
        sortable: false,
        disabledDisplay: true,
      },
      {
        id: "card.name",
        label: TransText.getTranslate("cardName"),
        type: "string",
        multiple: false,
        sortable: false,
        disabledDisplay: true,
      },
      {
        id: "card.description",
        label: TransText.getTranslate("cardDescription"),
        type: "string",
        multiple: false,
        sortable: false,
        disabledDisplay: true,
      },
      {
        id: "card.tc_labelHippoIds",
        label: TransText.getTranslate("labels"),
        type: "string",
        multiple: true,
        sortable: false,
      },
      {
        id: "card.tc_checklistHippoIds",
        label: TransText.getTranslate("checklists"),
        type: "string",
        multiple: true,
        sortable: false,
      },
      {
        id: "card.tc_checklistHippoIds",
        label: TransText.getTranslate("checklists"),
        type: "string",
        resolveBy: AbstractHippoNode.RESOLVE_CHECKLIST_BY_HIPPO_ID,
        multiple: true,
        sortable: false,
      },
      {
        id: "card.tc_labelHippoIds",
        label: TransText.getTranslate("labels"),
        type: "string",
        resolveBy: AbstractHippoNode.RESOLVE_LABEL_BY_HIPPO_ID,
        multiple: true,
        sortable: false,
      },
      {
        id: "card.tc_idMembers",
        label: TransText.getTranslate("members"),
        type: "string",
        multiple: true,
        sortable: false,
      },
      {
        id: "card.tc_idMembers",
        label: TransText.getTranslate("members"),
        type: "string",
        resolveBy: AbstractHippoNode.RESOLVE_MEMBER_BY_TRELLO_ID,
        multiple: true,
        sortable: false,
      },
      {
        id: "card.tc_listHippoId",
        label: TransText.getTranslate("trelloList"),
        type: "string",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.tc_listHippoId",
        label: TransText.getTranslate("trelloList"),
        type: "string",
        resolveBy: AbstractHippoNode.RESOLVE_LIST_BY_HIPPO_ID,
        multiple: false,
        sortable: true,
      },
      {
        id: "card.tc_startDate",
        label: TransText.getTranslate("startDate"),
        type: "date",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.tc_dueDate",
        label: TransText.getTranslate("dueDate"),
        type: "datetime",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.tc_dueDateReminder",
        label: TransText.getTranslate("dueReminderMinutes"),
        type: "double",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.tc_dueComplete",
        label: TransText.getTranslate("dueComplete"),
        type: "boolean",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.tc_shortUrl",
        label: TransText.getTranslate("cardShortURL"),
        type: "string",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.tc_url",
        label: TransText.getTranslate("cardURL"),
        type: "string",
        multiple: false,
        sortable: true,
      },
      {
        id: "label.name",
        label: TransText.getTranslate("labelName"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "label.hippoId",
        label: TransText.getTranslate("ID"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "label.color",
        label: TransText.getTranslate("color"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "checklist.name",
        label: TransText.getTranslate("checklistName"),
        type: "string",
        multiple: false,
        sortable: false
      },
      {
        id: "checklist.hippoId",
        label: "ID",
        type: "string",
        multiple: false,
        sortable: false
      },
      {
        id: "list.name",
        label: TransText.getTranslate("listName"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "list.hippoId",
        label: TransText.getTranslate("ID"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "member.id",
        label: TransText.getTranslate("memberID"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "member.fullName",
        label: TransText.getTranslate("fullName"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "user.id",
        label: TransText.getTranslate("userID"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "user.name",
        label: TransText.getTranslate("fullName"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "member.username",
        label: TransText.getTranslate("username"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "user.firstName",
        label: TransText.getTranslate("firstName"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "user.roleIds",
        label: TransText.getTranslate("rolesGroups"),
        type: "string",
        resolveBy: AbstractHippoNode.RESOLVE_ROLE_BY_ROLE_BY_ID,
        multiple: true,
        sortable: true,
      },
      {
        id: "user.lastName",
        label: TransText.getTranslate("lastName"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "user.email",
        label: TransText.getTranslate("email"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "user.emailDomain",
        label: TransText.getTranslate("emailDomain"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "user.tags",
        label: TransText.getTranslate("segments"),
        type: "string",
        multiple: true,
        sortable: false,
      },
      {
        id: "user.loggedIn",
        label: TransText.getTranslate("loggedIn"),
        type: "boolean",
        multiple: false,
        sortable: false,
      },
      {
        id: "system.currentTimeMillis",
        label: TransText.getTranslate("currentTime"),
        type: "datetime",
        multiple: false,
        sortable: false,
      },
      {
        id: "system.environment",
        label: TransText.getTranslate("environment"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "trigger.comment",
        label: TransText.getTranslate("comment"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "trigger.date",
        label: TransText.getTranslate("triggerDate"),
        type: "datetime",
        multiple: false,
        sortable: false,
      },
      {
        id: "portal.name",
        label: TransText.getTranslate("workspaceName"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "portal.url",
        label: TransText.getTranslate("portalURL"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "portal.consoleUrl",
        label: TransText.getTranslate("hipporelloConsoleURL"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "board.name",
        label: TransText.getTranslate("boardName"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "board.desc",
        label: TransText.getTranslate("boardDescription"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "portal.name",
        label: TransText.getTranslate("workspaceName"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "role.name",
        label: TransText.getTranslate("name"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "role.id",
        label: TransText.getTranslate("roleId"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "trigger.comment",
        label: TransText.getTranslate("comment"),
        type: "string",
        multiple: false,
        sortable: false
      },
      {
        id: "trigger.date",
        label: TransText.getTranslate("triggerDate"),
        type: "datetime",
        multiple: false,
        sortable: false
      },
      {
        id: "field.id",
        label: TransText.getTranslate("ID"),
        type: "string",
        multiple: false,
        sortable: false
      },
      {
        id: "field.name",
        label: TransText.getTranslate("name"),
        type: "string",
        multiple: false,
        sortable: false
      },
      {
        id: "app.name",
        label: TransText.getTranslate("powerUpName"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "app.url",
        label: TransText.getTranslate("powerUpURL"),
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "ref_cfdditem.id",
        label: TransText.getTranslate("ID"),
        type: "string",
        multiple: false,
        sortable: false
      },
      {
        id: "ref_cfdditem.name",
        label: TransText.getTranslate("name"),
        type: "string",
        multiple: false,
        sortable: false
      },
      {
        id: "ref_cfdditem.color",
        label: TransText.getTranslate("color"),
        type: "string",
        multiple: false,
        sortable: false,
        resolveBy: AbstractHippoNode.RESOLVE_COLOR_BY_CUSTOM_FIELD_ITEM_COLOR
      }
    ];
  };
  getObjectKey = (field) => {
    let objectKey = field.id;
    if (field?.resolveBy) {
      objectKey = objectKey + "Object";
      if (field.multiple) {
        // objectKey += "[]";
      }
    }
    return objectKey;
  };
  getAccessibleFieldTypes = (showDeleted = false) => {
    const hippoFields = this.getHippoFields(false, null, showDeleted);
    const staticFields = this.getStaticFields();
    const appVariables = this.getAppParameters(false, null, showDeleted);
    const customFields = this.getCustomFields(false, null, showDeleted);
    const fieldMap = {};
    staticFields.forEach((staticField) => {
      fieldMap[staticField.id] = staticField;
    });
    hippoFields.forEach((hippoField) => {
      fieldMap["card." + hippoField.id] = {
        id: "card." + hippoField.id,
        type: hippoField.type,
        label: hippoField.label,
        resolveBy:
          AbstractHippoNode.FIELD_RESOLVE_BY_TO_VALIDATOR[hippoField.resolveBy],
        multiple: hippoField.multiple,
      };
    });

    appVariables.forEach((appVar) => {
      fieldMap["appVariables." + appVar.id] = {
        id: "appVariables." + appVar.id,
        type: appVar.type,
        label: appVar.label,
        resolveBy:
          AbstractHippoNode.FIELD_RESOLVE_BY_TO_VALIDATOR[appVar.resolveBy],
        multiple: appVar.multiple,
      };
    });
    customFields.forEach((appVar) => {
      fieldMap["card.cf_" + appVar.id] = {
        id: "card.cf_" + appVar.id,
        type: appVar.type,
        label: appVar.label,
        resolveBy:
          AbstractHippoNode.FIELD_RESOLVE_BY_TO_VALIDATOR[appVar.resolveBy],
        multiple: appVar.multiple,
      };
    });
    let allFieldsMap = {};
    Object.values(fieldMap).forEach((item) => {
      allFieldsMap[item?.id] = item;
      if (item?.resolveBy) {
        let objectKey = this.getObjectKey(item);
        allFieldsMap[objectKey] = {
          ...item,
          id: objectKey,
        };
      }
    });
    return allFieldsMap;
  };
  getCardFieldsWithContext = (
    contexts = ["parentCard", "card"],
    isValue,
    filter
  ) => {
    const hippoFields = this.getHippoFields(false);
    const staticFields = this.getStaticFields();
    const appVariables = this.getAppParameters().map((item) => ({
      ...item,
      id: "appVariables." + item?.id,
    }));
    let allFieldsList = [...hippoFields, ...staticFields, ...appVariables];
    if (filter) {
      allFieldsList = allFieldsList.filter(filter);
    }
    let allFields = {};
    allFieldsList.forEach((value) => {
      if (
        value.id.startsWith("tc_") ||
        value.id.startsWith("hf_") ||
        value.id.startsWith("c_")
      ) {
        contexts.forEach((context) => {
          let name = context + "." + value?.id;
          allFields[name] = {
            ...value,
            field: name,
          };
        });
      } else {
        allFields[value?.id] = value;
      }
    });
    if (isValue) {
      return Object.keys(allFields);
    }
    return allFields;
  };
  getAllHippoAttachmentFields = () => {
    return this.getCardFieldsWithContext(
      ["card", "parentCard"],
      true,
      (field) => field?.type === "attachment"
    );
  };

  getEnvironments = () => {
    return Object.keys(this.appJson?.app?.environments);
  };

  getComponents = (isValue) => {
    if (isValue)
      return Object.values(this.appJson?.app?.components || {}).map(
        (i) => i?.type
      );
    return Object.keys(this?.data?.components || {});
  };
  getCollectionValidateJson = () => {
    const collections = {
      type: "array",
      optional: true,
      items: {
        type: "enum",
        values: this.getCollections(),
      },
    };
    const includeArchived = {
      type: "enum",
      optional: true,
      values: ["all", "archived", "notarchived"],
    };
    return {
      collections,
      includeArchived,
    };
  };
  createMustacheLabel = (label) => `${"{{{label:" + label + "}}}"}`;
  createValidationError(
    type,
    field,
    actual,
    expected,
    expectedMeaningful,
    message
  ) {
    return {
      type,
      message,
      field,
      actual,
      expectedMeaningful: expectedMeaningful || expected,
      expected,
    };
  }
}
