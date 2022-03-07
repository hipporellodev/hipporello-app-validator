import AbstractHippoNode from "./AbstractHippoNode";

import EventNode from "./EventNode";
import ChildrenNode from "./Views/ChildrenNode";
import Validator from "fastest-validator";
import {actionConditionSchema} from "./Automations/AutomationNode";

const componentScheme = {
  id: 'string|empty:false',
  type: {
    type: 'enum',
    values: [
      'header',
      'paragraph',
      'list',
      'icon',
      'appList',
      'formList',
      'hyperlink',
      'image',
      'video',
      'hippoFields',
      'label',
      'button',
      'TrelloCardSharing',
      'table',
      'date',
      'dropdown',
      'row',
      'Image',
      'Header',
      'horizontalline',
      "dropdownItem",
      "attachmentList",
      "menuItem",
      "tableColumn",
      "menu",
      "HippoFields",
      "Conversation",
      "column",
      "columns"
    ]
  },
  viewProps: {
    type: 'object',
    optional: true,
    props: {
      name: 'string|optional',
      gap: 'number|optional',
      align: {
        type: 'enum',
        values: ['left', 'right', 'center'],
        optional: true
      }
    }
  },
  accessRight: 'object|optional'
};
const componentCheck = new Validator().compile(componentScheme);

const formListCheck = new Validator().compile({
  viewType: 'string|empty:false',
  type: {
    type: 'enum',
    values: ["all", "selected"]
  },
  showDescription: 'boolean|optional',
  selectedForms: {
    type: 'array',
    optional: true
  }
})
const appListCheck = new Validator().compile({
  viewType: 'string|empty:false',
  type: {
    type: 'enum',
    values: ["all", "selected"],
  },
  showDescription:'boolean|optional',
  selectedApps: 'array|optional'
})
const headerCheck = new Validator().compile({
  text: 'string',
  heading: {
    type: 'enum',
    values: ["h1", "h2", "h3", "h4", "h5", "h6"]
  },
  alignment: {
    type: 'enum',
    values: ['left', 'right','center'],
    optional: true
  }
})
const paragraphCheck = new Validator().compile({
  text: 'string',
  alignment: {
    type: 'enum',
    values: ['left', 'right','center'],
    optional: true
  }
})
const linkCheck = new Validator().compile({
  text: 'string',
  url: 'string|optional'
});
const trelloCSCheck = new Validator().compile({
  pageSize: 'number|optional',
  query: {
    type: 'object',
    optional: true,
    props: {
      ...actionConditionSchema,
      type: {
        type: 'enum',
        values: ['basic']
      }
    }
  },
  showExport: 'boolean|optional',
  showSearch: 'boolean|optional',
})
const tableCheck = new Validator().compile({
  columns: {
    optional: true,
    type: 'array',
    items: {
      type: 'object',
      props: {
        header: 'string',
        view: {
          type: 'object',
          props: componentScheme
        }
      }
    }
  }
});
const dateCheck = new Validator().compile({
  text: 'string',
  format: 'string'
});
const menuItemCheck = new Validator().compile({
  text: 'string',
});
const iconCheck = new Validator().compile({
  name: 'string|empty:false',
  family: 'string|optional',
  size: 'number|optional'
});
const convCheck = new Validator().compile({
  allowDeleteMessage : 'boolean|optional',
  allowDeleteThread : 'boolean|optional',
  allowGetBoardMembers : 'boolean|optional',
  allowGetContacts : 'boolean|optional',
  allowGetRoles : 'boolean|optional',
  allowMembersUpdate : 'boolean|optional',
  allowNewThread : 'boolean|optional',
  allowQuickText : 'boolean|optional',
  allowReply : 'boolean|optional',
  canAddQuickText: 'boolean|optional',
  canDeleteQuickText: 'boolean|optional',
  canEditQuickText: 'boolean|optional',
  canReply: 'boolean|optional',
  canUploadAttachment: 'boolean|optional',
  canUseQuickText: 'boolean|optional',
  showMeta: 'boolean|optional',
  showMetaDetail: 'boolean|optional'
})
const tableColumnCheck = new Validator().compile({
  field: 'string|optional',
  header: 'string|optional',
  sortable: 'boolean|optional',
});
const snippetCheck = new Validator().compile({
  css: 'string|optional',
  html: 'string',
  name: 'string|empty:false',
});
const hfCheck = new Validator().compile({
  allFields: 'boolean|optional',
  showSearch: 'boolean|optional',
  showUpdateWith: 'boolean|optional',
  target: 'object'
  /* @todo addTargetScheme */
});
const labelCheck = new Validator().compile({
  text: 'string',
});
export default class ComponentNode extends AbstractHippoNode{
  constructor(appJson, path) {
    super(appJson, path);
  }

  getValidatorFunction() {
    const errors = [];
    errors.pushArray(componentCheck(this.nodeJson));
    this.validatorPath = `${this.path}.viewProps`
    switch (this.nodeJson.type) {
      case 'formList':
        errors.pushArray(formListCheck(this.nodeJson.viewProps));
        break;
      case 'appList':
        errors.pushArray(appListCheck(this.nodeJson.viewProps));
        break;
      case 'header':
        errors.pushArray(headerCheck(this.nodeJson.viewProps));
        break;
      case 'paragraph':
        errors.pushArray(paragraphCheck(this.nodeJson.viewProps));
        break;
      case 'hyperLink':
        errors.pushArray(linkCheck(this.nodeJson.viewProps));
        break;
      case 'TrelloCardSharing':
        errors.pushArray(trelloCSCheck(this.nodeJson.viewProps));
        break;
      case 'table':
        errors.pushArray(tableCheck(this.nodeJson.viewProps));
        break;
      case 'date':
        errors.pushArray(dateCheck(this.nodeJson.viewProps));
        break;
      case 'menuItem':
        errors.pushArray(menuItemCheck(this.nodeJson.viewProps));
        break;
      case 'icon':
        errors.pushArray(iconCheck(this.nodeJson.viewProps));
        break;
      case 'Conversation':
        errors.pushArray(convCheck(this.nodeJson.viewProps));
        break;
      case 'tableColumn':
        errors.pushArray(tableColumnCheck(this.nodeJson.viewProps));
        break;
      case 'snippet':
        errors.pushArray(snippetCheck(this.nodeJson.viewProps));
        break;
      case 'HippoFields':
        errors.pushArray(hfCheck(this.nodeJson.viewProps));
        break;
      case 'label':
        errors.pushArray(labelCheck(this.nodeJson.viewProps));
        break;
    }
    return errors;
  }

  process(appJson, path, nodeJson) {
    this.id = nodeJson.id;
    if(nodeJson?.viewProps?.children) {
      this.addChildNode(new ChildrenNode(appJson, path+".viewProps.children"))
    }
    let events = nodeJson?.viewProps?.events;
    if(events){
      Object.entries(events).forEach((entry=>{
        this.addChildNode(new EventNode(appJson, path+".viewProps.events."+entry[0]))
      }))
    }
  }


}
