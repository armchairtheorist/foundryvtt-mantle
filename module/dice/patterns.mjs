/**
 * Pattern detection.
 *
 * Every roll in Momenta is read twice: once for successes, once for patterns.
 * There are three patterns — a Double (two dice of the same value), a Triple
 * (three of the same), and a Quad (four of the same).
 *
 * The subtle part is allocation. Each die may belong to at most one pattern, so
 * a roll frequently offers a choice rather than an answer. `5 5 5 5` is either
 * one Quad or two Doubles, never both, because both want the same dice. Every
 * pattern that *is* allocated triggers, and repeats count — `1 1 4 5 5` fires
 * the Double outcome twice.
 *
 * So this module enumerates every maximal allocation rather than picking one.
 * The chat card shows them and lets the player choose, because which allocation
 * is best depends on the abilities they hold: two Doubles are two Solid Hits,
 * which may well beat one Triple for a character with no Triple ability.
 *
 * Pure logic — no Foundry dependency, so it is unit-tested directly.
 */

const FACES = 6;

/**
 * @typedef {object} Pattern
 * @property {"double"|"triple"|"quad"} type
 * @property {number} value - The repeated face
 * @property {number[]} faces - The die faces this pattern consumes
 */

/**
 * @typedef {object} Allocation
 * @property {Pattern[]} patterns
 * @property {number[]} unused - Faces left over
 */

/**
 * Every pattern shape that could exist on a d6, in a fixed order. Enumerating
 * from a fixed list — rather than searching the dice — is what keeps the search
 * below from re-discovering the same allocation in a different order.
 *
 * @returns {Pattern[]}
 */
function allPatternShapes() {
  /** @type {Pattern[]} */
  const shapes = [];

  // Rarest first. The order only has to be fixed for the search to enumerate
  // each multiset once, but putting the big shapes first makes the recursion
  // find whole-hand allocations early.
  for (const [type, length] of [
    ["quad", 4],
    ["triple", 3],
    ["double", 2]
  ]) {
    for (let value = 1; value <= FACES; value++) {
      shapes.push({
        type: /** @type {"double"|"triple"|"quad"} */ (type),
        value,
        faces: new Array(/** @type {number} */ (length)).fill(value)
      });
    }
  }

  return shapes;
}

const SHAPES = allPatternShapes();

/**
 * Tally how many of each face were rolled.
 *
 * @param {number[]} faces
 * @returns {number[]} Index 1-6 holds the count of that face
 */
function tally(faces) {
  const counts = new Array(FACES + 1).fill(0);
  for (const face of faces) counts[face] += 1;
  return counts;
}

/**
 * @param {Pattern} shape
 * @param {number[]} counts
 */
function canTake(shape, counts) {
  const needed = tally(shape.faces);
  for (let face = 1; face <= FACES; face++) {
    if (counts[face] < needed[face]) return false;
  }
  return true;
}

/**
 * @param {Pattern} shape
 * @param {number[]} counts
 * @param {1|-1} direction
 */
function applyShape(shape, counts, direction) {
  for (const face of shape.faces) counts[face] -= direction;
}

/**
 * An allocation is maximal when no further pattern can be pulled from what is
 * left. Stopping early is never worthwhile — each allocated pattern triggers an
 * effect — so only maximal allocations are returned.
 *
 * @param {number[]} counts
 */
function isMaximal(counts) {
  return !SHAPES.some((shape) => canTake(shape, counts));
}

/**
 * Enumerate every maximal way to allocate dice to patterns.
 *
 * Results are ordered most useful first: more patterns beats fewer, since every
 * allocated pattern fires; ties break toward the rarer pattern types.
 *
 * @param {number[]} faces - The rolled die faces
 * @returns {Allocation[]}
 */
export function findAllocations(faces) {
  const counts = tally(faces);
  /** @type {Allocation[]} */
  const results = [];
  /** @type {Pattern[]} */
  const chosen = [];

  /**
   * Walk the fixed shape list. At each shape we may either stop taking it and
   * move on, or take one more and stay put — which enumerates every multiset of
   * patterns exactly once, without permutations of the same choice.
   *
   * @param {number} index
   */
  function search(index) {
    if (index === SHAPES.length) {
      if (isMaximal(counts)) {
        results.push({
          patterns: chosen.map((pattern) => ({ ...pattern })),
          unused: leftoverFaces(counts)
        });
      }
      return;
    }

    search(index + 1);

    const shape = SHAPES[index];
    if (canTake(shape, counts)) {
      applyShape(shape, counts, 1);
      chosen.push(shape);
      search(index);
      chosen.pop();
      applyShape(shape, counts, -1);
    }
  }

  search(0);

  /** @type {Record<string, number>} */
  const rank = { quad: 2, triple: 1, double: 0 };
  results.sort((a, b) => {
    if (a.patterns.length !== b.patterns.length) return b.patterns.length - a.patterns.length;
    /** @param {Allocation} allocation */
    const score = (allocation) =>
      allocation.patterns.reduce((sum, pattern) => sum + rank[pattern.type], 0);
    return score(b) - score(a);
  });

  return results;
}

/**
 * @param {number[]} counts
 * @returns {number[]}
 */
function leftoverFaces(counts) {
  const faces = [];
  for (let face = 1; face <= FACES; face++) {
    for (let n = 0; n < counts[face]; n++) faces.push(face);
  }
  return faces;
}

/**
 * Summarize an allocation as counts per pattern type, which is what an effect
 * actually keys off — "Triple: Bloodlust" fires once per allocated Triple.
 *
 * @param {Allocation} allocation
 * @returns {{double: number, triple: number, quad: number}}
 */
export function countPatterns(allocation) {
  const counts = { double: 0, triple: 0, quad: 0 };
  for (const pattern of allocation.patterns) counts[pattern.type] += 1;
  return counts;
}

/**
 * The allocation to show by default: the first, which is the most patterns and
 * so the most triggered effects. The player can pick another on the chat card.
 *
 * @param {number[]} faces
 * @returns {Allocation}
 */
export function bestAllocation(faces) {
  const allocations = findAllocations(faces);
  return allocations[0] ?? { patterns: [], unused: [...faces] };
}
