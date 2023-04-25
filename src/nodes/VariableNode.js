import AbstractHippoNode from "./AbstractHippoNode";
import jsonata from "jsonata";

export default class VariableNode extends AbstractHippoNode {
  static firstLevel = {
    system: true,
    portal: true,
    user: true,
    board: true,
    card: true,
    parentCard: true,
    appParameters: true,
  };
  static ALL_JSONATA_EXPRESSIONS = {};
  static createJsonataExpression(text) {
    let exp = this.ALL_JSONATA_EXPRESSIONS[text];
    if (exp == null) {
      exp = jsonata(text);
      exp.registerFunction("createLinkEnc", () => {}, "<ssssssa:s>");
      exp.registerFunction("createLink", () => {}, "<ssssssa:s>");
      exp.registerFunction("toString", () => {}, "<s-a:s>");
      this.ALL_JSONATA_EXPRESSIONS[text] = exp;
    }
    return exp;
  }
  constructor(appJson, path, expression) {
    super(appJson, path);
    this.expression = expression;
  }

  process(appJson, path, nodeJson) {}

  getValidatorFunction() {
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
          if (
            varErrors.length === 0 &&
            propertyName !== "sequence" &&
            !hasIgnoredPath
          ) {
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
                  message: `The variable named **"${label}"** has been deleted and is currently unavailable.`,
                  args: [label, me.expression],
                });
              } else {
                varErrors.push({
                  path: me.validatorPath,
                  type: "invalidVariable",
                  message:
                    "The variable used cannot be found. Please remove or replace.",
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
