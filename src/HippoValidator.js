import AppNode from "./nodes/AppNode";
import { TransText } from "./localize/localize";

function getDefaultCardType() {
  return {
    id: "default",
    name: "Default",
  };
}

function addDefaults(originalApp) {
  if (!originalApp.cardTypes) {
    originalApp.cardTypes = {
      default: getDefaultCardType(),
    };
  } else {
    originalApp.cardTypes.default = getDefaultCardType();
  }
  return originalApp;
}

export default class HippoValidator {
  constructor(appJson, entities, lang = "en") {
    this.lang = lang;
    try {
      const langModule = require(`./localize/langs/${lang}.json`);
      TransText.addContent({ [lang]: langModule });
      TransText.setLanguage(lang);
    } catch (e) {
      const langModule = require(`./localize/langs/en.json`);
      TransText.addContent({ [lang]: langModule });
      TransText.setLanguage(lang);
    }
    this.data = this.jsonTraverse(appJson);
    if (this.data.appJson) {
      this.data.appJson = {
        app: addDefaults(this.data.appJson),
      };
    } else {
      this.data = {
        app: addDefaults(this.data),
      };
    }
    this.entities = entities;
    this.inplaceErrorMessage = false;
  }

  static isEmpty(val) {
    if (val === undefined) return true;
    if (
      typeof val == "function" ||
      typeof val == "number" ||
      typeof val == "boolean" ||
      Object.prototype.toString.call(val) === "[object Date]"
    )
      return false;
    if (val == null || val.length === 0) return true;
    return typeof val == "object" && Object.keys(val).length === 0;
  }

  jsonTraverse(obj) {
    for (const key in obj) {
      const value = obj[key];
      if (HippoValidator.isEmpty(value)) {
        delete obj[key];
      } else if (typeof value === "object") {
        this.jsonTraverse(value);
      }
    }
    return obj;
  }

  getLabel(path) {
    const regex = new RegExp(/\.?([a-zA-Z0-9]+)[\W\d]*?$/gm).exec(path || "");
    const message = regex?.[1] || path || "";
    return this.camelCaseToNormal(message);
  }

  camelCaseToNormal(message) {
    return message.replace(/([A-Z])/g, " $1").replace(/^./, function (str) {
      return str.toUpperCase();
    });
  }

  validate = (path) => {
    if (!this.data || typeof this.data != "object") {
      throw new TypeError("Invalid json data");
    }
    return this.newValidate(path);
  };
  newValidate = async (path) => {
    return new Promise((resolve, reject) => {
      let errors = [];
      this.inplaceErrorMessage = !!path;
      const node = new AppNode(this.data, this.entities);
      node.init([]);
      node.validate(errors, path);
      if (errors.length > 0) {
        reject({
          type: "ValidationException",
          errors: this.convertErrors(errors),
        });
      } else {
        resolve();
      }
    });
  };
  getViewIds = (isValue) => {
    if (isValue)
      return Object.keys(this.data?.views || {})?.map(
        (i) => i?.viewProps?.name
      );
    return Object.keys(this.data?.views || {});
  };

  getPageIds = (isValue) => {
    if (isValue)
      return Object.values(this.data?.views || {})
        .filter((it) => it.type === "page")
        ?.map((i) => i?.viewProps?.name || "");
    return Object.values(this.data?.views || {})
      .filter((it) => it.type === "page")
      .map((it) => {
        return it.id;
      });
  };

  getActions = (isValue) => {
    if (isValue)
      return Object.values(this.data?.actionGroups || {})?.map(
        (i) => i?.actions?.name
      );
    return Object.keys(this.data?.actionGroups || {});
  };

  getCardTypes = (isValue) => {
    if (isValue)
      return Object.values(this.data?.cardTypes || {})?.map((i) => i?.name);
    return Object.keys(this.data?.cardTypes || {});
  };

  getOneOfMessage = (names, e) => {
    return `${e?.label || e?.path} one of ${names?.join(", ")}`;
  };

  getFormIds = (isValue) => {
    if (isValue)
      return Object.values(this.data?.integrations?.incoming || {})?.map(
        (i) => i?.name
      );
    return Object.keys(this.data?.integrations?.incoming || {});
  };

  getRoles = (isValue) => {
    if (isValue)
      return Object.values(this?.data?.roles || {})?.map((i) => i?.name);
    return Object.keys(this?.data?.roles || {});
  };

