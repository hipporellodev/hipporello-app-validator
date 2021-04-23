import * as yup from 'yup';

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
                errors = err.inner.map(error => {
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

    createScheme = (data) => {
        let accessRightScheme = this.getAccessRightScheme(data);
        let formScheme = this.getFormScheme(data);
        let scheme = yup.object().shape({
            id: yup.string().required(),
            accessRight: accessRightScheme.required(),
            schemaVersion: yup.number().min(1).required(),
            publishedAppId: yup.string(),
            name: yup.string().required(),
            slug: yup.string().required(),
            sourceAppTemplateId: yup.string(),
            homeViewId: yup.string().required(),
            roles: yup.array().of(yup.object().shape({
                id: yup.string().required(),
                name: yup.string().required(),
                members: yup.array().of(yup.object().shape({
                    type: yup.mixed().oneOf(['email', 'domain', 'emaildomain', "authenticated", "anonymous"]).required(),
                    value: yup.string().when("type", (type, schema) => {
                        switch (type) {
                            case "email":
                                return yup.string().email().required()
                            case "domain":
                                return yup.string().domain().required()
                            case "emaildomain":
                                return yup.string().emaildomain().required()
                        }
                    }),

                }))
            })).required(),
            boards: yup.array().of(yup.object().shape({
                hippoBoardId: yup.string().required(),
                trelloBoardId: yup.string(),
                provider: yup.mixed().oneOf(["trello"]).required(),
            })).required(),
            integrations: yup.object().shape({
                incoming: yup.array().of(yup.object().shape({
                    id: yup.string().required(),
                    type: yup.mixed().oneOf(['form', 'email']).required(),
                    //accessRight: yup.ref("accessRight"),
                    anonymous: yup.mixed().oneOf([0, 1]),
                    tags: yup.array().of(yup.string()),
                    body: yup.object().when("type", (type => {
                        if (type === "form") {
                            return formScheme;
                        }
                        return yup.mixed().nullable()
                    })),
                    details: yup.object().when("type", (type => {
                        if (type === "form") {
                            return yup.object().shape({
                                name: yup.string().required(),
                                aliases: yup.array().of(yup.object().shape({
                                    id: yup.string().required(),
                                    enabled: yup.boolean().required()
                                })),
                                icon: yup.string().required(),
                                postSubmissionView: yup.object().shape({
                                    type: yup.mixed().oneOf(["internal", "external"]),
                                    target: yup.object().shape({
                                        type: yup.string().required(),
                                    }),
                                    viewId: yup.mixed().oneOf(this.getViewIds()).required()
                                })
                            })
                        } else if (type === "email") {
                            return yup.object().shape({
                                email: yup.string(),
                                addAttachmentsToCard: yup.boolean()
                            })
                        }
                    }))
                })).required(),
                outgoing: yup.array().of(yup.object().shape({
                    id: yup.string().required(),
                    type: yup.mixed().oneOf(['email']).required(),
                    details: yup.object().shape({
                        protocol: yup.string().required(),
                        host: yup.string().domain().required(),
                        port: yup.number().required(),
                        ssl: yup.boolean(),
                        username: yup.string().required(),
                        password: yup.string().required()
                    })
                })).required()
            }).required(),
            "subscription-channels": yup.array().of(yup.object().shape({
                id: yup.string().required(),
                name: yup.string().required(),
                type: yup.mixed().oneOf(["email"]).required(),
                outgoingIntegrationId: yup.mixed().oneOf((data.integrations?.outgoing || []).map(it => it.id)).required()
            })),
            automations: yup.array().of(yup.object().shape({
                id: yup.string().required(),
                trigger: yup.object().shape({
                    type: yup.mixed().oneOf(["card-created", "card-moved"]),
                    matching: yup.object().shape({
                        type: yup.mixed().oneOf(["basic"]),
                        conditions: this.getActionConditionsScheme(data)
                    }),
                    inList: yup.mixed().when("type", (type) => {
                        switch (type) {
                            case "card-created":
                                return yup.object().shape({
                                    id: yup.string().required(),
                                    boardId: yup.string().required()
                                }).required()
                            default:
                                return yup.mixed().nullable()
                        }
                    }),
                    fromList: yup.mixed().when("type", (type) => {
                        switch (type) {
                            case "card-moved":
                                return this.getFromListToListScheme();
                            default:
                                return yup.mixed().nullable()
                        }
                    }),
                    toList: yup.mixed().when("type", (type) => {
                        switch (type) {
                            case "card-moved":
                                return this.getFromListToListScheme();
                            default:
                                return yup.mixed().nullable()
                        }
                    }),
                }),
                action: yup.object().shape({
                    type: yup.mixed().oneOf(["send-email", "notify-channel"]).required(),
                    details: yup.mixed().when("type", (type) => {
                        switch (type) {
                            case "send-email":
                                return yup.object().shape({
                                    outgoingIntegrationId: yup.mixed().oneOf((data.integrations.outgoing || []).map(it => it.id)).required(),
                                    subject: yup.string().required(),
                                    message: yup.string().required(),
                                    footerId: yup.string().required()
                                })
                            case "notify-channel":
                                return yup.object().shape({
                                    "channelId": yup.mixed().oneOf((data?.["subscription-channels"] || []).map(it => it.id)),
                                    "subject": yup.string().required(),
                                    "message": yup.string().required(),
                                    "footerId": yup.string().required()
                                })
                            default:
                                return yup.mixed().nullable()
                        }
                    }),
                    delay: yup.object().default(null).nullable().shape({
                        duration: yup.number().required(),
                        durationUnit: yup.mixed().oneOf(["m", "h", "s", "D", "M", "Y"]).required(),
                        matching: yup.object().shape({
                            type: yup.mixed().oneOf(["basic"]),
                            conditions: this.getActionConditionsScheme(data)
                        })
                    }).notRequired()
                }).required()
            })),
            uiActionGroups: yup.array().of(yup.object().shape({
                id: yup.string().required(),
                title: yup.string().required(),
                name: yup.string().required(),
                actions: yup.array().of(this.getActionScheme(this.data)).required()
            })),
            style: this.getStyleScheme(this.data),
            views: yup.array().of(this.getViewScheme(data))
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

    getFormScheme = (data) => {
        return yup.object().shape({
            lang: yup.string(),
            name: yup.string().required(),
            description: yup.string(),
            icon: yup.string(),
            readOnly: yup.boolean(),
            tags: yup.array().of(yup.string()),
            rows: yup.array().of(
                yup.object().shape({
                    id: yup.string().required(),
                    columns: yup.array().of(yup.object().shape({
                        id: yup.string().required(),
                        element: yup.object().shape({
                            id: yup.string().required(),
                            props: yup.object().shape({
                                /* @todo add other props */
                                value: yup.mixed().required(),
                            }).required()
                        }).required(),
                    }))
                })
            )
        });
    }

    getAccessRightScheme = (data) => {
        return yup.object().shape({
            rules: yup.array().of(yup.object().shape({
                type: yup.mixed().oneOf(["allow", "disallow"]),
                roles: yup.array().of(yup.mixed().oneOf((data.roles || []).map(it => it.id)))
            }))
        });
    }

    getFromListToListScheme = (data) => {
        return yup.object().shape({
            id: yup.string().required(),
            boardId: yup.string().required()
        }).required()
    }

    getActionConditionsScheme = (data) => {
        return yup.array().of(yup.array().of(yup.object().shape({
            field: yup.string().required(),
            operator: yup.mixed().oneOf(['equals']),
            value: yup.mixed().required()
        })));
    }

    getActionScheme = (data) => {
        return yup.object().shape({
            id: yup.string(),
            type: yup.mixed().oneOf(["move-card", "edit-card", "archive-card", "open-page", "open-form"]).required(),
            toList: yup.mixed().when("type", (type) => {
                if (["move-card"].includes(type)) {
                    return this.getFromListToListScheme(data);
                }
                return yup.mixed().nullable().default(null);
            }),
            onSuccess: yup.array().of(yup.object().shape({
                type: yup.string(),
                id: yup.string()
            })),
            onFail: yup.array().of(yup.object().shape({
                type: yup.string(),
                id: yup.string()
            })),
            props: yup.mixed().when("type", (type) => {
                if (type === "open-page") {
                    return yup.object().shape({
                        viewId: yup.mixed().oneOf(this.getViewIds()),
                        type: yup.mixed().oneOf(["internal", "external", "card-detail-page"]),
                        target: yup.object().shape({
                            type: yup.mixed().oneOf(["_self"])
                        })
                    })
                } else if (type === "open-form") {
                    return yup.object().shape({
                        formId: yup.string().required(),
                        target: yup.object().shape({
                            type: yup.mixed().oneOf(["_self", "_modal"]).required(),
                            size: yup.mixed().when("type", (type) => {
                                if (type === "_modal") {
                                    return yup.mixed().oneOf(["small", "medium", "large"])
                                }
                                return yup.mixed().nullable().default(null);
                            }),
                            title: yup.string().required(),

                        })
                    })
                }
                return yup.mixed().nullable().default(null);
            }),


        })
    }

    getStyleScheme = (data) => {
        return yup.object().shape({
            fontFamily: yup.string(),
            palette: yup.object().shape({
                bannerColor: yup.string(),
                bodyColor: yup.string(),
                fontColor: yup.string(),
                buttonBackgroundColor: yup.string(),
                buttonFontColor: yup.string(),
                linkFontColor: yup.string(),
                tableHeaderCellBackgroundColor: yup.string(),
                tableHeaderCellFontColor: yup.string(),
            })
        });
    }

    getViewScheme = (data) => {
        const viewScheme =  yup.object().shape({
            id: yup.string().required(),
            type: yup.mixed().oneOf([
                'snippet',
                'page',
                'CardDetailPage',
                'header',
                'paragraph',
                'list',
                'icon',
                'hyperlink',
                'image',
                'label',
                'button',
                'TrelloCardSharing',
                'table',
                'date',
                'dropdown',
                'row',
                'Image',
                'Header',
                'horizontalline'
            ]),
            accessRight: this.getAccessRightScheme(data),
            viewProps: yup.object().shape({
                name: yup.string(),
                gap: yup.number(),
                align: yup.mixed().oneOf(['left', 'right', 'center']),
                children: yup.array().of(yup.lazy(() => viewScheme)),
                events: yup.object().shape({
                    onClick: yup.mixed().oneOf(this.getActions()),
                })
            }).concat(yup.object().when('type', (type) => {
                switch (type) {
                    case "header":
                        return yup.object().shape({
                            text: yup.string().required(),
                            heading: yup.mixed().oneOf(["h1", "h2", "h3", "h4"])
                        })
                    case "paragraph":
                        return yup.object().shape({
                            text: yup.string().required(),
                        })
                    case "hyperlink":
                        return yup.object().shape({
                            text: yup.string().required(),
                            url: yup.string(),
                        })
                }
            }))
        });
        return viewScheme;
    }
    getViewIds = () => {
        return (this.data?.views || []).map(view => {
            return view.id;
        })
    }

    getActions = () => {
        return (this.data?.uiActionGroups || []).map(action => {
            return action.id;
        })
    }
}
