import {expect} from "@jest/globals";
import Validator from "fastest-validator";
import HippoValidator from "../src";

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
describe("Path Normalize Tests", () => {
  test("Object Array Issue", () => {
    const path = "app.integrations.incoming.HGGwl47JafSgI0P4KUXewi19JST9pXi5.body.rows.1.columns.0.element.props.description";
    const correctPath = "app.integrations.incoming.HGGwl47JafSgI0P4KUXewi19JST9pXi5.body.rows[1].columns[0].element.props.description";
    expect(HippoValidator.normalizePath(path)).toEqual(correctPath)
  })
  test("Array Validate", () => {
    const path = "app.integrations.incoming.HGGwl47JafSgI0P4KUXewi19JST9pXi5.body.rows[1].columns[0].element.props.description";
    const correctPath = "app.integrations.incoming.HGGwl47JafSgI0P4KUXewi19JST9pXi5.body.rows[1].columns[0].element.props.description";
    expect(HippoValidator.normalizePath(path)).toEqual(correctPath)
  })
  test("Json Patch Path To Query Path", () => {
    const path = "/app/integrations/incoming/HGGwl47JafSgI0P4KUXewi19JST9pXi5/body/rows/1/columns/0/element/props/description";
    const correctPath = "app.integrations.incoming.HGGwl47JafSgI0P4KUXewi19JST9pXi5.body.rows[1].columns[0].element.props.description";
    expect(HippoValidator.normalizePath(path)).toEqual(correctPath)
  })
})