import * as yup from 'yup';
import _, {isEmpty, mapValues} from 'lodash';
import {lazy, string, number, mixed, object, array, boolean} from "yup";
import {APP_SLUG_BLACKLIST, PAGE_SLUG_BLACKLIST} from "./constants";
import AppNode from "./nodes/AppNode";

function getDefaultCardType() {
    return {
        id: "default",
        name: "Default"
    }
}

function addDefaults(originalApp) {
    if (!originalApp.cardTypes) {
        originalApp.cardTypes = {
            default: getDefaultCardType()
        }
    } else {
        originalApp.cardTypes.default = getDefaultCardType();
    }
    return originalApp;
}

export default class HippoValidator {
    constructor(appJson, entities) {
        this.data = this.jsonTraverse(appJson);
        if (this.data.appJson) {
            this.data.appJson = {
                app: addDefaults(this.data.appJson)
            };
        } else {
            this.data = {
                app: addDefaults(this.data)
            }
        }
        this.entities = entities;
        /*this.actionConditionsScheme = this.getActionConditionsScheme();
        this.accessRightScheme = this.getAccessRightScheme();
        this.rolesScheme = this.getRolesScheme();
        this.cardTypesScheme = this.getCardTypesScheme();
        this.targetScheme = this.getTargetScheme();
        this.environmentScheme = this.getEnvironmentScheme();
        this.componentActionScheme = this.getComponentActionScheme();
        this.actionScheme = this.getActionScheme();
        this.actionGroupsScheme = this.getActionGroupsScheme();
        this.componentsScheme = this.getComponentsScheme();
        this.definitionScheme = this.getDefinitionShape();
        this.incomingScheme = this.getIncomingScheme();
        this.viewsScheme = this.getViewsScheme();
        this.automationScheme = this.getAutomationScheme();
        this.viewSettingsScheme = this.getViewSettingsScheme();
        this.viewPropsScheme = this.getViewPropsScheme()
        this.viewComponentScheme = this.getComponentScheme();
        this.formScheme = this.getFormScheme();*/

    }

