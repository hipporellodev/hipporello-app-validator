import HippoValidator from "../src/HippoValidator";
import appJson from "../mocks/app.json";

describe("Hippo Validator Test", () => {
    let hippoValidator;

    test("Invalid app.json ", () => {
        expect(() => {
            hippoValidator.validate()
        }).toThrow(Error);
    })
    test("Invalid object", () => {
        hippoValidator = new HippoValidator("test");
        expect(() => {
            hippoValidator.validate()
        }).toThrow(Error);
    })
    test("Perfectly configured json", async () => {
        expect.assertions(1);
        hippoValidator = new HippoValidator(appJson);
        await hippoValidator.validate().then(() => {
            expect(1).toEqual(1);
        })
    })
    test("Has no id", async () => {
        expect.assertions(1);
        let data = Object.assign({}, appJson);
        delete data.id;
        hippoValidator = new HippoValidator(data);
        await hippoValidator.validate().catch(err => {
            expect(err).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        params: {
                            "path": "id"
                        }
                    })
                ])
            )
        });
    })

    test("Check role doesnt exists", async () => {
        expect.assertions(1)
        let json = cloneJson(appJson);
        json.roles = [
            {
                id: "test"
            },
            {
                id: "uuid-candidate-role"
            }
        ]
        hippoValidator = new HippoValidator(json);
        await hippoValidator.validate().catch(err => {
            expect(err).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        "params": expect.objectContaining({"path": "accessRight.rules[0].roles[0]"})
                    })
                ])
            )
        });
    });
    test("Invalid roles data", async () => {
        expect.assertions(1);
        let json = cloneJson(appJson);
        json.roles = [
            {
                "id": "test-role",
                "name": 5,
                "members": [
                    {
                        type: "email",
                        value: "canerergun.net"
                    },
                    {
                        type: "domain",
                        value: "kadir@canerergun.net"
                    }
                ]
            }
        ]
        hippoValidator = new HippoValidator(json);
        await hippoValidator.validate().catch(err => {
            expect(err).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        params: expect.objectContaining({
                            "path": "roles[0].members[0].value",

                        }),
                        "code": "email"
                    }),
                    expect.objectContaining({
                        params: expect.objectContaining({
                            "path": "roles[0].members[1].value",

                        }),"code": "domain"
                    })
                ])
            )
        });
    })
    test("Test invalid board data", async () => {
        expect.assertions(1);
        let json = cloneJson(appJson);
        json.boards = [
            {
                trelloBoardId: {},
                provider: "random"
            }
        ]
        hippoValidator = new HippoValidator(json);
        await hippoValidator.validate().catch(err => {
            expect(err).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        params: expect.objectContaining({
                            "path": "boards[0].hippoBoardId",

                        }),
                        "code": "required"
                    }),
                    expect.objectContaining({
                        params: expect.objectContaining({
                            "path": "boards[0].trelloBoardId",

                        }),
                        "code": "typeError"
                    }),
                    expect.objectContaining({
                        params: expect.objectContaining({
                            "path": "boards[0].provider",

                        }),
                        "code": "oneOf"
                    }),
                ])
            )
        });
    })
    test("Test invalid integration data", async () => {
        expect.assertions(1);
        let json = cloneJson(appJson);
        json.integrations = {
            incoming: [
                {
                    "id": null,
                    "type": "another",
                },
                {
                    id: "123123",
                    type: "email",
                    details: {
                        "email": {},
                        "addAttachmentsToCard": "caner"
                    }
                }
            ]
        }
        hippoValidator = new HippoValidator(json);
        await hippoValidator.validate().catch(err => {
            expect(err).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        params: expect.objectContaining({
                            "path": "integrations.incoming[0].id",

                        }),
                        "code": "typeError"
                    }),
                    expect.objectContaining({
                        params: expect.objectContaining({
                            "path": "integrations.incoming[0].type",

                        }),
                        "code": "oneOf"
                    }),
                    expect.objectContaining({
                        params: expect.objectContaining({
                            "path": "integrations.outgoing",

                        }),
                        "code": "required"
                    }),
                    expect.objectContaining({
                        params: expect.objectContaining({
                            "path": "integrations.incoming[1].details.email",

                        }),
                        "code": "typeError"
                    }),
                    expect.objectContaining({
                        params: expect.objectContaining({
                            "path": "integrations.incoming[1].details.addAttachmentsToCard",

                        }),
                        "code": "typeError"
                    }),
                ])
            )
        });
    });
    test("Invalid action delay", async () => {
        expect.assertions(1);
        let json = cloneJson(appJson);
        json.automations = [
            {
                "id": "uuid-automation2",
                "trigger": {
                    "type": "card-moved",
                    "matching": {
                        "type": "basic",
                        "conditions": [
                            [
                                {
                                    "field": "formId",
                                    "operator": "equals",
                                    "value": "b77a4b6d9c5b475aa795b71b0e08ebbb"
                                }
                            ]
                        ]
                    },
                    "fromList": {
                        "id": "trelloListId-DraftJobAdvertisements",
                        "boardId": "trelloBoardId"
                    },
                    "toList": {
                        "id": "trelloListId-PublishedJobAdvertisements",
                        "boardId": "trelloBoardId"
                    }
                },
                "action": {
                    "type": "notify-channel",
                    "delay": {
                        "duration": "invalid",
                        "durationUnit": "month",
                        "matching": {
                            "type": "basic",
                            "conditions": [
                                [
                                    {
                                        "field": "idList",
                                        "operator": "equals",
                                        "value": "trelloListId-PublishedJobAdvertisements"
                                    },
                                    {
                                        "field": "idBoard",
                                        "operator": "equals",
                                        "value": "trelloBoardId"
                                    }
                                ]
                            ]
                        }
                    },
                    "details": {
                        "channelId": "uuid-new-positions-notification",
                        "subject": "New Position Available!",
                        "message": "A new position is available on our Open Positions page. Check it out!",
                        "footerId": "3c68705b613042e1a48fb0a6bbfde23d"
                    }
                }
            }
        ];
        hippoValidator = new HippoValidator(json);
        await hippoValidator.validate().catch((err) => {
            expect(err).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        params: expect.objectContaining({
                            "path": "automations[0].action.delay.durationUnit",

                        }),
                        "code": "oneOf"
                    }),
                    expect.objectContaining({
                        params: expect.objectContaining({
                            "path": "automations[0].action.delay.duration",

                        }),
                        "code": "typeError"
                    }),

                ])
            )
        })
    });
    describe("Test casting scenarios", () => {
        test("Test with casting data", async () => {
            expect.assertions(1);
            let json = cloneJson(appJson);
            json.unnecessary = "Remove this";
            hippoValidator = new HippoValidator(json);
            await hippoValidator.validate(true).then((newJson) => {
                expect(newJson.unnecessary).toBeUndefined()
            })
        })

        test("Test without casting data", async () => {
            expect.assertions(1);
            let json = cloneJson(appJson);
            json.unnecessary = "Unremoved";
            hippoValidator = new HippoValidator(json);
            await hippoValidator.validate().then((newJson) => {
                expect(newJson.unnecessary).toBe("Unremoved");
            })
        });

        test('aa', () => {
            let a = "he isa a very is tall boy";
            let limit = 5;
            let b = a.substr(0,limit).split(" ");
            let c = b.filter((it, index) => a.includes(it)).join(" ");
            console.log(c);
        })
    })
});

const shuffle = input => input.toString().split('').reduce((acc, item, index, data) =>
    acc.concat((index % 2 ? data.slice().reverse() : data)[Math.floor(index / 2)]), []
).join('');
const cloneJson = (json) => {
    return Object.assign({}, json);
}
