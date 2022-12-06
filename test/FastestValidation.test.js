import {expect} from "@jest/globals";
import Validator from "fastest-validator";

describe("Fastest Validator Test", () => {
  test("Empty value test", () => {
    const a = new Validator().compile({
      text: "string|empty:false|trim"
    })
    const errors = a({text: "         "})
    expect(errors).toEqual([{"actual": "", "field": "text", "message": "The 'text' field must not be empty.", "type": "stringEmpty"}])
  })
  test("Empty value test true", () => {
    const a = new Validator().compile({
      text: "string|empty:true"
    })
    const errors = a({text: ""})
    expect(errors).toEqual(true)
  })

})