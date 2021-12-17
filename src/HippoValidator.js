import * as yup from 'yup';
import _, {isEmpty, mapValues} from 'lodash';
import {lazy, string, number, mixed, object, array, boolean} from "yup";

export default class HippoValidator {
    constructor(appJson) {
        this.data = this.jsonTraverse(appJson)
    }
    isEmpty(val) {
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
    jsonTraverse(obj){
      for(const key in obj) {
        const value = obj[key];
        if(this.isEmpty(value)) {
          delete obj[key];
        }
        else if(typeof value === "object") {
          this.jsonTraverse(value);
        }
      }
      return obj;
    }
    getLabel(path){
        const regex = new RegExp(/\.?([a-zA-Z0-9]+)$/gm).exec(path || "")
        const message = regex?.[1] || path || ""
        return this.camelCaseToNormal(message)
    }
    camelCaseToNormal (message) {
        return message.replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); })
    }
    validate = (cast = false) => {
        if (!this.data || typeof this.data != "object") {
            throw new TypeError("Invalid json data")
        }
        this.extendYup();
        this.yup = this.createScheme(this.data);
        return new Promise((resolve, reject) => {
            this.yup.validate(this.data, {
                abortEarly: false
            }).then(() => {
                if (cast) {
                    resolve(this.yup.cast(this.data, {stripUnknown: true}));
                }
                return resolve(this.data);
            }).catch(err => {
                let errors = [];
                errors = err?.inner?.map(error => {
                    let message = error?.message
                    if(message.includes(error?.path)){
                        message = message.replace(error?.path, this.getLabel(error?.path))
                    }
                    return {
                        message: message,
                        code: error.type,
                        errorTitle: this.camelCaseToNormal(`${error?.type}Error`),
                        params: error.params
                    }
                })
                reject({
                    type: "ValidationException",
                    errors: errors
                });
            })
        })

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


    /*
  {
       "someId":
           {
            "id": "someId",
            "name": "someName"
           }
   }
    */
    getCardTypesScheme = () => {
        return lazy(obj => yup.object(
            mapValues(obj, () => yup.object({
                id: yup.string().required(),
                name: yup.string().required(),
            }))
        ).nullable().default(null))
    }


    getTargetScheme = () => {
        return object().shape({
            type: mixed().oneOf(["_modal", "_blank", "_self"]),
            title: string(),
            size: mixed().when("type", type => {
                return type === "_modal" ? mixed().oneOf(["small", "medium", "large"]) : mixed()
            })
        })
    }

    getEnvironmentScheme = () => {
        return object().shape({
            "trelloCardBack": object().shape({
                "appHeader": mixed().oneOf(this.getViewIds(), this.getOneOfMessage.bind(this, this.getViewIds(true))),
                "id": string().required(),
                "type": mixed().oneOf(["trelloCardBack", "webView"])
            }),
            "webView": object().shape({
                "appHeader": mixed().oneOf(this.getViewIds(), this.getOneOfMessage.bind(this, this.getViewIds(true))),
                "home": mixed().oneOf(this.getViewIds(), this.getOneOfMessage.bind(this, this.getViewIds(true))),
                "id": string().required(),
                "type": mixed().oneOf(["trelloCardBack", "webView"])
            })
        })
    }

    getActionScheme = () => {
        return this.getComponentActionScheme().concat(object().shape({
            id: string().required(),
            order: number().required()
        }))
    }

    getComponentActionScheme = () => {
        return yup.object().shape({
            props: object().shape({
                cardType: mixed().oneOf(this.getCardTypes()).label('Action group card type'),
                cardUpdateFields: mixed().when("type", type => {
                  if (["update-hipporello-card", "update-trello-card"].includes(type)) {
                    return lazy(cardField => object(
                      mapValues(cardField, () => {
                        return yup.object({
                          type: mixed().oneOf(["replacement"]).required(),
                          value: mixed().required()
                        })
                      })
                    ))
                  }
                }),
                list: mixed().when("type", type => {
                  if (type === "move-to") {
                    return string().required()
                  }
                }),
                labels: mixed().when("type", type => {
                  if (type === "assign-label") {
                    return array().required()
                  }
                }),
                members: mixed().when("type", type => {
                  if (type === "assign-member") {
                    return array().required()
                  }
                }),
                message: mixed().when("type", type => {
                  if (type === "send-conversation-message") {
                    return string().required()
                  }
                }),
                subject: mixed().when("type", type => {
                  if (type === "send-conversation-message") {
                    return string().required()
                  }
                }),
                onSuccess: object().shape({
                  id: string().required(),
                  type: string().required()
                }).nullable().default(null),
                params: object().shape({
                    context: mixed().oneOf(["parent", "self", "children"]).nullable().default(null)
                }).nullable().default(null)
            }).concat(object().when("type", (type) => {
                switch (type) {
                    case "open-page":
                        return object().shape({
                            target: object().shape({
                                type: mixed().oneOf(["_self", "_blank", "_modal"])
                            }),
                            type: mixed().oneOf(["internal", "external"]),
                            viewId: mixed().when("type", actionType => {
                                if (actionType === "internal") {
                                    return mixed().oneOf(this.getPageIds(), this.getOneOfMessage.bind(this, this.getPageIds(true))).required()
                                }
                            }),
                            url: mixed().when("type", actionType => {
                                if (actionType === "external") {
                                    return string().required()
                                }
                            }),
                            params: mixed().when("viewId", viewId => {
                              if(this?.data?.views[viewId]?.viewProps?.cardAware){
                                return yup.object().shape({
                                  context: yup.string().oneOf(["parent", "self", "children"]).nullable(),
                                })
                              }
                            }).nullable()
                        })
                    case "open-form":
                        return object().shape({
                            formId: mixed().oneOf(this.getFormIds(), this.getOneOfMessage.bind(this, this.getFormIds(true))).required(),
                            target: this.getTargetScheme(),
                            params: mixed().when("formId", formId => {
                              if(!['form', 'email'].includes(this?.data?.integrations?.incoming?.[formId]?.type)){
                                return yup.object().shape({
                                  context: yup.string().oneOf(["parent", "self", "children"]).nullable(),
                                })
                              }
                            }).nullable()
                        });
                }
            })).nullable().default(null),
            type: yup.mixed().oneOf([
              "send-conversation-message",
              "update-hipporello-card",
              "update-trello-card",
              "add-comment",
              "open-form",
              "open-page",
              "update-card-members",
              "update-card-labels",
              "move-card",
              "archive-card"
            ]).required().label("Action Type"),
        })

    }

    getActionGroupsScheme = () => {
        return lazy(obj => yup.object(
            mapValues(obj, () => yup.object({
                id: yup.string().required(),
                name: yup.string().when("shared", (shared, schema) => shared ? schema.required() : schema),
                shared: yup.boolean(),
                title: yup.string(),
                actions: lazy(actionObj => yup.object(
                    mapValues(actionObj, () => this.getActionScheme())
                ))
            }))
        ).nullable().default(null))
    }

    getComponentsScheme = () => {
        return lazy(obj => yup.object(
            mapValues(obj, () => this.getComponentScheme())
        ).nullable().default(null))
    }
    getDefinitionShape = () => {
        return lazy(obj => yup.object(
            mapValues(obj, () => {
                return object().shape({
                    id: string().required(),
                    label: string().required(),
                    multiple: boolean().required(),
                    type: mixed().oneOf(["string", "double", "long", "boolean", "attachment", "date", "time"])
                })
            })
        ).nullable().default(null))
    }

    getIncomingScheme = () => {
        return lazy(obj => yup.object(
            mapValues(obj, (it) => this.getFormScheme())
        ))
    }
    getViewsScheme = () => {
        return lazy(obj => yup.object(
            mapValues(obj, (it) => this.getViewScheme())
        ).nullable().default(null))
    }

    getAutomationScheme = () => {
        return object().shape({
            id: string().required(),
            matching: object().shape({
                conditions: this.getActionConditionsScheme(),
                type: mixed().oneOf(["basic"]),
            }),
            name: string().required(),
            order: number().required(),
            rules: lazy(rules => {
              if (isEmpty(rules))
                return yup.mixed().test("required", "Rules must be at least one item", (value) => !isEmpty(value) )
              return yup.object().when("enabled", (value, schema) => {
                if(!value)
                  return schema.nullable()
                else
                  return yup.object(
                    mapValues(rules, (it) => {
                      return object().shape({
                        events: object().shape({
                          onTrigger: object().shape({
                            actionGroupId: mixed().oneOf(this.getActions(), this.getOneOfMessage.bind(this, this.getActions(true))).required(),
                            id: string().required()
                          })
                        }),
                        id: string().required(),
                        order: number().required(),
                        /* @todo Typlar neler olacak */
                        trigger: object().shape({
                          type: mixed().oneOf([
                            "card-created",
                            "moved",
                            "commented",
                            "archived",
                          ])
                        })
                      })
                    })
                  ).required()
              })
            })
        });
    }
    getAutomationsScheme = () => {
        return lazy(obj => yup.object(
            mapValues(obj, (it) => this.getAutomationScheme())
        ).nullable().default(null))
    }

    createScheme = (data) => {
        let scheme = yup.object().shape({
            id: yup.string().required(), // "something"
            name: yup.string().required(), // "something"
            slug: yup.string().required(), // "something"
            boards: yup.array().of(yup.string()),// ["something"]
            sourceAppTemplateId: yup.string().nullable(), // "something" | null
            schemaVersion: yup.number().min(1).required(), // 1
            description: yup.string().nullable(), // "something" | null
            roles: this.getRolesScheme(),
            cardTypes: this.getCardTypesScheme(),
            actionGroups: this.getActionGroupsScheme(),
            components: this.getComponentsScheme(),
            fieldDefinitions: object().shape({
                hippoFields: this.getDefinitionShape(),
                appVariableFields: this.getDefinitionShape()
            }).nullable().default(null),
            integrations: object().shape({
                incoming: this.getIncomingScheme()
            }).nullable().default(null),
            viewSettings: this.getViewSettingsScheme(),
            views: this.getViewsScheme(),
            environments: this.getEnvironmentScheme(),
            automations: this.getAutomationsScheme(),

        });
        return scheme;
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


    getFormScheme = () => {
        return lazy(form => {
            return yup.object().shape({
                aliases: array().of(string()),
                anonymous: boolean(),
                boardId: string(),
                showInTrello: boolean(),
                body: object().when("enabled", (value, schema) => {
                  if(!value) return schema.nullable();
                  else return schema.shape({
                    formAutoIncrementId: number().required(),
                    readOnly: boolean(),
                    rows: yup.array().of(
                      yup.object().shape({
                        id: yup.string().required(),
                        columns: yup.array().of(yup.object().shape({
                          id: yup.string().required(),
                          element: lazy(element => {
                            return yup.object().shape({
                              id: yup.string().required(),
                              props: yup.object().shape({
                                /* @todo add othe props */
                                value: yup.mixed(),
                              }).concat(object().when("type", type => {
                                switch (element.input) {
                                  case "Button":
                                    return object().shape({
                                      "optional-actionGroupId": lazy(t => {
                                        if (t) {
                                          return mixed().oneOf(this.getActions(), this.getOneOfMessage.bind(this, this.getActions(true)));
                                        }
                                        return mixed().nullable().default(null);
                                      }),
                                      settings: object().shape({
                                        fluid: string(),
                                        color: string(),
                                        backgroundColor: string(),
                                      }),
                                    }).concat(["form","email"].includes(form?.type) ? object().shape({
                                        "mandatory-action": object().shape({
                                          "type": string().required(),
                                          variables: object().shape({
                                            cardType: mixed().oneOf(this.getCardTypes(), this.getOneOfMessage.bind(this, this.getCardTypes(true))).required(),
                                            description: string().nullable(),
                                            list: string().required(),
                                            name: string().required()
                                          })
                                        }).nullable(),
                                      }) : null
                                    )
                                }
                              })).required()
                            }).required()
                          }),
                        }))
                      })
                    ).min(2, "Form must have at least 1 element")
                  }).concat(object().when("type", type => {
                      if (["updateform", "form", "email"].includes(type)) {
                        return object().shape({
                          hippoFieldMapping: lazy(obj => yup.object(
                            mapValues(obj, () => {
                              return mixed().oneOf(this.getFieldDefinitions(), this.getOneOfMessage.bind(this, this.getFieldDefinitions(true))).required()
                            })
                          ).required())
                        })
                      }
                    }),
                  ).concat(object())
                }),
                "email": string().when('type', (type, schema) => {
                    if (type === "email") {
                        return  schema.required()
                    }
                    else
                        return schema.nullable()
                }),
                "enabled": boolean(),
                "formatVersion": number().required(),
                "icon": string(),
                "id": string().required(),
                "name": string().required(),
                "type": mixed().oneOf(["form", "updateform", "email"]),
                "usesParent": boolean()
            })
        });
    }

    getAccessRightScheme = () => {
        return object().shape({
            roleRules: array().of(object().shape({
                roles: array().of(mixed().oneOf(["hpadm", "hpnauth", "hpauth", "hpusr", "hptbrdadm", "hptbrdnrm", "hptbrdobs"].concat(this.getRoles()), this.getOneOfMessage.bind(this, this.getRoles(true))).required()),
                type: mixed().oneOf(["allow", "disallow"]).required()
            })).nullable().default(null),
            dataRule: object().shape({
                conditions: this.getActionConditionsScheme(),
                type: mixed().oneOf(["basic"])
            }).nullable().default(null),
            cardTypes: array().of(mixed().oneOf(this.getCardTypes())).nullable().default(null)
        })
    }

    getFromListToListScheme = () => {
        return object().shape({
            id: string().required(),
            boardId: string().required()
        }).required()
    }

    getActionConditionsScheme = (data) => {
        return array().of(array().of(object().shape({
            field: string().required(),
            operator: mixed().oneOf([
              "equals",
              "notequals",
              "contains",
              "notcontains",
              "startswith",
              "notstartswith",
              "endswith",
              "notendswith",
              "lessthan",
              "lessthanequals",
              "greaterthan",
              "greaterthanequals",
              "in",
              "allin",
              "anyin",
              "notin",
              "empty",
              "notempty",
              "has",
              "doesnthave",
            ]),
            value: mixed().required(),
            valueType: mixed().oneOf(["variable", "value"])
        })));
    }
    getViewSettingsScheme = () => {
        return object().shape({
            appViewSettings : object({
                "icon" : object({
                    "background" : string().required(),
                    "iconSet" : string().oneOf(['fontAwesome']),
                    "name" :string().when("type", (type, schema) => type === "icon" ? schema.required() : schema),
                    "url" :string().when("type", (type, schema) => type === "image" ? schema.required() : schema),
                    "type" : string().oneOf(['icon','image'])
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
    getComponentScheme = () => {
        const viewPropsScheme = () => {
            const a =  yup.object().shape({
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
                                return this.getComponentActionScheme()
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
                                "conditions": this.getActionConditionsScheme().nullable().default(null),
                                "type": mixed().oneOf(["basic"])
                            }),
                            "showExport": boolean(),
                            "showSearch": boolean()
                        }));
                    case "table":
                        return schema.concat(object().shape({
                            columns: yup.array().of(yup.object().shape({
                                header: yup.string().required(),
                                view: yup.lazy(() => viewScheme)
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
                            "target": this.getTargetScheme()
                        }))
                    case "label":
                        return schema.concat(object().shape({
                            text: string().required()
                        }))
                    case "button":
                        return schema.concat(object().shape({}))

                }
            }));
            return a;
        }
        const viewScheme = yup.object().shape({
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
                "tableColumn",
                "menu",
                "HippoFields",
                "Conversation",
                "column",
                "columns"
            ]),
            accessRight: this.getAccessRightScheme().nullable().default(null),
            viewProps: viewPropsScheme()
        });
        return viewScheme;
    }
    getViewScheme = () => {
        const viewScheme = yup.object().shape({
            id: yup.string(),
            type: yup.mixed().oneOf([
                "appHeader", "page"
            ]).required(),
            accessRight: this.getAccessRightScheme().nullable().default(null),
            viewProps: yup.object().shape({
                name: yup.string(),
                gap: yup.number(),
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
        if(isValue)
            return Object.keys(this.data?.views || {})?.map(i => i?.viewProps?.name)
        return Object.keys(this.data?.views || {});
    }

    getPageIds = (isValue) => {
        if(isValue)
            return Object.values(this.data?.views || {}).filter(it => it.type == "page")?.map( i => i?.viewProps?.name || "")
        return Object.values(this.data?.views || {}).filter(it => it.type == "page").map(it => {
            return it.id;
        });
    }

    getActions = (isValue) => {
        if(isValue)
            return Object.values(this.data?.actionGroups || {})?.map( i => i?.actions?.name)
        return Object.keys(this.data?.actionGroups || {});
    }

    getCardTypes = (isValue) => {
        if(isValue)
            return Object.values(this.data?.cardTypes || {})?.map( i => i?.name)
        return Object.keys(this.data?.cardTypes || {})
    }

    getOneOfMessage = (names, e) => {
        return `${e?.label || e?.path} one of ${names?.join(', ')}`
    }

    getFormIds = (isValue) => {
        if(isValue)
            return Object.values(this.data?.integrations?.incoming || {})?.map( i => i?.name)
        return Object.keys(this.data?.integrations?.incoming || {});
    }

    getRoles = (isValue) => {
        if(isValue)
            return Object.values(this?.data?.roles || {})?.map( i => i?.name)
        return Object.keys(this?.data?.roles || {});
    }

    getFieldDefinitions = (isValue) => {
        if(isValue)
            return Object.values(this?.data?.fieldDefinitions?.hippoFields || {})?.map( i => i?.label)
        return Object.keys(this?.data?.fieldDefinitions?.hippoFields || {});
    }

    getEnvironments = () => {
        return Object.keys(this?.data?.environments);
    }

    getComponents = (isValue) => {
        if(isValue)
            return Object.values(this?.data?.components || {}).map( i => i?.type)
        return Object.keys(this?.data?.components || {});
    }

}
