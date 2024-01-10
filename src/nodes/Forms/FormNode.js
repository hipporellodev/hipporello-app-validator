import AbstractHippoNode from "../AbstractHippoNode";
import PageNode from "../Views/PageNode";
import FormInputNode from "./FormInputNode";
import VisibilityNode from "../AccessRights/VisibilityNode";
import CollectionNode from "../AccessRights/CollectionNode";
import getValidator from "../../Utils/getValidator";
import {TransText} from "../../localize/localize";
export default class FormNode extends AbstractHippoNode {
  constructor(appJson, path) {
    super(appJson, path);
  }
  process(appJson, path, nodeJson) {
    if (nodeJson?.enabled) {
      let successViewObj = nodeJson.body?.successViews || {};
      let successView = Object.values(successViewObj || {});
      if (
        (successView && successView?.[0]?.props?.type === "view") ||
        successView?.[0]?.type === "view"
      ) {
        const pageId = successView?.[0]?.props?.view?.id;
        this.addChildNode(new PageNode(appJson, "app.views." + pageId));
      }
      if (nodeJson?.accessRight?.dataRule?.conditions) {
        this.addChildNode(
          new VisibilityNode(appJson, `${path}.accessRight.dataRule`)
        );
      }
      if (nodeJson?.type === "update" || nodeJson?.usesParent) {
        this.addChildNode(
          new CollectionNode(appJson, `${path}.accessRight.dataRule`)
        );
      }
      nodeJson?.body?.rows.forEach((row, rowIndex) => {
        if (row?.columns?.length) {
          row?.columns.forEach((column, colIndex) => {
            this.addChildNode(
              new FormInputNode(
                appJson,
                `${this.path}.body.rows.${rowIndex}.columns.${colIndex}.element`,
                column?.element?.id,
                nodeJson
              )
            );
            // if(column?.element?.input === "Button"){
            //   this.addChildNode(new FormButtonNode(appJson, `${this.path}.body.rows.${rowIndex}.columns.${colIndex}.element`, nodeJson?.type))
            // }
            // else{
            //
            // }
          });
        }
      });
    }
  }

  getValidatorFunction() {
    const hippoFieldIds = this.getHippoFields(true);
    const cardCollectionsIds = this.getCollections();
    const incomings = this.getFormIds(
      true,
      (item) => item?.id !== this?.nodeJson?.id
    );
    const formSlugs = incomings?.map((item) => item?.slug);
    function uniqueCheck(value, errors, schema, path, parentNode) {
      if (formSlugs.includes(value)) {
        errors.push({ type: "unique", message: TransText.getTranslate('mustBeUniqNode', TransText.getTranslate('formSlug')) });
      }
      return value;
    }
    const buttonsEl = this.childNodes?.find(
      (a) => a.nodeJson?.input === "Button"
    )?.nodeJson;
    const elementIds = this.childNodes?.reduce((a, i) => {
      if (
        !i.nodeJson?.props?.schema?.type ||
        i.nodeJson?.props?.name === "Captcha"
      )
        return a;
      a[i?.id] = {
        type: "object",
        label: i?.nodeJson?.props?.label,
        props: {
          hippoField: {
            type: "object",
            optional: true,
            props: {
              targetField: {
                type: "enum",
                values: hippoFieldIds,
              },
              operation: {
                type: "enum",
                values: ["set"],
              },
            },
          },
          trelloCardField: {
            type: "object",
            optional: true,
            props: {
              targetField: {
                type: "enum",
                values: ["label", "name", "description", "startDate", "dueDate", "list", "dueComplete"],
              },
              operation: {
                type: "enum",
                values: ["set", "keepexcluded"],
              },
            },
          },
          trelloCardCustomField: {
            type: "object",
            optional: true,
          },
        },
      };
      return a;
    }, {});
    let objectValidation = null;
    function validURL(str) {
      const regex =
        /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/;
      let m = regex.exec(str);
      return m !== null;
    }
    function urlCheck(value, errors) {
      if (validURL(value)) {
        return value;
      } else {
        errors.push({
          type: "not valid",
          message: TransText.getTranslate("validate.url", {field: TransText.getTranslate('externalUrl')}),
        });
        return "";
      }
    }
    if (this.nodeJson?.body?.successViews?.[buttonsEl?.id]?.type === "page") {
      objectValidation = {
        page: {
          type: "object",
          props: {
            url: {
              type: "custom",
              check: urlCheck,
            },
            target: {
              type: "enum",
              optional: true,
              values: ["_self", "_blank"],
            },
          },
        },
      };
    } else {
      objectValidation = {
        view: {
          type: "object",
          props: {
            id: "string",
            target: {
              type: "object",
              props: {
                type: "string",
              },
            },
          },
        },
      };
    }
    const formCheck = getValidator({
      useNewCustomCheckerFunction: true,
    }).compile({
      id: "string|empty:false",
      anonymous: "boolean|optional",
      enabled: "boolean|optional",
      formatVersion: "number",
      icon: "string|empty:false",
      name: "string|empty:false",
      type: {
        type: "enum",
        values: ["form", "updateform"],
      },
      aliases: "array|optional",
      usesParent: "boolean|optional",
      slug: {
        type: "custom",
        check: uniqueCheck,
      },
      boardId: "string|optional|empty:false",
      showInTrello: "boolean|optional",
      body: {
        type: "object",
        props: {
          formAutoIncrementId: "number",
          readOnly: "boolean|optional",
          rows: {
            type: "array",
            min: 2,
            messages: {
              arrayMin: TransText.getTranslate('formAtLeastElement'),
            },
            items: {
              type: "object",
              props: {
                id: "string",
                columns: {
                  type: "array",
                  items: {
                    type: "object",
                    props: {
                      id: "string",
                      element: {
                        type: "object",
                        props: {
                          id: "string",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          successViews: {
            type: "object",
            props: {
              [buttonsEl?.id]: {
                type: "object",
                props: {
                  id: "string|optional",
                  type: {
                    type: "enum",
                    values: ["page", "view"],
                  },
                  props: {
                    type: "object",
                    props: objectValidation,
                  },
                },
              },
            },
          },
          fieldMapping: Object?.keys(elementIds)?.length
            ? {
                type: "object",
                props: elementIds,
              }
            : {
                type: "object",
                optional: true,
              },
        },
      },
      submitter: {
        type: "object",
        optional: true,
        props: {
          type: "string",
        },
      },
    });
    const errors = [];
    const submitterCheck = getValidator().compile({
      submitter: {
        type: "object",
        props: {
          type: "string",
          field: "string",
        },
      },
    });
    if (
      this.nodeJson?.submitter?.type === "specifiedEmail" &&
      !this?.nodeJson?.submitter?.field
    ) {
      errors.pushArray(submitterCheck(this.nodeJson));
    }
    if (this.nodeJson?.enabled) {
      if (!this.nodeJson.body.fieldMapping) {
        this.nodeJson.body.fieldMapping = {};
      }
      errors.pushArray(formCheck(this.nodeJson));
    }

    return errors;
  }
}
