import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cedulaOk, documentOk, documentProblem, rucOk } from "./text";

describe("cedulaOk", () => {
  it("acepta cédulas con verificador correcto", () => {
    assert.equal(cedulaOk("1710034065"), true);
    assert.equal(cedulaOk("0926687856"), true);
  });

  it("rechaza un verificador cambiado", () => {
    assert.equal(cedulaOk("1710034066"), false);
  });

  it("rechaza provincias y terceros dígitos imposibles", () => {
    assert.equal(cedulaOk("9910034065"), false);
    assert.equal(cedulaOk("1760034065"), false);
  });

  it("rechaza lo que no tiene diez dígitos", () => {
    assert.equal(cedulaOk("171003406"), false);
    assert.equal(cedulaOk(""), false);
  });
});

describe("rucOk", () => {
  it("acepta un RUC de persona natural", () => {
    assert.equal(rucOk("1710034065001"), true);
  });

  it("rechaza el establecimiento 000", () => {
    assert.equal(rucOk("1710034065000"), false);
  });

  it("acepta sociedades y entidades públicas por su forma", () => {
    assert.equal(rucOk("1790012345001"), true);
    assert.equal(rucOk("1760001234001"), true);
  });
});

describe("documentOk", () => {
  it("deja pasar pasaportes alfanuméricos", () => {
    assert.equal(documentOk("pasaporte", "AB123456"), true);
    assert.equal(documentOk("pasaporte", "AB1"), false);
  });
});

describe("documentProblem", () => {
  it("no dice nada cuando el documento está bien", () => {
    assert.equal(documentProblem("cedula", "1710034065"), null);
  });

  it("dice cuántos dígitos faltan o sobran", () => {
    assert.match(documentProblem("cedula", "17100340") ?? "", /10 dígitos y escribiste 8/);
  });

  it("con diez dígitos y el tercero de empresa, lo dice en vez de hablar del largo", () => {
    const problem = documentProblem("cedula", "1287563498") ?? "";
    assert.match(problem, /tercer dígito/);
    assert.doesNotMatch(problem, /10 dígitos/);
  });

  it("con diez dígitos y el verificador mal, habla del último dígito", () => {
    assert.match(documentProblem("cedula", "1710034064") ?? "", /último dígito/);
  });
});