  getEnvironments = () => {
    return Object.keys(this?.data?.environments);
  };

  getComponents = (isValue) => {
    if (isValue)
      return Object.values(this?.data?.components || {}).map((i) => i?.type);
    return Object.keys(this?.data?.components || {});
  };

  errorFlat = (errors) => {
    return errors.reduce((sumErrors, errorItem) => {
      if (
        !sumErrors?.some(
          (e) => e?.code === errorItem?.code && e?.path === errorItem?.path
        )
      ) {
        sumErrors.push(errorItem);
      }
      return sumErrors;
    }, []);
  };
  getInvalidValueErrorTitle = (errorType, label) => {
    switch (errorType) {
      case "oneOf":
      case "enumValue":
        return TransText.getTranslate(
          "valueIsDeletedByNode",
          this.camelCaseToNormal(label)
        );
      case "required":
        return TransText.getTranslate(
          "valueIsRequiredByNode",
          this.camelCaseToNormal(label)
        );
      default:
        return "";
    }
  };
  errorHumanize = (errors) => {
    return errors?.map((error) => {
      let message = error?.message || "";
      if (message.includes(error?.path)) {
        message = message.replace(
          error?.path,
          this.getLabel(error?.path, error?.params?.label)
        );
      }
      if (message.includes(error?.relativePath)) {
        message = message.replace(
          error?.relativePath,
          this.getLabel(error?.relativePath, error?.params?.label)
        );
      }
      const isCod = TransText.isTag(error?.code);
      const caseTitle = isCod
        ? TransText.getTranslate(error.code)
        : this.camelCaseToNormal(error?.code);
      return {
        ...error,
        message: message,
        errorTitle: error?.fieldLabel
          ? this.getInvalidValueErrorTitle(error?.code, error?.fieldLabel)
          : TransText.getTranslate("errorTitle", caseTitle),
      };
    });
  };
  static jsonPatchPathToQueryPath(path, seperator = "/") {
    let allPaths = path.split(seperator);
    allPaths = allPaths.filter(Boolean);
    let finalResult = "";
    let numRegExp = /^\d+$/;
    for (let i = 0; i < allPaths.length; i++) {
      let pathItem = allPaths[i];
      let val = null;
      if (numRegExp.test(pathItem)) {
        val = "[" + pathItem + "]";
      } else {
        val = pathItem;
      }
      // else{
      //     val = "[\""+pathItem+"\"]";
      // }
      if (val.charAt(0) === "[") {
        finalResult += val;
      } else {
        finalResult += finalResult.length === 0 ? val : "." + val;
      }
    }
    return finalResult;
  }
  static queryPathToJsonPath(path, seperator = ".") {
    if (!path) return null;
    let allPaths = (path || "").split(seperator);
    allPaths = allPaths.filter(Boolean);
    let finalResult = "";
    for (let i = 0; i < allPaths.length; i++) {
      let pathItem = allPaths[i];
      finalResult += "/" + pathItem.replace(/\[(\d*)\]/g, (m, i) => "/" + i);
    }
    return finalResult;
  }
  static normalizePath = (path) => {
    let processPath = path;
    processPath = HippoValidator.queryPathToJsonPath(processPath);
    processPath = HippoValidator.jsonPatchPathToQueryPath(processPath);
    return processPath;
  };
  convertErrors = (errors) => {
    errors = errors.map((error) => {
      let convertedError = {
        code: this.convertErrorCode(error.type),
        message: this.convertMessage(error),
        path: HippoValidator.normalizePath(error.path),
        fieldLabel: this.searchForLabelRegex(error?.message),
        relativePath: error?.relativePath,
        params: {
          value: error?.actual,
          originalValue: error?.actual,
          label: error.field,
          path: HippoValidator.normalizePath(error.path),
          values: this.convertActualValues(error),
          resolved: this.convertActualResolved(error),
        },
      };
      return convertedError;
    });
    errors = this.errorFlat(errors);
    errors = this.errorHumanize(errors);
    return errors;
  };
  convertErrorCode = (code) => {
    switch (code) {
      case "enumValue":
        return "oneOf";
      default:
        return code;
    }
  };
  convertActualValues = (error) => {
    const toIdsItem = (id, label) => {
      return {
        id,
        label: label,
      };
    };
    const collections = Object.values(
      this.data?.app?.cardCollections || {}
    )?.map((i) => toIdsItem(i?.id, i?.name));
    const roles = Object.values(this.data?.app?.roles || {})?.map((i) =>
      toIdsItem(i?.id, i?.name)
    );
    const views = Object.values(this.data?.app?.views || {})?.map((i) =>
      toIdsItem(i?.id, i?.viewProps?.name)
    );
    const forms = Object.values(
      this.data?.app?.integrations?.incoming || {}
    )?.map((i) => toIdsItem(i?.id, i?.name));
    const hippoFields = Object.values(
      this.data?.app?.fieldDefinitions?.hippoFields || {}
    )?.map((i) => toIdsItem(i?.id, i?.label));
    const appVariables = Object.values(
      this.data?.app?.fieldDefinitions?.appVariableFields || {}
    )?.map((i) => toIdsItem(i?.id, i?.label));
    const automations = Object.values(this.data?.app?.automations || {})?.map(
      (i) => toIdsItem(i?.id, i?.name)
    );
    const lists = (this.entities?.trelloLists || [])?.map((i) =>
      toIdsItem(i?.hippoId, i?.name)
    );
    const labels = (this.entities?.trelloLabels || [])?.map((i) =>
      toIdsItem(i?.hippoId, i?.name || i?.color || false)
    );
    const members = (this.entities?.members || [])?.map((i) =>
      toIdsItem(i?.hippoId || i?.id, i?.name)
    );
    const apps = (this.entities?.apps || [])?.map((i) =>
      toIdsItem(i?.id, i?.name)
    );
    const ids = [
      ...(roles || []),
      ...(apps || []),
      ...(collections || []),
      ...(views || []),
      ...(forms || []),
      ...(hippoFields || []),
      ...(appVariables || []),
      ...(automations || []),
      ...(lists || []),
      ...(labels || []),
      ...(members || []),
    ].filter(Boolean);
    const expected = error?.expected;
    const expectedType = typeof expected;
    if (Array.isArray(expected) || expectedType === "string") {
      let values = expected?.includes(", ")
        ? expected?.split(", ")
        : error?.expected;
      if (Array.isArray(values)) {
        values = values?.map(
          (id) => ids?.find((i) => i?.id === id)?.label || id
        );
        values = values.join(", ");
      } else {
        const trimValue = (values || "").trim();
        values = ids?.find((i) => i?.id === trimValue)?.label || values;
      }
      return values;
    }
    return expected;
  };