    static isEmpty(val) {
        if (val === undefined)
            return true;
        if (typeof (val) == 'function' || typeof (val) == 'number' || typeof (val) == 'boolean' || Object.prototype.toString.call(val) === '[object Date]')
            return false;
        if (val == null || val.length === 0)
            return true;
        if (typeof (val) == "object" && Object.keys(val).length === 0) {
            return true
        }
        return false;
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

    getLabel(path, label) {
        const regex = new RegExp(/\.?([a-zA-Z0-9]+)[\W\d]*?$/gm).exec(path || "")
        const message = regex?.[1] || path || ""
        return this.camelCaseToNormal(message)
    }

    camelCaseToNormal(message) {
        return message.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) {
            return str.toUpperCase();
        })
    }

    validate = (cast = false) => {
        if (!this.data || typeof this.data != "object") {
            throw new TypeError("Invalid json data")
        }
        return this.newValidate();
        // this.extendYup();
        // this.yup = this.createScheme(this.data);
        // return new Promise((resolve, reject) => {
        //     this.yup.validate(this.data, {
        //         abortEarly: false
        //     }).then(() => {
        //         if (cast) {
        //             resolve(this.yup.cast(this.data, {stripUnknown: true}));
        //         }
        //         return resolve(this.data);
        //     }).catch(err => {
        //         let errors = [];
        //         errors = err?.inner?.map(error => {
        //             let message = error?.message
        //             if (message.includes(error?.path)) {
        //                 message = message.replace(error?.path, this.getLabel(error?.path))
        //             }
        //             return {
        //                 message: message,
        //                 code: error.type,
        //                 errorTitle: this.camelCaseToNormal(`${error?.type}Error`),
        //                 params: error.params
        //             }
        //         })
        //         reject({
        //             type: "ValidationException",
        //             errors: errors
        //         });
        //     })
        // })

    }
    /*
   {
       "someId":
           {
            "id": "someId",
            "name": "someName"
           }
   }
    */
    getRolesScheme = () => {
        return lazy(obj => yup.object(
            mapValues(obj, () => yup.object({
                id: yup.string().required(),
                name: yup.string().required(),
            }))
        ).nullable().default(null))
    }
    getCardTypesScheme = () => {
        return lazy(obj => yup.object(
            mapValues(obj, () => yup.object({
                id: yup.string().required(),
                name: yup.string().required(),
            }))
        ).nullable().default(null))
    }
    newValidate = async () => {
        return new Promise((resolve, reject) => {
            let errors = [];
            const node = new AppNode(this.data);
            node.init([],  this.entities)
            node.validate(errors);
            if (errors.length > 0) {
                reject({
                    type: 'ValidationException',
                    errors: this.convertErrors(errors)
                });
            } else {
                resolve();
            }

        })
    }



    extendYup = () => {
        let domainPatterns = {
            domain: /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/,
            punycode: /^([A-Za-z0-9](?:(?:[-A-Za-z0-9]){0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:(?:[-A-Za-z0-9]){0,61}[A-Za-z0-9])?)*)(\.?)$/,
            cyrillicDomain: /^((http|https):\/\/)?[a-zа-я0-9]+([\-\.]{1}[a-zа-я0-9]+)*\.[a-zа-я]{2,5}(:[0-9]{1,5})?(\/.*)?$/i,
            ipv4: /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
            ipv6: /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]+|::(ffff(:0{1,4})?:)?((25[0-5]|(2[0-4]|1?[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1?[0-9])?[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1?[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1?[0-9])?[0-9]))$/,
        }

        let emailDomainPattern = /^@(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/
        yup.addMethod(yup.string, "domain", function (errorMessage = "Invalid domain") {
            return this.test(`domain`, errorMessage, function (value) {
                const {path, createError} = this;
                const domainRules = [domainPatterns.domain, domainPatterns.punycode, domainPatterns.cyrillicDomain];

                return (value === null || value === '' || value === undefined) || domainRules.some(regex => regex.test(value)) || createError({
                    path,
                    message: path + " must be valid domain"
                })
            });
        });
        yup.addMethod(yup.string, "emaildomain", function (errorMessage = "Invalid email domain") {
            return this.test(`emaildomain`, errorMessage, function (value) {
                const {path, createError} = this;
                return (value === null || value === '' || value === undefined) || emailDomainPattern.test(value) || createError({
                    path,
                    message: path + " must be valid email domain"
                })
            });
        });
    }

    getViewSettingsScheme = () => {
        return object().shape({
            appViewSettings: object({
                "icon": object({
                    "background": string().required(),
                    "iconSet": string().oneOf(['fontAwesome']),
                    "name": string().when("type", (type, schema) => type === "icon" ? schema.required() : schema),
                    "url": string().when("type", (type, schema) => type === "image" ? schema.required() : schema),
                    "type": string().oneOf(['icon', 'image'])
                })
            }),
            portalViewSettingOverrides: object().shape({
                css: object().shape({
                    simple: object().shape({
                        "body-text-color": string(),
                        "font-family": string(),
                        "primary-color": string()
                    })
                }),
                "images": object().shape({
                    "banner": string(),
                    "logo": string(),
                    "socialShareImage": string()
                })
            }).nullable()

        });
    }

    getChildrenScheme = () => lazy(child => {
        let viewSchem = object().shape({
            id: string().required(),
            view: lazy(col => object().shape({
                columns: array().of(viewSchem)
            })),
            children: array().of(mixed().oneOf(this.getComponents(), this.getOneOfMessage.bind(this, this.getComponents(true))))
        })
        return array().of(
            viewSchem
        );
    });
    getViewPropsScheme = () => {
        return yup.object().shape({
            name: yup.string(),
            gap: yup.number(),
            align: yup.mixed().oneOf(['left', 'right', 'center']),
            //children: yup.array().of(yup.lazy(() => viewScheme)),
            events: yup.object().default(null).nullable().shape({
                onClick: yup.object().shape({
                    id: yup.string().required(),
                    action: lazy(action => {
                        if (!action) {
                            return mixed().nullable().default(null)
                        }
                        if (typeof action === "string" || action instanceof String) {
                            return mixed().oneOf(this.getActions()).required();
                        } else {
                            return this.componentActionScheme.defined()
                        }
                    }),
                    actionGroupId: lazy(groupId => {
                        if (!groupId) {
                            return mixed().nullable().default(null)
                        }
                        return mixed().oneOf(this.getActions(), this.getOneOfMessage.bind(this, this.getActions(true))).required();
                    })
                }).nullable().default(null),
                onReply: object().shape({
                    action: object().shape({
                        id: string().required(),
                        type: string().required()
                    })
                }).nullable().default(null),
            }),
        }).concat(yup.object().when('type', (type, schema) => {
            switch (type) {
                case "formList":
                    return schema.concat(object().shape({
                        viewType: yup.string().required(),
                        type: yup.string().oneOf(["all", "selected"]).required(),
                        showDescription: yup.boolean(),
                        selectedForms: yup.array().when("type", (type, scheme) => {
                            if (type === "selected") return scheme.required()
                            return scheme.nullable()
                        }),
                    }))
                case "appList":
                    return schema.concat(object().shape({
                        viewType: yup.string().required(),
                        type: yup.string().oneOf(["all", "selected"]).required(),
                        showDescription: yup.boolean(),
                        selectedApps: yup.array().when("type", (type, scheme) => {
                            if (type === "selected") return scheme.required()
                            return scheme.nullable()
                        }),
                    }))
                case "header":
                    return schema.concat(object().shape({
                        text: yup.string().required(),
                        heading: yup.mixed().oneOf(["h1", "h2", "h3", "h4", "h5", "h6"])
                    }))
                case "paragraph":
                    return schema.concat(object().shape({
                        text: yup.string().required(),
                    }))
                case "hyperlink":
                    return schema.concat(object().shape({
                        text: yup.string().required(),
                        url: yup.string(),
                    }));
                case "TrelloCardSharing":
                    return schema.concat(object().shape({
                        "pageSize": number().nullable().default(null),
                        "query": object().shape({
                            "conditions": this.actionConditionsScheme.defined().nullable().default(null),
                            "type": mixed().oneOf(["basic"])
                        }),
                        "showExport": boolean(),
                        "showSearch": boolean()
                    }));
                case "table":
                    return schema.concat(object().shape({
                        columns: yup.array().of(yup.object().shape({
                            header: yup.string().required(),
                            view: yup.lazy(() => this.viewComponentScheme.defined())
                        }))
                    }))
                case "date":
                    return schema.concat(object().shape({
                        format: string().required(),
                        text: string()
                    }))
                case "menuItem":
                    return schema.concat(object().shape({
                        text: string()
                    }));
                case "icon":
                    return schema.concat(object().shape({
                        family: string(),
                        name: string().required(),
                        size: number()
                    }));
                case "Conversation":
                    return schema.concat(object().shape({
                        "canAddQuickText": boolean(),
                        "canDeleteQuickText": boolean(),
                        "canEditQuickText": boolean(),
                        "canReply": boolean(),
                        "canUploadAttachment": boolean(),
                        "canUseQuickText": boolean(),
                        showMeta: boolean(),
                        showMetaDetail: boolean()
                    }));
                case "tableColumn":
                    return schema.concat(object().shape({
                        "field": string().when("sortable", (sortable, schema) => sortable ? schema.required() : schema),
                        "header": string(),
                        "sortable": boolean()
                    }))
                case "snippet":
                    return schema.concat(object().shape({
                        "css": string(),
                        "html": string().required(),
                        "name": string().required()
                    }))
                case "HippoFields":
                    return schema.concat(object().shape({
                        "allFields": boolean(),
                        "showSearch": boolean(),
                        "showUpdateWith": boolean(),
                        "target": this.targetScheme.defined()
                    }))
                case "label":
                    return schema.concat(object().shape({
                        text: string().required()
                    }))
                case "button":
                    return schema.concat(object().shape({}))

            }
        }));

    }
    getComponentScheme = () => {
        return yup.object().shape({
            id: yup.string(),
            type: yup.mixed().oneOf([
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
                "cardMenuItem",
                "tableColumn",
                "menu",
                "HippoFields",
                "Conversation",
                "column",
                "columns"
            ]),
            accessRight: this.accessRightScheme.defined().nullable().default(null),
            viewProps: this.viewPropsScheme.defined()
        });
    }
    getViewScheme = () => {
        return yup.object().shape({
            id: yup.string(),
            type: yup.mixed().oneOf([
                "appHeader", "page"
            ]).required(),
            accessRight: this.accessRightScheme.defined().nullable().default(null),
            viewProps: yup.object().when('type', (type, schema) => {
                return yup.object().shape({
                    name: yup.string(),
                    gap: yup.number(),
                    slug: type === "page"
                        ? yup.string().when("environments", (environments, schema) => {
                            if (environments?.includes("webView")) {
                                return schema.notOneOf(PAGE_SLUG_BLACKLIST).matches(/^[A-Za-z0-9]+(?:-[+A-Za-z0-9]+)*$/).required()
                            } else return schema
                        })
                        : yup.string(),
                    children: this.getViewChildrenShape(),
                    cardAware: boolean(),
                    viewType: mixed().oneOf(["default", "tabs"]),
                    visibilities: object().when("type", (type) => {
                        if (type === "appHeader") {
                            return object().shape({
                                login: boolean(),
                                logo: boolean(),
                                menu: boolean()
                            })
                        }
                        return mixed().nullable().default(null);
                    }),
                    environments: array().of(mixed().oneOf(this.getEnvironments())).nullable().default(null),
                })
            })
        });
        return viewScheme;
    }

    getViewChildrenShape = () => {
        return array().of(object().shape({
            id: mixed().oneOf(this.getComponents()),
            children: lazy(() => this.getViewChildrenShape()),
            view: lazy(() => {
                return object().shape({
                    id: mixed().oneOf(this.getComponents()),
                    children: lazy(() => this.getViewChildrenShape()),
                }).nullable().default(null)
            })
        })).nullable().default(null);
    }


    getViewIds = (isValue) => {
        if (isValue)
            return Object.keys(this.data?.views || {})?.map(i => i?.viewProps?.name)
        return Object.keys(this.data?.views || {});
    }

    getPageIds = (isValue) => {
        if (isValue)
            return Object.values(this.data?.views || {}).filter(it => it.type == "page")?.map(i => i?.viewProps?.name || "")
        return Object.values(this.data?.views || {}).filter(it => it.type == "page").map(it => {
            return it.id;
        });
    }

    getActions = (isValue) => {
        if (isValue)
            return Object.values(this.data?.actionGroups || {})?.map(i => i?.actions?.name)
        return Object.keys(this.data?.actionGroups || {});
    }

    getCardTypes = (isValue) => {
        if (isValue)
            return Object.values(this.data?.cardTypes || {})?.map(i => i?.name)
        return Object.keys(this.data?.cardTypes || {})
    }

    getOneOfMessage = (names, e) => {
        return `${e?.label || e?.path} one of ${names?.join(', ')}`
    }

    getFormIds = (isValue) => {
        if (isValue)
            return Object.values(this.data?.integrations?.incoming || {})?.map(i => i?.name)
        return Object.keys(this.data?.integrations?.incoming || {});
    }

    getRoles = (isValue) => {
        if (isValue)
            return Object.values(this?.data?.roles || {})?.map(i => i?.name)
        return Object.keys(this?.data?.roles || {});
    }

    getFieldDefinitions = (isValue) => {
        if (isValue)
            return Object.values(this?.data?.fieldDefinitions?.hippoFields || {})?.map(i => i?.label)
        return Object.keys(this?.data?.fieldDefinitions?.hippoFields || {});
    }

    getEnvironments = () => {
        return Object.keys(this?.data?.environments);
    }

    getComponents = (isValue) => {
        if (isValue)
            return Object.values(this?.data?.components || {}).map(i => i?.type)
        return Object.keys(this?.data?.components || {});
    }


    errorFlat = (errors) => {
      const goToError =  errors.reduce((sumErrors, errorItem) => {
        if(!sumErrors?.some(e => e?.code === errorItem?.code && e?.path === errorItem?.path)){
          sumErrors.push(errorItem)
        }
        return sumErrors
      }, [])
      return goToError
    }
    errorHumanize = (errors) => {
      return errors?.map(error => {
        let message = error?.message||""
        if (message.includes(error?.path)) {
          message = message.replace(error?.path, this.getLabel(error?.path, error?.params?.label))
        }
        if (message.includes(error?.relativePath)) {
          message = message.replace(error?.relativePath, this.getLabel(error?.relativePath, error?.params?.label))
        }
        return {
          ...error,
          message: message,
          errorTitle: this.camelCaseToNormal(`${error?.code}Error`),
        }
      })
    }
    convertErrors = (errors) => {
        errors = errors.map(error => {
            let convertedError = {
                code: this.convertErrorCode(error.type),
                message: this.convertMessage(error),
                path: error.path,
                relativePath: error?.relativePath,
                params: {
                    value: error?.actual,
                    originalValue: error?.actual,
                    label: error.field,
                    path: error.path,
                    values: this.convertActualValues(error),
                    resolved: this.convertActualResolved(error)
                }
            }
            return convertedError;
        })
        errors = this.errorFlat(errors)
        errors = this.errorHumanize(errors)
        return errors;
    }
    convertErrorCode = (code) => {
        switch (code) {
            case 'enumValue':
                return 'oneOf';
            default:
                return code;
        }
    }
    convertActualValues = (error) => {
        const toIdsItem = (id, label) => {
          return {
            id,
            label: label
          }
        }
        const collections = Object.values(this.data?.app?.cardCollections||{})?.map(i => toIdsItem(i?.id, i?.name))
        const views = Object.values(this.data?.app?.views||{})?.map(i => toIdsItem(i?.id, i?.viewProps?.name))
        const forms = Object.values(this.data?.app?.integrations?.incoming||{})?.map(i => toIdsItem(i?.id, i?.name))
        const hippoFields = Object.values(this.data?.app?.fieldDefinitions?.hippoFields||{})?.map(i => toIdsItem(i?.id, i?.label))
        const appVariables = Object.values(this.data?.app?.fieldDefinitions?.appVariableFields||{})?.map(i => toIdsItem(i?.id, i?.label))
        const automations = Object.values(this.data?.app?.automations||{})?.map(i => toIdsItem(i?.id, i?.name))
        const lists = (this.entities.trelloLists||[])?.map(i => toIdsItem(i?.hippoId, i?.name))
        const labels = (this.entities.trelloLabels||[])?.map(i => toIdsItem(i?.hippoId, i?.name||i?.color||false))
        const members = (this.entities.members||[])?.map(i => toIdsItem(i?.hippoId||i?.id, i?.name))
        const ids = [
          ...(collections||[]),
          ...(views||[]),
          ...(forms||[]),
          ...(hippoFields||[]),
          ...(appVariables||[]),
          ...(automations||[]),
          ...(lists||[]),
          ...(labels||[]),
          ...(members||[]),
        ].filter(Boolean)
        const expected = error?.expected
        const expectedType = typeof expected;
        if(Array.isArray(expected) || expectedType === "string"){
          let values = expected?.includes(", ") ? expected?.split(', ') : error?.expected;
          if (Array.isArray(values)) {
            values = values?.map(id => ids?.find(i => i?.id === id)?.label||id)
            values = values.join(', ');
          } else{
              const trimValue = (values||"").trim()
              values = ids?.find(i => i?.id === trimValue)?.label||values
          }
          return values;
        }
        return expected;
    }

    convertActualResolved = (error) => {
        let values = error.expected;
        if (values && typeof values === 'string') {
            values = values.split(',');
        }
        return values;
    }
    convertMessage = (error) => {
        switch (error.type) {
            case 'oneOf':
            case 'enumValue':
                return `${error.field} must be one of ${this.convertActualValues(error)}`
            case 'notExists':
                return `The value used in '${error?.path}' could not be found`
            default:
                return error.message;
        }
    }
}
