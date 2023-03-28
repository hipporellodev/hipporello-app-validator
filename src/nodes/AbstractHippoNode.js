import JSONUtils from "../JSONUtils";
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

  static RESOLVE_APP_VARS = "appVariables";
  static RESOLVE_SYSTEM = "system";
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
  };
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
    this.actions = actions;
    this.entities = entities;
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
          hippoId: "{{{card.c_parentCardIdObject.tc_listHippoIdObject.hippoId}}}",
          value: "{{{card.c_parentCardIdObject.tc_listHippoIdObject.hippoId}}}",
        },
      ];
    }
    if (onlyIds) {
      return lists?.map((i) => i?.hippoId);
    }
    return lists;
  }
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
  getAppParameters = (onlyId, filter) => {
    let appVariables = Object.values(
      this.appJson?.app?.fieldDefinitions?.appVariableFields || {}
    ).filter((i) => !i?.deleted);
    if (filter) {
      appVariables = appVariables.filter(filter);
    }
    if (onlyId) {
      return appVariables?.map((i) => i?.id);
    }
    return appVariables;
  };
  getHippoFields = (onlyId, filter) => {
    let hippoFields = Object.values(
      this.appJson?.app?.fieldDefinitions?.hippoFields || {}
    ).filter((field) => !field.deleted);
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
        label: "Members",
        type: AbstractHippoNode.RESOLVE_MEMBER_BY_TRELLO_ID,
      },
      {
        id: "card",
        label: "Cards",
        type: AbstractHippoNode.RESOLVE_CARD_BY_CARD_ID,
      },
      {
        id: "user",
        label: "User Fields",
        type: AbstractHippoNode.RESOLVE_USER_BY_USER_ID,
      },
      {
        id: "triggeringUser",
        label: "Triggering User Fields",
        type: AbstractHippoNode.RESOLVE_USER_BY_USER_ID,
        resolveBy: AbstractHippoNode.RESOLVE_USER_BY_USER_ID,
      },
      {
        id: "portal",
        label: "Workspace Fields",
        type: AbstractHippoNode.RESOLVE_PORTAL,
      },
      {
        id: "role",
        label: "Roles & Groups",
        type: AbstractHippoNode.RESOLVE_ROLE_BY_ROLE_BY_ID,
      },
      {
        id: "list",
        label: "List",
        type: AbstractHippoNode.RESOLVE_LIST_BY_HIPPO_ID,
      },
      {
        id: "label",
        label: "Label",
        type: AbstractHippoNode.RESOLVE_LABEL_BY_HIPPO_ID,
      },
      {
        id: "board",
        label: "Board",
        type: AbstractHippoNode.RESOLVE_BOARD_BY_TRELLO_BOARD_ID,
      },
      {
        id: "system",
        label: "System",
        type: AbstractHippoNode.RESOLVE_SYSTEM,
      },
      {
        id: "appVariables",
        label: "App Variables",
        type: AbstractHippoNode.RESOLVE_APP_VARS,
      },
      {
        id: "appVariables",
        label: "App Variables",
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
        label: "Trello Board Order",
        type: "long",
        multiple: false,
        sortable: true,
        onlySortable: true,
      },
      {
        id: "card.c_userId",
        label: "Owner",
        type: "string",
        resolveBy: AbstractHippoNode.RESOLVE_USER_BY_USER_ID,
        multiple: false,
        sortable: true,
      },
      {
        id: "card.c_parentCardId",
        label: "Parent Card",
        type: "string",
        resolveBy: AbstractHippoNode.RESOLVE_CARD_BY_CARD_ID,
        multiple: false,
        sortable: true,
      },
      {
        id: "card.c_id",
        label: "Id",
        type: "string",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.c_boardId",
        label: "Board Id",
        type: "string",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.c_shortId",
        label: "Short Id",
        type: "string",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.tc_closed",
        label: "Is Archived",
        type: "boolean",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.c_insertedAt",
        label: "Creation Time",
        type: "datetime",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.c_updatedAt",
        label: "Last Update Time",
        type: "datetime",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.c_attachments",
        label: "All Trello Attachments",
        type: "attachment",
        multiple: true,
        sortable: false,
      },
      {
        id: "card.c_parentCardId",
        label: "Parent Card",
        type: "string",
        resolveBy: AbstractHippoNode.RESOLVE_CARD_BY_CARD_ID,
        multiple: false,
        sortable: true,
        disabledDisplay: true,
      },
      {
        id: "card.c_coverAttachment",
        label: "Trello Card Cover",
        type: "attachment",
        multiple: false,
        sortable: false,
      },
      {
        id: "card.tc_desc",
        label: "Card Description",
        type: "string",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.tc_name",
        label: "Card Name",
        type: "string",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.label",
        label: "Label",
        type: "string",
        resolveBy: AbstractHippoNode.RESOLVE_LABEL_BY_HIPPO_ID,
        multiple: true,
        sortable: false,
        disabledDisplay: true,
      },
      {
        id: "card.name",
        label: "Card Name",
        type: "string",
        multiple: false,
        sortable: false,
        disabledDisplay: true,
      },
      {
        id: "card.description",
        label: "Card Description",
        type: "string",
        multiple: false,
        sortable: false,
        disabledDisplay: true,
      },
      {
        id: "card.tc_labelHippoIds",
        label: "Labels",
        type: "string",
        multiple: true,
        sortable: false,
      },
      {
        id: "card.tc_labelHippoIds",
        label: "Labels",
        type: "string",
        resolveBy: AbstractHippoNode.RESOLVE_LABEL_BY_HIPPO_ID,
        multiple: true,
        sortable: false,
      },
      {
        id: "card.tc_idMembers",
        label: "Members",
        type: "string",
        multiple: true,
        sortable: false,
      },
      {
        id: "card.tc_idMembers",
        label: "Members",
        type: "string",
        resolveBy: AbstractHippoNode.RESOLVE_MEMBER_BY_TRELLO_ID,
        multiple: true,
        sortable: false,
      },
      {
        id: "card.tc_listHippoId",
        label: "Trello List",
        type: "string",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.tc_listHippoId",
        label: "Trello List",
        type: "string",
        resolveBy: AbstractHippoNode.RESOLVE_LIST_BY_HIPPO_ID,
        multiple: false,
        sortable: true,
      },
      {
        id: "card.tc_startDate",
        label: "Start Date",
        type: "date",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.tc_dueDate",
        label: "Due Date",
        type: "datetime",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.tc_dueDateReminder",
        label: "Due Reminder (Minutes)",
        type: "double",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.tc_dueComplete",
        label: "Due Complete",
        type: "boolean",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.tc_shortUrl",
        label: "Card Short URL",
        type: "string",
        multiple: false,
        sortable: true,
      },
      {
        id: "card.tc_url",
        label: "Card URL",
        type: "string",
        multiple: false,
        sortable: true,
      },
      {
        id: "label.name",
        label: "Label Name",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "label.hippoId",
        label: "ID",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "label.color",
        label: "Color",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "list.name",
        label: "List Name",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "list.hippoId",
        label: "ID",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "member.id",
        label: "Member ID",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "member.fullName",
        label: "Full Name",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "user.id",
        label: "User ID",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "user.name",
        label: "Full Name",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "member.username",
        label: "Username",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "user.firstName",
        label: "First Name",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "user.roleIds",
        label: "Roles & Groups",
        type: "string",
        resolveBy: AbstractHippoNode.RESOLVE_ROLE_BY_ROLE_BY_ID,
        multiple: true,
        sortable: true,
      },
      {
        id: "user.lastName",
        label: "Last Name",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "user.email",
        label: "Email",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "user.emailDomain",
        label: "Email Domain",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "user.tags",
        label: "Segments",
        type: "string",
        multiple: true,
        sortable: false,
      },
      {
        id: "system.currentTimeMillis",
        label: "Current Time",
        type: "datetime",
        multiple: false,
        sortable: false,
      },
      {
        id: "system.environment",
        label: "Environment",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "portal.name",
        label: "Workspace Name",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "portal.url",
        label: "Portal URL",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "board.name",
        label: "Board Name",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "board.desc",
        label: "Board Description",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "portal.name",
        label: "Workspace Name",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "role.name",
        label: "Name",
        type: "string",
        multiple: false,
        sortable: false,
      },
      {
        id: "role.id",
        label: "Role Id",
        type: "string",
        multiple: false,
        sortable: false,
      },
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
  getAccessibleFieldTypes = () => {
    const hippoFields = this.getHippoFields(false);
    const staticFields = this.getStaticFields();
    const appVariables = this.getAppParameters();
    const fieldMap = {};
    staticFields.forEach((staticField) => {
      fieldMap[staticField.id] = staticField;
    });
    hippoFields.forEach((hippoField) => {
      fieldMap["card." + hippoField.id] = {
        id: "card." + hippoField.id,
        type: hippoField.type,
        resolveBy:
          AbstractHippoNode.FIELD_RESOLVE_BY_TO_VALIDATOR[hippoField.resolveBy],
        multiple: hippoField.multiple,
      };
    });

    appVariables.forEach((appVar) => {
      fieldMap["appVariables." + appVar.id] = {
        id: "appVariables." + appVar.id,
        type: appVar.type,
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
