import AbstractHippoNode from "./AbstractHippoNode";

import EventNode from "./EventNode";
import ChildrenNode from "./Views/ChildrenNode";
import VisibilityNode from "./AccessRights/VisibilityNode";
import getValidator from "../Utils/getValidator";
import {TransText} from "../localize/localize";
import {COMPONENT_TYPES} from "../constants";

const componentScheme = {
  id: "string|empty:false",
  type: {
    type: "enum",
    values: COMPONENT_TYPES,
  },
  viewProps: {
    type: "object",
    optional: true,
    props: {
      name: "string|optional",
      gap: "number|optional",
      align: {
        type: "enum",
        values: ["left", "right", "center"],
        optional: true,
      },
    },
  },
  accessRight: "object|optional",
};
const componentCheck = getValidator().compile(componentScheme);

function formListCheck() {
  const sourceTypes = [
    "all",
    "selected",
    "allCreatingForms",
    "allUpdatingForms",
  ];
  const isSelectedForms = this.nodeJson?.viewProps?.type === "selected";
  const formsOptions = this.getFormIds();
  return getValidator().compile({
    viewType: {
      type: "enum",
      values: ["grid", "list"],
    },
    type: {
      type: "enum",
      values: sourceTypes,
    },
    showDescription: "boolean|optional",
    selectedForms: {
      type: "array",
      optional: !isSelectedForms,
      items: {
        type: "enum",
        values: formsOptions,
      },
    },
  });
}
function appListCheck() {
  const isSelectedApps = this.nodeJson?.viewProps?.type === "selected";
  const appsOptions = this.getApps(true);
  return getValidator().compile({
    viewType: {
      type: "enum",
      values: ["grid", "list"],
    },
    type: {
      type: "enum",
      values: ["all", "selected"],
    },
    showDescription: "boolean|optional",
    selectedApps: {
      type: "array",
      optional: !isSelectedApps,
      label: "Selected Power-Ups",
      items: {
        type: "enum",
        values: appsOptions,
      },
    },
  });
}
function getParagraphCheck() {
  const displayedTextLimit = this.nodeJson?.viewProps?.displayedTextLimit;
  const checkMin = displayedTextLimit ? 1 : null;
  return getValidator().compile({
    text: "string",
    alignment: {
      type: "enum",
      values: ["left", "right", "center", "justify"],
      optional: true,
    },
    displayedTextLimit: {
      type: "enum",
      values: [true, false],
      optional: true,
    },
    maxCharacter: {
      optional: !displayedTextLimit,
      type: "number",
      min: checkMin,
      label: "Maximum Character",
    },
  });
}
const headerCheck = getValidator().compile({
  text: "string",
  heading: {
    type: "enum",
    values: ["h1", "h2", "h3", "h4", "h5", "h6"],
  },
  alignment: {
    type: "enum",
    values: ["left", "right", "center", "justify"],
    optional: true,
  },
});
const paragraphCheck = getValidator().compile({
  text: "string",
  alignment: {
    type: "enum",
    values: ["left", "right", "center", "justify"],
    optional: true,
  },
});
const linkCheck = getValidator().compile({
  text: "string",
  url: "string|optional",
});
const trelloCSCheck = getValidator().compile({
  pageSize: "number|optional",
  query: {
    type: "object",
    optional: true,
    props: {
      collections: {
        type: "array",
        items: {
          type: "string",
        },
        optional: true,
      },
      includeArchived: {
        type: "enum",
        optional: true,
        values: ["all", "archived", "notarchived"],
      },
      type: {
        type: "enum",
        optional: true,
        values: ["basic"],
      },
    },
  },
  showExport: "boolean|optional",
  showSearch: "boolean|optional",
});
const tableCheck = getValidator().compile({
  columns: {
    optional: true,
    type: "array",
    items: {
      type: "object",
      props: {
        header: "string",
        view: {
          type: "object",
          props: componentScheme,
        },
      },
    },
  },
});
const dateCheck = getValidator().compile({
  text: "string",
  format: "string",
});
const menuItemCheck = getValidator().compile({
  text: "string",
});
const cardMenuItemCheck = getValidator().compile({
  text: "string",
  query: {
    type: "object",
    optional: true,
    props: {
      collections: {
        type: "array",
        optional: true,
        items: {
          type: "string",
        },
      },
      includeArchived: {
        type: "enum",
        optional: true,
        values: ["all", "archived", "notarchived"],
      },
      type: {
        optional: true,
        type: "enum",
        values: ["basic"],
      },
    },
  },
});
const iconCheck = getValidator().compile({
  name: "string|empty:false",
  family: "string|optional",
  size: "number|optional",
});
const convCheck = getValidator().compile({
  allowDeleteMessage: "boolean|optional",
  allowDeleteThread: "boolean|optional",
  allowGetBoardMembers: "boolean|optional",
  allowGetContacts: "boolean|optional",
  allowGetRoles: "boolean|optional",
  allowMembersUpdate: "boolean|optional",
  allowNewThread: "boolean|optional",
  allowQuickText: "boolean|optional",
  allowReply: "boolean|optional",
  canAddQuickText: "boolean|optional",
  canDeleteQuickText: "boolean|optional",
  canEditQuickText: "boolean|optional",
  canReply: "boolean|optional",
  canUploadAttachment: "boolean|optional",
  canUseQuickText: "boolean|optional",
  showMeta: "boolean|optional",
  showMetaDetail: "boolean|optional",
});
const tableColumnCheck = getValidator().compile({
  field: "string|optional",
  header: "string|optional",
  sortable: "boolean|optional",
});
const snippetCheck = getValidator().compile({
  css: "string|optional",
  html: "string",
  name: "string|empty:false",
});
function hippoFieldsCheck() {
  const isSelectedFields = this.nodeJson?.viewProps?.dataFields?.source === "direct";
  const isVariableField = this.nodeJson?.viewProps?.dataFields?.source === "variable";
  let fields = this.getHippoFields(true);
  fields = fields.concat(this.getCustomFields(true))
  fields = fields.concat(['hippoFields', "customFields", "appVariables"])
  return getValidator().compile({
    downloadCsvFile: "boolean",
    hideEmptyFields: "boolean",
    excerptContent: "boolean|optional",
    allowEdit: "boolean|optional",
    allowCopy: "boolean|optional",
    showHippoFieldIcon: "boolean",
    showSearch: "boolean",
    showUpdateWith: "boolean",
    dataFields: {
      label: TransText.getTranslate('dataFields'),
      type: "object",
      props: {
        source: {
          type: "enum",
          values: ["direct", "variable"],
        },
        selected:{
          label: TransText.getTranslate('dataFields'),
          type: "array",
          optional: !isSelectedFields,
          items: {
            type: "enum",
            values: fields,
          },
        },
        variable: {
          type: "string",
          optional: !isVariableField
        },
      }
    },
  });
}
function appVariablesCheck() {
  const isSelectedFields = this.nodeJson?.viewProps?.source === "selected";
  const isVariableField = this.nodeJson?.viewProps?.source === "variable";
  return getValidator().compile({
    downloadCsvFile: "boolean|optional",
    hideEmptyFields: "boolean|optional",
    excerptContent: "boolean|optional",
    allowEdit: "boolean|optional",
    selectedFields: {
      type: "array",
      optional: !isSelectedFields,
      items: {
        type: "enum",
        values: this.getAppParameters(true),
      },
    },
    variable: {
      type: "string",
      optional: !isVariableField
    },
    showIcon: "boolean|optional",
    showSearch: "boolean|optional",
    source: {
      type: "enum",
      values: ["all", "selected", "variable"],
    },
  });
}
const labelCheck = getValidator().compile({
  text: "string",
});
function getAttachmentListCheck() {
  return getValidator().compile({
    field: {
      type: "string",
      //Todo: Variable Check
    },
  });
}
function getImageCheck() {
  return getValidator().compile({
    attachmentListId: {
      type: "string",
      label: "Source",
      optional: this.nodeJson?.viewProps?.sourceType !== "attachment",
      //Todo: Variable Check
    },
    src: {
      type: "string",
      label: "Source",
      optional: this.nodeJson?.viewProps?.sourceType !== "url",
    },
  });
}
function trelloActivitiesCheck() {
  return getValidator().compile({
    source: "string",
    displayOptions: {
      type: "array",
      items: {
        type: "enum",
        values: [
          "all",
          "comment",
          "member",
          "move",
          "copy",
          "archiveAndSendBoard",
          "fieldUpdate",
          "attachment",
          "date"
        ]
      }
    }
  })
}
function shareButtonCheck() {
  return getValidator({useNewCustomCheckerFunction: true}).compile({
      urlSource: {
        type: "enum",
        values: ["current", "custom"],
        optional: true
      },
      customUrl:{
        type: "string",
        optional: this.nodeJson.viewProps?.urlSource !== "custom"
      },
      align: {
        type: "enum",
        values: ["left", "center", "right"]
      },
      viewType: {
        type: "enum",
        values: ["horizontal", "floating"]
      },
      style: {
        type: "enum",
        values: ["circle", "square"]
      },
      size: {
        type: "enum",
        values: ["small", "medium", "large"]
      },
      color: "string",
      message: {
        type: "string",
        field: TransText.getTranslate('shareMessage')
      },
    services: {
      type: "array",
      items: {
        type: "custom",
        props: {
          id: "string",
          message: "string|optional",
          media: {
            type: "custom",
            default: "[[[nullValue]]]",
          },
          content: {
            type: "custom",
            default: "[[[nullValue]]]",
          }
        },
        custom(value, errors, schema, path, parentNode, context){
          if(value?.id === "pinterest" && !value?.media){
            const index = (Object.values(parentNode?.services)||[]).findIndex(i => i?.id === "pinterest")
            errors.push({ type: "required", field: `services[${index}].media`, message: TransText.getTranslate("mediaRequiredForNode", TransText.getTranslate('media'), "Pinterest")});
          }
          if(value?.id === "copy" && value?.content &&  !value?.message){
            const index = (Object.values(parentNode?.services)||[]).findIndex(i => i?.id === "copy")
            errors.push({ type: "required", field: `services[${index}].message`, message: TransText.getTranslate("mediaRequiredForNode", TransText.getTranslate('content'), TransText.getTranslate('copy'))});
          }
          return value
        }
      }
    },
      title: "string|optional"
  })

}
export default class ComponentNode extends AbstractHippoNode {
  constructor(appJson, path) {
    super(appJson, path);
  }

