import AbstractHippoNode from "./AbstractHippoNode";
import WebViewNode from "./WebViewNode";

import TrelloCardBackViewNode from "./TrelloCardBackViewNode";
import AutomationNode from "./Automations/AutomationNode";
import HipporelloFieldNode from "./HipporelloFieldNode";
import ViewSettingsNode from "./Settings/ViewSettingsNode";
import AppVariableFieldsNode from "./Settings/FieldDefinitions/appVariableFieldsNode";
import CardCollectionsNode from "./CardCollections/CardCollectionsNode";
import RolesNode from "./Roles/RolesNode";
import FormNode from "./Forms/FormNode";
import EmailNode from "./Forms/EmailNode";
import JSONUtils from "../JSONUtils";
import TrelloBoardViewNode from "./TrelloBoardViewNode";
import Validator from "fastest-validator";
import {APP_SLUG_BLACKLIST, LATEST_APP_SCHEMA_VERSION} from "../constants";

export default class AppNode extends AbstractHippoNode{

  static INSTANCE = null;
  constructor(appJson) {
    super(appJson, 'app');
  }

  getValidatorFunction(){
    const appNodeCheck = new Validator({useNewCustomCheckerFunction: true}).compile({
      id: 'string',
      schemaVersion: {
        type: 'number',
        equal: LATEST_APP_SCHEMA_VERSION
      },
      name: "string|empty:false|trim",
      slug: {
        type: "custom",
        check: (value, errors) => {
          if(APP_SLUG_BLACKLIST.includes(value)){
            errors.push({type: "notOneOf", label: 'App Slug', expected: APP_SLUG_BLACKLIST})
          }
          //Todo: Must be unique check for other apps slug
          return value
        }
      },
      description: 'string|optional|empty:false|trim',
      type: {
        type: 'enum',
        values: ['defaultApp', 'homeApp']
      },
      boards: 'array|optional'
    });
    const errors = appNodeCheck(this.appJson.app)
    return errors
  }
  process(appJson, path, nodeJson) {
    this.addChildNode(new WebViewNode(appJson, "app.environments.webView"));
    this.addChildNode(new TrelloCardBackViewNode(appJson, "app.environments.trelloCardBack"));
		if(appJson?.app?.environments?.trelloBoardView?.enabled){
      this.addChildNode(new TrelloBoardViewNode(appJson, "app.environments.trelloBoardView"));
		}
    this.addChildNode(new  CardCollectionsNode(appJson, "app.cardCollections"));
    this.addChildNode(new  RolesNode(appJson, "app.roles"));
    this.addChildNode(new  ViewSettingsNode(appJson, "app.viewSettings"));
    let appVariables = JSONUtils.query(appJson, "app.fieldDefinitions.appVariableFields");
    if (appVariables) {
      this.addChildNode(new  AppVariableFieldsNode(appJson, "app.fieldDefinitions.appVariableFields"));
    }
    let automations = this.getAutomations()
    if(automations){
      automations.forEach(automation=>{
        this.addChildNode(new AutomationNode(appJson, "app.automations."+automation.id))
      })
    }
    let hippoFieldIds = this.getHippoFields()
    if(hippoFieldIds?.length){
      hippoFieldIds.forEach(hfId => {
        this.addChildNode(new HipporelloFieldNode(appJson, "app.fieldDefinitions.hippoFields."+hfId))
      })
    }
    let forms = this.getFormIds(true)
    if(forms?.length){
      forms.forEach(form => {
        if(["form", "updateform"].includes(form.type)){
          this.addChildNode(new FormNode(appJson, "app.integrations.incoming."+form.id));
        }
        else if(forms.type === "email"){
          this.addChildNode(new EmailNode(appJson, "app.integrations.incoming."+forms.id));
        }
      })
    }
  }
}
