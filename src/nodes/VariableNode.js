import AbstractHippoNode from "./AbstractHippoNode";
import Validator from "fastest-validator";
import jsonata from "jsonata";
import * as path from "path";

export default class VariableNode extends AbstractHippoNode {
  static firstLevel = {
    system:true,
    portal: true,
    user: true,
    board:true,
    card:true,
    parentCard:true,
    appParameters:true
  }
  static ALL_JSONATA_EXPRESSIONS = {};
  static createJsonataExpression(text){
    let exp = this.ALL_JSONATA_EXPRESSIONS[text];
    if(exp == null){
      exp = jsonata(text);
      this.ALL_JSONATA_EXPRESSIONS[text] = exp;
    }
    return exp;
  }
  constructor(appJson, path, expression) {
    super(appJson, path);
    this.expression = expression;
  }

  process(appJson, path, nodeJson) {
  }

  getValidatorFunction() {
    let exp = VariableNode.createJsonataExpression(this.expression)
    exp.registerFunction("createLinkEnc", (...args) => {}, "<ssssssa:s>")
    exp.registerFunction("createLink", (...args) => {}, "<ssssssa:s>")
    exp.registerFunction("toString", function(type, args){}, "<s-a:s>")
    let varErrors = [];
    let staticFields = this.getAccessibleFieldTypes();
    let me = this;
    let activeContext = null;
    let proxy = new Proxy({}, {
      get: function (target, propertyName) {
        if(varErrors.length === 0 && propertyName !== "sequence" && !me.expression.startsWith("form.")) {
          let fieldId = propertyName;
          if (activeContext != null) {
            fieldId = activeContext.resolveBy?activeContext.resolveBy+"."+fieldId:activeContext.id+"."+fieldId
          }
          let fieldConfig = staticFields[fieldId];
          if (!fieldConfig) {
            varErrors.push({
              path: me.validatorPath,
              type: "invalid_variable",
              message: "Invalid variable field " + propertyName,
              args: [propertyName, me.expression]
            })
          }
          else{
            if(activeContext == null || fieldConfig.resolveBy != null){
              activeContext = fieldConfig;
            }
          }
        }
        return proxy;
      }
    });
    exp.evaluate(proxy);
    return varErrors;
  }

}