  convertActualResolved = (error) => {
    let values = error.expected;
    if (values && typeof values === "string") {
      values = values.split(",");
    }
    return values;
  };

  searchForLabelRegex = (message) => {
    const messageRegx = new RegExp(/{{{label\:(.*)\}\}\}/gm);
    const messageFound = messageRegx.exec(message || "");
    return messageFound?.[1] || false;
  };
  labelOneOfMultipleSelect = (label) => {
    return ["label", "member"].includes(label);
  };

  convertMessage = (error) => {
    const fieldLabel = this.searchForLabelRegex(error?.message);
    if (fieldLabel) {
      switch (error.type) {
        case "oneOf":
        case "enumValue":
          const isMultiple = this.labelOneOfMultipleSelect(fieldLabel);
          return TransText.getTranslate(
            isMultiple ? "removeDeletedField" : "chooseAnotherField",
            fieldLabel
          );
        case "notOneOf":
          return TransText.getTranslate(
            "mustNotBeOneOf",
            error?.label || error.field || "",
            this.convertActualValues(error)
          );
        case "notExists":
          return TransText.getTranslate("valueUsedCannotFound", error?.path);
        case "required":
          return TransText.getTranslate("selectFieldLabel", fieldLabel);
        default:
          return error.message;
      }
    } else {
      switch (error.type) {
        case "oneOf":
        case "enumValue":
          return TransText.getTranslate(
            "mustBeOneOf",
            error?.label || error.field || "",
            this.convertActualValues(error)
          );
        case "notOneOf":
          return TransText.getTranslate(
            "mustNotBeOneOf",
            error?.label || error.field || "",
            this.convertActualValues(error)
          );
        case "notExists":
          return TransText.getTranslate("valueUsedCannotFound", error?.path);
        case "uniqueValue":
          return TransText.getTranslate(
            "mustBeUniqNode",
            error?.label || error.field || ""
          );
        default:
          return error.message;
      }
    }
  };
}
