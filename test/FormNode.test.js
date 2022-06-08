import HippoValidator from "../src/HippoValidator";
import {expect} from "@jest/globals";
import formNodeJson from "../mocks/FormNode.json"



describe("Form Test", () => {
  let hippoValidator;
  test("Error Form Card Collections", async () => {
    expect.assertions(1);
    const tempFormJson = formNodeJson
    tempFormJson.integrations.incoming["1232342343345"] = {
      "accessRight": {
        "roleRules": [
          {
            "roles": [
              "hptbrdadm",
              "hptbrdobs"
            ],
            "type": "allow"
          }
        ]
      },
      "anonymous": false,
      "boardId": "6259448c63a568397f0019bd",
      "body": {
        "formAutoIncrementId": 2,
        "rows": [
          {
            "columns": [
              {
                "element": {
                  "id": "elem1",
                  "input": "Button",
                  "props": {
                    "label": "Button",
                    "mandatory-action": {
                      "type": "create-card",
                      "variables": {
                        "description": "",
                        "list": "0bc0cf30eccc41c08d54d687d0156d60",
                        "name": "sfd"
                      }
                    },
                    "name": "Button",
                    "settings": {
                      "fluid": true
                    },
                    "value": "Submit"
                  }
                },
                "id": "col-1"
              }
            ],
            "id": "row-1"
          }
        ],
        "successViews": {
          "elem1": {
            "id": "zScJ7J",
            "props": {
              "view": {
                "id": "G6DkiM",
                "target": {
                  "type": "inline"
                }
              }
            },
            "type": "view"
          }
        }
      },
      "enabled": true,
      "formatVersion": 2,
      "icon": "align-justify",
      "id": "jphYc052JLzzj19ZO45OL8UunNxR2Ev3",
      "name": "CreateForm3(UsesParent)3",
      "showInTrello": true,
      "slug": "createform3usesparent",
      "type": "updateform",
      "usesParent": true
    }

    hippoValidator = new HippoValidator(tempFormJson);
    try{
     const a = await hippoValidator.validate()
    }catch (e) {
      expect(e.errors.length).toBeGreaterThan(0)
    }
  })
})
