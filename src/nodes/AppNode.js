import AbstractHippoNode from "./AbstractHippoNode";
import WebViewNode from "./WebViewNode";

import TrelloCardBackViewNode from "./TrelloCardBackViewNode";
import AutomationNode from "./Automations/AutomationNode";
import HipporelloFieldNode from "./HipporelloFieldNode";
import ViewSettingsNode from "./Settings/ViewSettingsNode";
import AppInfoNode from "./Settings/AppInfoNode";
import AppVariableFieldsNode from "./Settings/FieldDefinitions/appVariableFieldsNode";
import CardTypesNode from "./CardTypes/CardTypesNode";
import RolesNode from "./Roles/RolesNode";
import FormNode from "./Forms/FormNode";
import EmailNode from "./Forms/EmailNode";
import ActionGroupNode from "./ActionGroupNode";
import JSONUtils from "../JSONUtils";
const Validator = require("fastest-validator");

const appNodeScheme = {
  'id': 'string',
  'schemaVersion': 'number',
  'name': 'string',
  'slug': 'string',
  'description': 'string|optional',
  'type': {
    type: 'enum',
    values: [
        'defaultApp', 'homeApp'
    ]
  },
  'boards': 'array|optional'
}
const appNodeCheck = new Validator().compile(appNodeScheme);
export default class AppNode extends AbstractHippoNode{

  static INSTANCE = null;
  constructor(appJson) {
    super(appJson, 'app');
  }

  getValidatorFunction(){
    return (data)=>{
      return appNodeCheck(data);
    };
  }
  process(appJson, path, nodeJson) {
    this.addChildNode(new WebViewNode(appJson, "app.environments.webView"));
    this.addChildNode(new TrelloCardBackViewNode(appJson, "app.environments.trelloCardBack"));
    this.addChildNode(new  CardTypesNode(appJson, "app.cardTypes"));
    this.addChildNode(new  RolesNode(appJson, "app.roles"));
    this.addChildNode(new  ViewSettingsNode(appJson, "app.viewSettings"));
    let appVariables = JSONUtils.query(appJson, "app.fieldDefinitions.appVariableFields");
    if (appVariables) {
      this.addChildNode(new  AppVariableFieldsNode(appJson, "app.fieldDefinitions.appVariableFields"));
    }
    let actionGroups = JSONUtils.query(appJson, "app.actionGroups");
    if(actionGroups){
      actionGroups = Object.values(actionGroups)
      actionGroups.forEach(actionGroup=>{
        this.addChildNode(new ActionGroupNode(appJson, `app.actionGroups.${actionGroup.id}`))
      })
    }
    let automations = JSONUtils.query(appJson, "app.automations");
    if(automations){
      automations = Object.values(automations)
      automations.forEach(automation=>{
        this.addChildNode(new AutomationNode(appJson, "app.automations."+automation.id))
      })
    }
    let hippoFields = JSONUtils.query(appJson, "app.fieldDefinitions.hippoFields");
    if(hippoFields){
      hippoFields = Object.values(hippoFields)
      hippoFields.forEach(hippoField=>{
        this.addChildNode(new HipporelloFieldNode(appJson, "app.fieldDefinitions.hippoFields."+hippoField.id))
      })
    }
    let incomingIntegrations = JSONUtils.query(appJson, "app.integrations.incoming");
    if(incomingIntegrations){
      incomingIntegrations = Object.values(incomingIntegrations)
      incomingIntegrations.forEach(integration=>{
        if(["form", "updateform"].includes(integration.type)){
          this.addChildNode(new FormNode(appJson, "app.integrations.incoming."+integration.id));
        }
        else if(integration.type === "email"){
          this.addChildNode(new EmailNode(appJson, "app.integrations.incoming."+integration.id));
        }
      })
    }
  }
}
