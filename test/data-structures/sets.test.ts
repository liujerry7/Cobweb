import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as Sets from "../../src/data-structures/sets.ts";

function set(...values: string[]): ReadonlySet<string> {
  return new Set(values);
}

function assertValues(actual: ReadonlySet<string>, expected: string[]): void {
  assert.deepEqual([...actual].sort(), [...expected].sort());
}

// ---------------------------------------------------------------------------------------------------------------------

describe("making one", () => {
  test("make with no values is empty", () => {
    assertValues(Sets.make(), []);
  });

  test("make keeps each value once", () => {
    assertValues(Sets.make(["a", "b", "a"]), ["a", "b"]);
  });

  test("make copies its values, so later changes to the source don't leak in", () => {
    const source = new Set(["a"]);
    const made = Sets.make(source);
    source.add("b");
    assertValues(made, ["a"]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("reading", () => {
  test("isEmpty", () => {
    assert.equal(Sets.isEmpty(set()), true);
    assert.equal(Sets.isEmpty(set("a")), false);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("changing", () => {
  test("add adds the value", () => {
    assertValues(Sets.add(set("a"), "b"), ["a", "b"]);
  });

  test("adding a value that is already there returns the same set", () => {
    const s = set("a");
    assert.equal(Sets.add(s, "a"), s);
  });

  test("remove removes the value", () => {
    assertValues(Sets.remove(set("a", "b"), "a"), ["b"]);
  });

  test("removing a value that isn't there returns the same set", () => {
    const s = set("a");
    assert.equal(Sets.remove(s, "b"), s);
  });

  test("toggle adds a missing value and removes a present one", () => {
    assertValues(Sets.toggle(set("a"), "b"), ["a", "b"]);
    assertValues(Sets.toggle(set("a", "b"), "b"), ["a"]);
  });

  test("addAll adds every value", () => {
    assertValues(Sets.addAll(set("a"), ["b", "c"]), ["a", "b", "c"]);
  });

  test("addAll returns the same set when every value is already there", () => {
    const s = set("a", "b");
    assert.equal(Sets.addAll(s, ["a", "b"]), s);
  });

  test("removeAll removes every value", () => {
    assertValues(Sets.removeAll(set("a", "b", "c"), ["a", "c", "d"]), ["b"]);
  });

  test("removeAll returns the same set when no value is there", () => {
    const s = set("a");
    assert.equal(Sets.removeAll(s, ["b", "c"]), s);
  });

  test("clear empties the set", () => {
    assertValues(Sets.clear(set("a", "b")), []);
  });

  test("clearing an empty set returns the same set", () => {
    const s = set();
    assert.equal(Sets.clear(s), s);
  });

  test("filter keeps the values that pass", () => {
    assertValues(
      Sets.filter(set("a", "bb", "ccc"), (value) => value.length > 1),
      ["bb", "ccc"],
    );
  });

  test("filter returns the same set when every value passes", () => {
    const s = set("a", "b");
    assert.equal(
      Sets.filter(s, () => true),
      s,
    );
  });

  test("map transforms every value", () => {
    assertValues(
      Sets.map(set("a", "b"), (value) => value.toUpperCase()),
      ["A", "B"],
    );
  });

  test("map merges values that transform to the same result", () => {
    assertValues(
      Sets.map(set("a", "A"), (value) => value.toLowerCase()),
      ["a"],
    );
  });

  test("map can change the value type", () => {
    const lengths = Sets.map(set("a", "bb"), (value) => value.length);
    assert.deepEqual([...lengths].sort(), [1, 2]);
  });

  test("inputs are left unchanged", () => {
    const s = new Set(["a", "b"]);
    Sets.add(s, "c");
    Sets.remove(s, "a");
    Sets.toggle(s, "b");
    Sets.addAll(s, ["d"]);
    Sets.removeAll(s, ["a"]);
    Sets.clear(s);
    Sets.filter(s, () => false);
    assertValues(s, ["a", "b"]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("combining", () => {
  const ab = set("a", "b");
  const bc = set("b", "c");

  test("union has the values in either set", () => {
    assertValues(Sets.union(ab, bc), ["a", "b", "c"]);
  });

  test("intersection has the values in both sets", () => {
    assertValues(Sets.intersection(ab, bc), ["b"]);
  });

  test("difference has the values in the first set only", () => {
    assertValues(Sets.difference(ab, bc), ["a"]);
    assertValues(Sets.difference(bc, ab), ["c"]);
  });

  test("symmetricDifference has the values in exactly one set", () => {
    assertValues(Sets.symmetricDifference(ab, bc), ["a", "c"]);
  });

  test("combining with an empty set", () => {
    assertValues(Sets.union(ab, set()), ["a", "b"]);
    assertValues(Sets.intersection(ab, set()), []);
    assertValues(Sets.difference(ab, set()), ["a", "b"]);
    assertValues(Sets.symmetricDifference(ab, set()), ["a", "b"]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("comparing", () => {
  test("isSubset is true when every value of the first is in the second", () => {
    assert.equal(Sets.isSubset(set("a"), set("a", "b")), true);
    assert.equal(Sets.isSubset(set("a", "b"), set("a", "b")), true);
    assert.equal(Sets.isSubset(set(), set("a")), true);
    assert.equal(Sets.isSubset(set("a", "c"), set("a", "b")), false);
  });

  test("isSuperset is isSubset the other way round", () => {
    assert.equal(Sets.isSuperset(set("a", "b"), set("a")), true);
    assert.equal(Sets.isSuperset(set("a"), set("a", "b")), false);
  });

  test("isDisjoint is true when no value is in both", () => {
    assert.equal(Sets.isDisjoint(set("a"), set("b")), true);
    assert.equal(Sets.isDisjoint(set(), set()), true);
    assert.equal(Sets.isDisjoint(set("a", "b"), set("b")), false);
  });

  test("equals ignores order", () => {
    assert.equal(Sets.equals(set("a", "b"), set("b", "a")), true);
    assert.equal(Sets.equals(set(), set()), true);
  });

  test("equals is false for different sizes or different values", () => {
    assert.equal(Sets.equals(set("a"), set("a", "b")), false);
    assert.equal(Sets.equals(set("a", "b"), set("a", "c")), false);
  });
});
