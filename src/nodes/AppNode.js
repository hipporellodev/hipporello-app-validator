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
import { APP_SLUG_BLACKLIST, LATEST_APP_SCHEMA_VERSION } from "../constants";
import VariableNode from "./VariableNode";
import Mustache from "mustache";
import getValidator from "../Utils/getValidator";
import MagicLinkNode from "./MagicLink/MagicLinkNode";

export default class AppNode extends AbstractHippoNode {
  static INSTANCE = null;
  constructor(appJson, entries) {
    super(appJson, "app");
    if (entries) this.entities = entries;
  }

  getValidatorFunction() {
    const appNodeCheck = getValidator({
      useNewCustomCheckerFunction: true,
    }).compile({
      id: "string",
      schemaVersion: {
        type: "number",
        equal: LATEST_APP_SCHEMA_VERSION,
      },
      name: "string|empty:false|trim",
      slug: {
        type: "custom",
        check: (value, errors) => {
          if (APP_SLUG_BLACKLIST.includes(value)) {
            errors.push({
              type: "notOneOf",
              label: "App Slug",
              expected: APP_SLUG_BLACKLIST,
            });
          }
          return value;
        },
      },
      description: "string|optional|empty:false|trim",
      type: {
        type: "enum",
        values: ["defaultApp", "homeApp"],
      },
      boards: "array|optional",
    });
    const appErrors = appNodeCheck(this.appJson.app);
    let allErrors = Array.isArray(appErrors) ? appErrors : [];
    this.variableNodes.forEach((valNode) => {
      let errors = valNode.getValidatorFunction();
      if (errors && errors.length > 0) {
        allErrors.splice(allErrors.length, 0, ...errors);
      }
    });
    return allErrors;
  }
  process(appJson, path, nodeJson) {
    this.addChildNode(new WebViewNode(appJson, "app.environments.webView"));
    this.addChildNode(
      new TrelloCardBackViewNode(appJson, "app.environments.trelloCardBack")
    );
    if (appJson?.app?.environments?.trelloBoardView?.enabled) {
      this.addChildNode(
        new TrelloBoardViewNode(appJson, "app.environments.trelloBoardView")
      );
    }
    this.addChildNode(new CardCollectionsNode(appJson, "app.cardCollections"));
    this.addChildNode(new RolesNode(appJson, "app.roles"));
    this.addChildNode(new ViewSettingsNode(appJson, "app.viewSettings"));
    let appVariables = JSONUtils.query(
      appJson,
      "app.fieldDefinitions.appVariableFields"
    );
    if (appVariables) {
      this.addChildNode(
        new AppVariableFieldsNode(
          appJson,
          "app.fieldDefinitions.appVariableFields"
        )
      );
    }
    let automationIds = this.getAutomations(true);
    if (automationIds?.length) {
      automationIds.forEach((automationId) => {
        this.addChildNode(
          new AutomationNode(appJson, "app.automations." + automationId)
        );
      });
    }
    let hippoFieldIds = this.getHippoFields(true);
    if (hippoFieldIds?.length) {
      hippoFieldIds.forEach((hfId) => {
        this.addChildNode(
          new HipporelloFieldNode(
            appJson,
            "app.fieldDefinitions.hippoFields." + hfId
          )
        );
      });
    }
    let forms = this.getFormIds(true);
    if (forms?.length) {
      forms.forEach((form) => {
        if (["form", "updateform"].includes(form.type)) {
          this.addChildNode(
            new FormNode(appJson, "app.integrations.incoming." + form.id)
          );
        } else if (form.type === "email") {
          this.addChildNode(
            new EmailNode(appJson, "app.integrations.incoming." + form.id)
          );
        }
      });
    }
    let magicLinkIds = this.getMagicLinkIds(true);
    if (magicLinkIds?.length) {
      magicLinkIds.forEach((mlId) => {
        this.addChildNode(
          new MagicLinkNode(appJson, "app.fieldDefinitions.magicLink." + mlId)
        );
      });
    }
    this.generateVariableNodes(nodeJson);
  }

  generateVariableNodes(nodeJson) {
    this.variableNodes = [];
    this._generateVariableNodes("app", nodeJson, this.variableNodes);
  }
  _generateVariableNodes(path, nodeJson, variableNodes) {
    if (nodeJson?.deleted || nodeJson?.enabled === false) return false;
    if (Array.isArray(nodeJson)) {
      nodeJson.forEach((item, index) => {
        this._generateVariableNodes(path + "." + index, item, variableNodes);
      });
    } else if (typeof nodeJson === "string") {
      if (nodeJson.indexOf("{{") >= 0) {
        try {
          let parsedContent = Mustache.parse(nodeJson || "");
          parsedContent.forEach((item) => {
            if (item[0] === "name" || item[0] === "&") {
              let exp = item[1];
              const variableNode = new VariableNode(this.appJson, path, exp);
              variableNode.init(this.actions, this.entities);
              variableNodes.push(variableNode);
            }
          });
        } catch (err) {}
      }
    } else if (nodeJson instanceof Object) {
      Object.entries(nodeJson).forEach(([key, value]) => {
        this._generateVariableNodes(path + "." + key, value, variableNodes);
      });
    }
  }
}
