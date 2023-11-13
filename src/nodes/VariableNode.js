import AbstractHippoNode from "./AbstractHippoNode";
import jsonata from "jsonata";
import {TransText} from "../localize/localize";

export default class VariableNode extends AbstractHippoNode {
  static firstLevel = {
    system: true,
    portal: true,
    user: true,
    board: true,
    card: true,
    parentCard: true,
    appVariables: true,
  };
  static ALL_JSONATA_EXPRESSIONS = {};
  static createJsonataExpression(text) {
    let exp = this.ALL_JSONATA_EXPRESSIONS[text];
    if (exp == null) {
      exp = jsonata(text);
      exp.registerFunction("createLinkEnc", () => {}, "<ssssssa:s>");
      exp.registerFunction("createLink", () => {}, "<ssssssa:s>");
      exp.registerFunction("toString", () => {}, "<s-a:s>");
      exp.registerFunction("length", () => {}, "<a-:n>");
      this.ALL_JSONATA_EXPRESSIONS[text] = exp;
    }
    return exp;
  }
  constructor(appJson, path, expression, entries) {
    super(appJson, path);
    this.expression = expression;
    this.entries = expression;
  }

  process(appJson, path, nodeJson) {}

  findFieldByPath(){
    let staticFields = this.getAccessibleFieldTypes(false);
    let searchPath = this.expression.replace("[]", []);
    searchPath = searchPath.replace("Object.", ".");
    const splitPath = searchPath.split(".").filter(Boolean)
    let activeContext = null;
    let foundId = splitPath?.[0] || "";
    splitPath.forEach(fieldPart => {
      if (activeContext != null) {
        foundId = activeContext.resolveBy
            ? activeContext.resolveBy + "." + fieldPart
            : activeContext.id + "." + fieldPart;
      }
      const fieldConfig = staticFields?.[foundId];
      if(fieldConfig){
        if (activeContext == null || fieldConfig?.resolveBy != null) {
          activeContext = fieldConfig;
        }
      }
    })
    this.activeContext = activeContext;
    return activeContext;
  }
  getRightValueEntityName(){
    let staticFields = this.getAccessibleFieldTypes(false);
    return this.activeContext?.label
  }
  getRightValues() {
    const field = this.findFieldByPath()
    if(field.resolveBy === VariableNode.RESOLVE_LABEL_BY_HIPPO_ID){
      return this.getTrelloLabels(true)
    }
    if(field.resolveBy === VariableNode.RESOLVE_LIST_BY_HIPPO_ID){
      return this.getTrelloList(true)
    }
    if(field.resolveBy === VariableNode.RESOLVE_MEMBER_BY_TRELLO_ID){
      return this.getTrelloMembers(true)
    }
    if(field.resolveBy === VariableNode.RESOLVE_FIELD_DEFINITION_BY_ID){
      return this.getFieldDefinitions(true)
    }
    return null;
  }
  getValidatorFunction() {
    console.log(this.expression)
    let exp = VariableNode.createJsonataExpression(this.expression);
    let varErrors = [];
    let withDeletedStaticFields = this.getAccessibleFieldTypes(true);
    let staticFields = this.getAccessibleFieldTypes(false);
    let me = this;
    let activeContext = null;
    let proxy = new Proxy(
      {},
      {
        get: function (target, propertyName) {
          const ignoredPropertyNames = ["createLinkEnc", "createLink", "form."];
          const hasIgnoredPath = ignoredPropertyNames.some((i) =>
            me.expression.includes(i)
          );
          console.log("before", propertyName)
          if (
            varErrors.length === 0 &&
            propertyName !== "sequence" &&
            !hasIgnoredPath
          ) {
            console.log(propertyName)
            let fieldId = propertyName;
            if (activeContext != null) {
              fieldId = activeContext.resolveBy
                ? activeContext.resolveBy + "." + fieldId
                : activeContext.id + "." + fieldId;
            }
            let fieldConfig = staticFields?.[fieldId];
            const deletedFieldConfig = withDeletedStaticFields?.[fieldId];
            const label = deletedFieldConfig?.label || "";
            if (!fieldConfig) {
              if (deletedFieldConfig) {
                varErrors.push({
                  path: me.validatorPath,
                  type: "invalidVariable",
                  message: TransText.getTranslate('variableNamedDeletedMessage', label),
                  args: [label, me.expression],
                });
              } else {
                varErrors.push({
                  path: me.validatorPath,
                  type: "invalidVariable",
                  message: TransText.getTranslate('variableUsedCannotFound'),
                  args: [label, me.expression],
                });
              }
            } else {
              if (activeContext == null || fieldConfig.resolveBy != null) {
                activeContext = fieldConfig;
              }
            }
          }
          return proxy;
        },
      }
    );
    try {
      exp.evaluate(proxy);
    } catch (err) {
      // console.log({me, err})
    }
    if (varErrors?.length) {
      console.log(varErrors);
    }
    return varErrors;
  }
}
