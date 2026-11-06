export function make<T>(values: Iterable<T> = []): ReadonlySet<T> {
  return new Set(values);
}

// ---------------------------------------------------------------------------------------------------------------------

export function isEmpty<T>(set: ReadonlySet<T>): boolean {
  return set.size === 0;
}

// ---------------------------------------------------------------------------------------------------------------------

export function add<T>(set: ReadonlySet<T>, value: T): ReadonlySet<T> {
  if (set.has(value)) {
    return set;
  }

  const copy = new Set(set);
  copy.add(value);
  return copy;
}

export function remove<T>(set: ReadonlySet<T>, value: T): ReadonlySet<T> {
  if (!set.has(value)) {
    return set;
  }

  const copy = new Set(set);
  copy.delete(value);
  return copy;
}

export function toggle<T>(set: ReadonlySet<T>, value: T): ReadonlySet<T> {
  if (set.has(value)) {
    return remove(set, value);
  }
  return add(set, value);
}

export function addAll<T>(set: ReadonlySet<T>, values: Iterable<T>): ReadonlySet<T> {
  const copy = new Set(set);
  for (const value of values) {
    copy.add(value);
  }
  return sameIfUnchanged(set, copy);
}

export function removeAll<T>(set: ReadonlySet<T>, values: Iterable<T>): ReadonlySet<T> {
  const copy = new Set(set);
  for (const value of values) {
    copy.delete(value);
  }
  return sameIfUnchanged(set, copy);
}

export function clear<T>(set: ReadonlySet<T>): ReadonlySet<T> {
  if (isEmpty(set)) {
    return set;
  }
  return new Set<T>();
}

export function filter<T>(set: ReadonlySet<T>, keep: (value: T) => boolean): ReadonlySet<T> {
  const kept = new Set<T>();
  for (const value of set) {
    if (keep(value)) {
      kept.add(value);
    }
  }
  return sameIfUnchanged(set, kept);
}

export function map<T, U>(set: ReadonlySet<T>, transform: (value: T) => U): ReadonlySet<U> {
  const mapped = new Set<U>();
  for (const value of set) {
    mapped.add(transform(value));
  }
  return mapped;
}

// ---------------------------------------------------------------------------------------------------------------------

export function union<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): ReadonlySet<T> {
  return addAll(a, b);
}

export function intersection<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): ReadonlySet<T> {
  return filter(a, (value) => b.has(value));
}

export function difference<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): ReadonlySet<T> {
  return filter(a, (value) => !b.has(value));
}

export function symmetricDifference<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): ReadonlySet<T> {
  return union(difference(a, b), difference(b, a));
}

// ---------------------------------------------------------------------------------------------------------------------

export function isSubset<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
  for (const value of a) {
    if (!b.has(value)) {
      return false;
    }
  }
  return true;
}

export function isSuperset<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
  return isSubset(b, a);
}

export function isDisjoint<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
  for (const value of a) {
    if (b.has(value)) {
      return false;
    }
  }
  return true;
}

export function equals<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
  return a.size === b.size && isSubset(a, b);
}

// ---------------------------------------------------------------------------------------------------------------------

function sameIfUnchanged<T>(original: ReadonlySet<T>, changed: ReadonlySet<T>): ReadonlySet<T> {
  if (equals(original, changed)) {
    return original;
  }
  return changed;
}
