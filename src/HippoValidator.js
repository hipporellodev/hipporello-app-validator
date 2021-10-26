import * as yup from 'yup';
import _, {mapValues} from 'lodash';
import {lazy, string, number, mixed, object, array, boolean} from "yup";
import {getTriggerTextByType} from "@/Source/viewer/actions/actionsUtils";

export default class HippoValidator {
    constructor(appJson) {
        this.data = appJson
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
                    return {
                        message: error.message,
                        code: error.type,
                        params: error.params
                    }
                })
                reject(errors);
            })
        })

    }
    getRolesScheme = () => {
        return lazy(obj => yup.object(
            mapValues(obj, () => yup.object({
                id: yup.string().required(),
                name: yup.string().required(),
            }))
        ))
    }
    getCardTypesScheme = () => {
        return lazy(obj => yup.object(
            mapValues(obj, () => yup.object({
                id: yup.string().required(),
                name: yup.string().required(),
            }))
        ))
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
                "appHeader": mixed().oneOf(this.getViewIds()),
                "id": string().required(),
                "type": mixed().oneOf(["trelloCardBack", "webView"])
            }),
            "webView": object().shape({
                "appHeader": mixed().oneOf(this.getViewIds()),
                "home": mixed().oneOf(this.getViewIds()),
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
            cardType: mixed().oneOf(this.getCardTypes()).label('Action group card type'),
            props: object().shape({
                params: object().shape({
                    context: mixed().oneOf(["cardId", "parentCardId"]).nullable().default(null)
                }).nullable().default(null)
            }).concat(object().when("type", (type) => {
                switch (type) {
                    case "open-page":
                        return object().shape({
                            target: object().shape({
                                type: mixed().oneOf(["_self", "_blank"])
                            }),
                            type: mixed().oneOf(["internal", "external"]),
                            viewId: mixed().when("type", actionType => {
                                if (actionType === "internal") {
                                    return mixed().oneOf(this.getPageIds()).required()
                                }
                            }),
                            url: mixed().when("type", actionType => {
                                if (actionType === "external") {
                                    return string().required()
                                }
                            })
                        })
                    case "open-form":
                        return object().shape({
                            formId: mixed().oneOf(this.getFormIds()).required(),
                            target: this.getTargetScheme()
                        });

                }
            })).nullable().default(null),
            type: yup.mixed().oneOf([
              "move-card",
              "edit-card",
              "archive-card",
              "open-page",
              "open-form",
              "move-to",
              "archive",
              "send-conversation-message",
              "update-card-usercase",
              "assign-label",
              "assign-member"
            ]).required(),
            cardUpdateFields: mixed().when("type", type => {
                if (type === "update-card-usercase") {
                    return lazy(cardField => object(
                        mapValues(cardField, () => {
                            return yup.object({
                                type: mixed().oneOf(["replacement"]).required(),
                                value: string().required()
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
            }).nullable().default(null)
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
        ))
    }

    getComponentsScheme = () => {
        return lazy(obj => yup.object(
            mapValues(obj, () => this.getComponentScheme())
        ))
    }
    getDefinitionShape = () => {
        return lazy(obj => yup.object(
            mapValues(obj, () => {
                return object().shape({
                    id: string().required(),
                    label: string().required(),
                    multiple: boolean().required(),
                    type: mixed().oneOf(["string", "double", "long", "boolean", "attachment", "date"])
                })
            })
        ))
    }

    getIncomingScheme = () => {
        return lazy(obj => yup.object(
            mapValues(obj, (it) => this.getFormScheme())
        ))
    }
    getViewsScheme = () => {
        return lazy(obj => yup.object(
            mapValues(obj, (it) => this.getViewScheme())
        ))
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
            rules: lazy(rules => yup.object(
                mapValues(rules, (it) => {
                    return object().shape({
                        events: object().shape({
                            onTrigger: object().shape({
                                action: mixed().oneOf(this.getActions()),
                                id: string().required()
                            })
                        }),
                        id: string().required(),
                        order: number().required(),
                        /* @todo Typlar neler olacak */
                        trigger: object().shape({
                            type: mixed().oneOf([
                                "card-created",
                                "card-updated",
                                'moved',
                                'commented',
                                'more-info',
                                'user-reply',
                                'archived',
                            ])
                        })
                    })
                })
            ))
        });
    }
    getAutomationsScheme = () => {
        return lazy(obj => yup.object(
            mapValues(obj, (it) => this.getAutomationScheme())
        ))
    }

    createScheme = (data) => {
        let scheme = yup.object().shape({
            id: yup.string().required(),
            name: yup.string().required(),
            slug: yup.string().required(),
            boards: yup.array().of(yup.string()),
            sourceAppTemplateId: yup.string().nullable(),
            schemaVersion: yup.number().min(1).required(),
            description: yup.string().nullable(),
            roles: this.getRolesScheme(),
            cardTypes: this.getCardTypesScheme(),
            actionGroups: this.getActionGroupsScheme(),
            components: this.getComponentsScheme(),
            fieldDefinitions: object().shape({
                hippoFields: this.getDefinitionShape(),
                appVariableFields: this.getDefinitionShape()
            }),
            integrations: object().shape({
                incoming: this.getIncomingScheme()
            }),
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
                body: object().shape({
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
                                            /* @todo add other props */
                                            value: yup.mixed(),
                                        }).concat(object().when("type", type => {
                                            switch (element.input) {
                                                case "Button":
                                                    return object().shape({
                                                        settings: object().shape({
                                                            fluid: boolean()
                                                        })
                                                    }).concat(object().when("type", t => {
                                                        if (form.type === "form") {
                                                            return object().shape({
                                                                "mandatory-action": object().shape({
                                                                    "type": string().required(),
                                                                    variables: object().shape({
                                                                        cardType: mixed().oneOf(this.getCardTypes()).required(),
                                                                        description: string().required(),
                                                                        list: string().required(),
                                                                        name: string().required()
                                                                    })
                                                                }),
                                                                "other-actions": object().shape({
                                                                    action: mixed().oneOf(this.getActions()).required()
                                                                }).nullable().default(null)
                                                            })
                                                        }
                                                        return object().shape({});
                                                    }))
                                            }
                                        })).required()
                                    }).required()
                                }),
                            }))
                        })
                    )
                })
                    .concat(object().when("type", type => {
                        if (["updateform", "form"].includes(type)) {
                            return object().shape({
                                hippoFieldMapping: lazy(obj => yup.object(
                                    mapValues(obj, () => {
                                        return mixed().oneOf(this.getFieldDefinitions()).required()
                                    })
                                ))
                            })
                        }
                    }),),
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
                roles: array().of(mixed().oneOf(["hpadm", "hpnauth", "hpauth", "hpusr", "hptbrdadm", "hptbrdnrm", "hptbrdobs"].concat(this.getRoles())).required()),
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
        return yup.object().shape({
            id: yup.string().required(),
            boardId: yup.string().required()
        }).required()
    }

    getActionConditionsScheme = (data) => {
        return yup.array().of(yup.array().of(yup.object().shape({
            field: string().required(),
            operator: mixed().oneOf(["equals", "in", "not_in"]), /* @todo operatorler ve valueTypelar neler olacak */
            value: mixed().required(),
            valueType: mixed().oneOf(["variable", "value"])
        })));
    }
    getViewSettingsScheme = () => {
        return object().shape({
            portalViewSettingOverrides: object().shape({
                css: object().shape({
                    simple: object().shape({
                        "body-text-color": string().required(),
                        "font-family": string().required(),
                        "primary-color": string().required()
                    })
                }),
                "images": object().shape({
                    "banner": string(),
                    "logo": string(),
                    "socialShareImage": string()
                })
            })

        });
    }

    getChildrenScheme = () => lazy(child => {
        let viewSchem = object().shape({
            id: string().required(),
            view: lazy(col => object().shape({
                columns: array().of(viewSchem)
            })),
            children: lazy(it => this.getChildrenScheme()),
        })
        return array().of(
            viewSchem
        );
    });
    getComponentScheme = () => {
        const viewScheme = yup.object().shape({
            id: yup.string(),
            type: yup.mixed().oneOf([
                'snippet',
                'page',
                'CardDetailPage',
                'header',
                'paragraph',
                'list',
                'icon',
                'appList',
                'hyperlink',
                'image',
                'video',
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
            viewProps: yup.object().shape({
                name: yup.string(),
                gap: yup.number(),
                align: yup.mixed().oneOf(['left', 'right', 'center']),
                children: yup.array().of(yup.lazy(() => viewScheme)),
                events: yup.object().default(null).nullable().shape({
                    onClick: yup.object().shape({
                        id: yup.string().required(),
                        action: lazy(action => {
                            if (typeof action === "string" || action instanceof String) {
                                return mixed().oneOf(this.getActions())
                            } else {
                                return this.getComponentActionScheme()
                            }
                        })
                    }).nullable().default(null),
                    onReply: object().shape({
                        action: object().shape({
                            id: string().required(),
                            type: string().required()
                        })
                    }).nullable().default(null),
                }),

            }).concat(yup.object().when('type', (type) => {
                switch (type) {
                    case "appList":
                      return yup.object().shape({
                        viewType: yup.string().required(),
                        type: yup.string().oneOf(["all", "selected"]).required(),
                        showDescription: yup.boolean(),
                        selectedApps: yup.array().when("type", (type, scheme) => {
                          if (type === "selected") return scheme.required()
                          return scheme.nullable()
                        }),
                      })
                    case "header":
                        return yup.object().shape({
                            text: yup.string().required(),
                            heading: yup.mixed().oneOf(["h1", "h2", "h3", "h4", "h5", "h6"])
                        })
                    case "paragraph":
                        return yup.object().shape({
                            text: yup.string().required(),
                        })
                    case "hyperlink":
                        return yup.object().shape({
                            text: yup.string().required(),
                            url: yup.string(),
                        });
                    case "TrelloCardSharing":
                        return yup.object().shape({
                            "pageSize": number().nullable().default(null),
                            "query": object().shape({
                                "conditions": this.getActionConditionsScheme().nullable().default(null),
                                "type": mixed().oneOf(["basic"])
                            }),
                            "showExport": boolean(),
                            "showSearch": boolean()
                        });
                    case "table":
                        return yup.object().shape({
                            columns: yup.array().of(yup.object().shape({
                                header: yup.string().required(),
                                view: yup.lazy(() => viewScheme)
                            }))
                        })
                    case "date":
                        return object().shape({
                            format: string().required(),
                            text: string()
                        })
                    case "menuItem":
                        return object().shape({
                            text: string()
                        });
                    case "icon":
                        return object().shape({
                            family: string(),
                            name: string().required(),
                            size: number()
                        });
                    case "Conversation":
                        return object().shape({
                            "canAddQuickText": boolean(),
                            "canDeleteQuickText": boolean(),
                            "canEditQuickText": boolean(),
                            "canReply": boolean(),
                            "canUploadAttachment": boolean(),
                            "canUseQuickText": boolean(),
                            showMeta: boolean(),
                            showMetaDetail: boolean()
                        });
                    case "tableColumn":
                        return object().shape({
                            "field": string().when("sortable", (sortable, schema) => sortable ? schema.required() : schema),
                            "header": string(),
                            "sortable": boolean()
                        })
                    case "snippet":
                        return object().shape({
                            "css": string(),
                            "html": string().required(),
                            "name": string().required()
                        })
                    case "HippoFields":
                        return object().shape({
                            "allFields": boolean(),
                            "showSearch": boolean(),
                            "showUpdateWith": boolean(),
                            "target": this.getTargetScheme()
                        })
                    case "label":
                        return object().shape({
                            text: string().required()
                        })
                    case "button":
                        return object().shape({

                        })
                }
            }))
        });
        return viewScheme;
    }
    getViewScheme = () => {
        const viewScheme = yup.object().shape({
            id: yup.string(),
            type: yup.mixed().oneOf([
                "appHeader", "page", "thankspage"
            ]),
            accessRight: this.getAccessRightScheme().nullable().default(null),
            viewProps: yup.object().shape({
                name: yup.string(),
                gap: yup.number(),
                children: this.getChildrenScheme(),
                cardAware: boolean(),
                viewType: mixed().oneOf(["default", "tabs"]),
                visibilities: object().shape({
                    login: boolean(),
                    logo: boolean(),
                    menu: boolean()
                }),
                environments: array().of(mixed().oneOf(this.getEnvironments())).nullable().default(null),
            })
        });
        return viewScheme;
    }


    getViewIds = () => {
        return Object.keys(this.data?.views || {});
    }

    getPageIds = () => {
        return Object.values(this.data?.views || {}).filter(it => it.type == "page").map(it => {
            return it.id;
        });
    }

    getActions = () => {
        return Object.keys(this.data?.actionGroups || {});
    }

    getCardTypes = () => {
        return Object.keys(this.data?.cardTypes || {})
    }

    getFormIds = () => {
        return Object.keys(this.data?.integrations?.incoming || {});
    }

    getRoles = () => {
        return Object.keys(this?.data?.roles || {});
    }

    getFieldDefinitions = () => {
        return Object.keys(this?.data?.fieldDefinitions?.hippoFields || {});
    }

    getEnvironments = () => {
        return Object.keys(this?.data?.environments);
    }

}
