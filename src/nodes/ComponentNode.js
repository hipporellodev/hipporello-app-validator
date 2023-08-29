import AbstractHippoNode from "./AbstractHippoNode";

import EventNode from "./EventNode";
import ChildrenNode from "./Views/ChildrenNode";
import Validator from "fastest-validator";
import VisibilityNode from "./AccessRights/VisibilityNode";

const componentScheme = {
  id: "string|empty:false",
  type: {
    type: "enum",
    values: [
      "header",
      "paragraph",
      "list",
      "icon",
      "appList",
      "formList",
      "sidebar",
      "hyperlink",
      "image",
      "video",
      "hippoFields",
      "appVariables",
      "label",
      "button",
      "TrelloCardSharing",
      "table",
      "date",
      "dropdown",
      "row",
      "Image",
      "AppVariables",
      "Header",
      "horizontalline",
      "html",
      "dropdownItem",
      "attachmentList",
      "menuItem",
      "cardMenuItem",
      "tableColumn",
      "menu",
      "HippoFields",
      "Conversation",
      "column",
      "columns",
      "userManagement",
      "shareButton"
    ],
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
const componentCheck = new Validator().compile(componentScheme);

function formListCheck() {
  const sourceTypes = [
    "all",
    "selected",
    "allCreatingForms",
    "allUpdatingForms",
  ];
  const isSelectedForms = this.nodeJson?.viewProps?.type === "selected";
  const formsOptions = this.getFormIds();
  return new Validator().compile({
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
  return new Validator().compile({
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
  return new Validator().compile({
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
const headerCheck = new Validator().compile({
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
const paragraphCheck = new Validator().compile({
  text: "string",
  alignment: {
    type: "enum",
    values: ["left", "right", "center", "justify"],
    optional: true,
  },
});
const linkCheck = new Validator().compile({
  text: "string",
  url: "string|optional",
});
const trelloCSCheck = new Validator().compile({
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
const tableCheck = new Validator().compile({
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
const dateCheck = new Validator().compile({
  text: "string",
  format: "string",
});
const menuItemCheck = new Validator().compile({
  text: "string",
});
const cardMenuItemCheck = new Validator().compile({
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
const iconCheck = new Validator().compile({
  name: "string|empty:false",
  family: "string|optional",
  size: "number|optional",
});
const convCheck = new Validator().compile({
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
const tableColumnCheck = new Validator().compile({
  field: "string|optional",
  header: "string|optional",
  sortable: "boolean|optional",
});
const snippetCheck = new Validator().compile({
  css: "string|optional",
  html: "string",
  name: "string|empty:false",
});
function hippoFieldsCheck() {
  const isSelectedFields = this.nodeJson?.viewProps?.source === "selected";
  return new Validator().compile({
    downloadCsvFile: "boolean",
    hideEmptyFields: "boolean",
    excerptContent: "boolean|optional",
    allowEdit: "boolean|optional",
    allowCopy: "boolean|optional",
    selectedFields: {
      type: "array",
      optional: !isSelectedFields,
      items: {
        type: "enum",
        values: this.getHippoFields(true),
      },
    },
    showHippoFieldIcon: "boolean",
    showSearch: "boolean",
    showUpdateWith: "boolean",
    source: {
      type: "enum",
      values: ["all", "selected"],
    },
  });
}
function appVariablesCheck() {
  const isSelectedFields = this.nodeJson?.viewProps?.source === "selected";
  return new Validator().compile({
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
    showIcon: "boolean|optional",
    showSearch: "boolean|optional",
    source: {
      type: "enum",
      values: ["all", "selected"],
    },
  });
}
const labelCheck = new Validator().compile({
  text: "string",
});
function getAttachmentListCheck() {
  return new Validator().compile({
    field: {
      type: "string",
      //Todo: Variable Check
    },
  });
}
function getImageCheck() {
  return new Validator().compile({
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
function shareButtonCheck() {
  return new Validator({useNewCustomCheckerFunction: true}).compile({
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
        messages: {
          required: "'Share Message' field is required."
        }
      },
    services: {
      type: "array",
      items: {
        type: "object",
        props: {
          id: "string",
          message: "string|optional",
          media: {
            type: "custom",
            default: "[[[nullValue]]]",
            custom(value, errors, schema, path, parentNode, context){
              // errors.push({ type: "required"});
              return value
            }
          }
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
          hippoFieldsCheck.call(this)(this.nodeJson.viewProps || {})
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
    if (nodeJson?.accessRight?.dataRule?.conditions) {
      this.addChildNode(
        new VisibilityNode(appJson, `${path}.accessRight.dataRule`)
      );
    }
  }
}