  getValidatorFunction() {
    const errors = [];
    errors.pushArray(componentCheck(this.nodeJson));
    this.validatorPath = `${this.path}.viewProps`;
    switch (this.nodeJson.type) {
      case "attachmentList":
        errors.pushArray(
          getAttachmentListCheck.call(this)(this.nodeJson.viewProps || {})
        );
        break;
      case "image":
        errors.pushArray(
          getImageCheck.call(this)(this.nodeJson.viewProps || {})
        );
        break;
      case "formList":
        errors.pushArray(
          formListCheck.call(this)(this.nodeJson.viewProps || {})
        );
        break;
      case "appList":
        errors.pushArray(
          appListCheck.call(this)(this.nodeJson.viewProps || {})
        );
        break;
      case "header":
        errors.pushArray(headerCheck(this.nodeJson.viewProps || {}));
        break;
      case "paragraph":
        errors.pushArray(
          getParagraphCheck.call(this)(this.nodeJson.viewProps || {})
        );
        break;
      case "hyperLink":
        errors.pushArray(linkCheck(this.nodeJson.viewProps || {}));
        break;
      case "TrelloCardSharing":
        errors.pushArray(trelloCSCheck(this.nodeJson.viewProps || {}));
        break;
      case "table":
        errors.pushArray(tableCheck(this.nodeJson.viewProps || {}));
        break;
      case "date":
        errors.pushArray(dateCheck(this.nodeJson.viewProps || {}));
        break;
      case "menuItem":
        errors.pushArray(menuItemCheck(this.nodeJson.viewProps || {}));
        break;
      case "cardMenuItem":
        errors.pushArray(cardMenuItemCheck(this.nodeJson.viewProps || {}));
        break;
      case "icon":
        errors.pushArray(iconCheck(this.nodeJson.viewProps || {}));
        break;
      case "Conversation":
        errors.pushArray(convCheck(this.nodeJson.viewProps || {}));
        break;
      case "tableColumn":
        errors.pushArray(tableColumnCheck(this.nodeJson.viewProps || {}));
        break;
      case "snippet":
        errors.pushArray(snippetCheck(this.nodeJson.viewProps || {}));
        break;
      case "hippoFields":
        errors.pushArray(
          hippoFieldsCheck.call(this)(this?.nodeJson?.viewProps || {})
        );
        break;
      case "appVariables":
        errors.pushArray(
          appVariablesCheck.call(this)(this.nodeJson.viewProps || {})
        );
        break;
      case "label":
        errors.pushArray(labelCheck(this.nodeJson.viewProps || {}));
      case "shareButton":
        errors.pushArray(shareButtonCheck.call(this)(this.nodeJson.viewProps||{}))
        break;
      case "trelloActivities":
        errors.pushArray(trelloActivitiesCheck.call(this)(this.nodeJson.viewProps||{}))
        break;
    }
    return errors;
  }

  process(appJson, path, nodeJson) {
    this.id = nodeJson.id;
    if (nodeJson?.viewProps?.children) {
      this.addChildNode(
        new ChildrenNode(appJson, path + ".viewProps.children")
      );
    }
    let events = nodeJson?.viewProps?.events;
    if (events) {
      Object.entries(events).forEach((entry) => {
        this.addChildNode(
          new EventNode(appJson, path + ".viewProps.events." + entry[0])
        );
      });
    }
    if(path.includes("es563z"))
    if (nodeJson?.accessRight?.dataRule?.conditions) {
      this.addChildNode(
        new VisibilityNode(appJson, `${path}.accessRight.dataRule`)
      );
    }
  }
}
