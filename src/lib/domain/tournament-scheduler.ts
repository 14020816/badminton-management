import type { MatchCategory, MemberRank } from "@prisma/client";
import type {
  GeneratedBracket,
  GeneratedMatch,
  ScheduleGenerationResult,
  SchedulerMember,
  TournamentScheduleConfig,
} from "@/lib/domain/tournament-match";

const RANK_ORDER: Record<MemberRank, number> = {
  S: 0,
  A: 1,
  B: 2,
  C: 3,
  D: 4,
};

const UNRANKED_TIER = 5;

export function rankOrder(rank: MemberRank | null): number {
  if (!rank) return UNRANKED_TIER;
  return RANK_ORDER[rank];
}

export function sortMembersByRank(members: SchedulerMember[]): SchedulerMember[] {
  return [...members].sort((a, b) => {
    const diff = rankOrder(a.rank) - rankOrder(b.rank);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name, "vi");
  });
}

export function snakeDraftIntoTwoGroups(members: SchedulerMember[]): {
  groupA: SchedulerMember[];
  groupB: SchedulerMember[];
} {
  const sorted = sortMembersByRank(members);
  const groupA: SchedulerMember[] = [];
  const groupB: SchedulerMember[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const round = Math.floor(i / 2);
    const goesToA = round % 2 === 0 ? i % 2 === 0 : i % 2 === 1;
    if (goesToA) groupA.push(sorted[i]);
    else groupB.push(sorted[i]);
  }

  return { groupA, groupB };
}

export function filterEligibleForCategory(
  members: SchedulerMember[],
  category: MatchCategory,
): { eligible: SchedulerMember[]; error?: string } {
  switch (category) {
    case "MENS_SINGLES": {
      const eligible = members.filter((m) => m.gender === "MALE");
      if (eligible.length < 2) {
        return {
          eligible,
          error: "Cần ít nhất 2 thành viên nam (đã khai báo giới tính) cho đơn nam",
        };
      }
      return { eligible };
    }
    case "WOMENS_SINGLES": {
      const eligible = members.filter((m) => m.gender === "FEMALE");
      if (eligible.length < 2) {
        return {
          eligible,
          error: "Cần ít nhất 2 thành viên nữ (đã khai báo giới tính) cho đơn nữ",
        };
      }
      return { eligible };
    }
    case "MENS_DOUBLES": {
      const eligible = members.filter((m) => m.gender === "MALE");
      if (eligible.length < 4) {
        return {
          eligible,
          error: "Cần ít nhất 4 thành viên nam cho đôi nam",
        };
      }
      if (eligible.length % 2 !== 0) {
        return { eligible, error: "Số thành viên nam phải chẵn để chia đôi" };
      }
      return { eligible };
    }
    case "WOMENS_DOUBLES": {
      const eligible = members.filter((m) => m.gender === "FEMALE");
      if (eligible.length < 4) {
        return {
          eligible,
          error: "Cần ít nhất 4 thành viên nữ cho đôi nữ",
        };
      }
      if (eligible.length % 2 !== 0) {
        return { eligible, error: "Số thành viên nữ phải chẵn để chia đôi" };
      }
      return { eligible };
    }
    case "MIXED_DOUBLES": {
      const males = members.filter((m) => m.gender === "MALE");
      const females = members.filter((m) => m.gender === "FEMALE");
      if (males.length < 2 || females.length < 2) {
        return {
          eligible: [],
          error: "Cần ít nhất 2 nam và 2 nữ cho đôi nam nữ",
        };
      }
      const pairCount = Math.min(males.length, females.length);
      if (pairCount < 2) {
        return { eligible: [], error: "Cần đủ cặp nam/nữ để tạo đôi nam nữ" };
      }
      return { eligible: members.filter((m) => m.gender === "MALE" || m.gender === "FEMALE") };
    }
    default:
      return { eligible: members };
  }
}

export function pairDoublesSameGender(sorted: SchedulerMember[]): {
  pairs: [SchedulerMember, SchedulerMember][];
  error?: string;
} {
  if (sorted.length % 2 !== 0) {
    return { pairs: [], error: "Số người phải chẵn để chia đôi" };
  }
  const pairs: [SchedulerMember, SchedulerMember][] = [];
  for (let i = 0; i < sorted.length; i += 2) {
    pairs.push([sorted[i], sorted[i + 1]]);
  }
  return { pairs };
}

export function pairMixedDoubles(
  males: SchedulerMember[],
  females: SchedulerMember[],
): [SchedulerMember, SchedulerMember][] {
  const sortedM = sortMembersByRank(males);
  const sortedF = sortMembersByRank(females);
  const count = Math.min(sortedM.length, sortedF.length);
  const pairs: [SchedulerMember, SchedulerMember][] = [];

  for (let i = 0; i < count; i++) {
    const round = Math.floor(i / 2);
    const mIdx = round % 2 === 0 ? Math.floor(i / 2) : sortedM.length - 1 - Math.floor(i / 2);
    const fIdx = round % 2 === 0 ? Math.floor(i / 2) : sortedF.length - 1 - Math.floor(i / 2);
    const male = sortedM[Math.min(mIdx, sortedM.length - 1)];
    const female = sortedF[Math.min(fIdx, sortedF.length - 1)];
    if (!pairs.some(([m, f]) => m.id === male.id && f.id === female.id)) {
      pairs.push([male, female]);
    } else {
      pairs.push([sortedM[i % sortedM.length], sortedF[i % sortedF.length]]);
    }
  }

  const usedM = new Set<string>();
  const usedF = new Set<string>();
  const result: [SchedulerMember, SchedulerMember][] = [];
  let mi = 0;
  let fi = 0;
  while (result.length < count && mi < sortedM.length && fi < sortedF.length) {
    while (mi < sortedM.length && usedM.has(sortedM[mi].id)) mi++;
    while (fi < sortedF.length && usedF.has(sortedF[fi].id)) fi++;
    if (mi >= sortedM.length || fi >= sortedF.length) break;
    result.push([sortedM[mi], sortedF[fi]]);
    usedM.add(sortedM[mi].id);
    usedF.add(sortedF[fi].id);
    mi++;
    fi = sortedF.length - 1 - result.length;
    if (fi < 0) fi = 0;
  }

  if (result.length < count) {
    const remM = sortedM.filter((m) => !usedM.has(m.id));
    const remF = sortedF.filter((f) => !usedF.has(f.id));
    for (let i = 0; i < Math.min(remM.length, remF.length); i++) {
      result.push([remM[i], remF[i]]);
    }
  }

  return result.slice(0, count);
}

function assignToPools(members: SchedulerMember[], poolCount: number): SchedulerMember[][] {
  const sorted = sortMembersByRank(members);
  const pools: SchedulerMember[][] = Array.from({ length: poolCount }, () => []);

  for (let i = 0; i < sorted.length; i++) {
    const round = Math.floor(i / poolCount);
    const idx = round % 2 === 0 ? i % poolCount : poolCount - 1 - (i % poolCount);
    pools[idx].push(sorted[i]);
  }

  return pools;
}

/** Full round-robin: each player plays once per round; max games per player = rounds count. */
export function maxRoundRobinRounds(poolSize: number): number {
  if (poolSize < 2) return 0;
  return poolSize % 2 === 0 ? poolSize - 1 : poolSize;
}

/** Use as many RR rounds as possible: meet min, cap at target, never exceed full schedule. */
export function resolveRoundRobinRoundCount(
  poolSize: number,
  minGamesPerMember: number,
  targetGamesPerMember: number,
): { rounds: number; fullRounds: number } {
  const fullRounds = maxRoundRobinRounds(poolSize);
  if (fullRounds === 0) return { rounds: 0, fullRounds: 0 };

  let rounds = fullRounds;
  if (targetGamesPerMember < fullRounds) {
    rounds = targetGamesPerMember;
  }
  if (rounds < minGamesPerMember) {
    rounds = Math.min(fullRounds, minGamesPerMember);
  }
  return { rounds, fullRounds };
}

function memberPairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

/** Every unordered pair of members in the same match (singles or doubles). */
function memberPairsInFixture(memberIds: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < memberIds.length; i++) {
    for (let j = i + 1; j < memberIds.length; j++) {
      pairs.push([memberIds[i], memberIds[j]]);
    }
  }
  return pairs;
}

function canAddFixture(
  usedMemberPairs: Set<string>,
  memberIds: string[],
): boolean {
  for (const [a, b] of memberPairsInFixture(memberIds)) {
    if (usedMemberPairs.has(memberPairKey(a, b))) return false;
  }
  return true;
}

function registerFixture(
  usedMemberPairs: Set<string>,
  memberIds: string[],
): void {
  for (const [a, b] of memberPairsInFixture(memberIds)) {
    usedMemberPairs.add(memberPairKey(a, b));
  }
}

function membersBelowTarget(
  counts: Map<string, number>,
  memberIds: string[],
  target: number,
): boolean {
  return memberIds.every((id) => (counts.get(id) ?? 0) < target);
}

function bumpMemberCounts(
  counts: Map<string, number>,
  memberIds: string[],
): void {
  for (const id of memberIds) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
}

function roundRobinRounds(players: SchedulerMember[]): [SchedulerMember, SchedulerMember][][] {
  const list = [...players];
  if (list.length % 2 === 1) {
    list.push({ id: "__BYE__", name: "BYE", rank: null, gender: null });
  }

  const n = list.length;
  const rounds: [SchedulerMember, SchedulerMember][][] = [];
  const fixed = list[0];
  let rotating = list.slice(1);

  for (let r = 0; r < n - 1; r++) {
    const round: [SchedulerMember, SchedulerMember][] = [];
    const current = [fixed, ...rotating];
    for (let i = 0; i < n / 2; i++) {
      const home = current[i];
      const away = current[n - 1 - i];
      if (home.id !== "__BYE__" && away.id !== "__BYE__") {
        round.push([home, away]);
      }
    }
    rounds.push(round);
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)];
  }

  return rounds;
}

export function buildInitialAbGroups(
  memberIds: string[],
  balanceByRank: boolean,
  members: SchedulerMember[],
): { groupA: string[]; groupB: string[] } {
  const pool = members.filter((m) => memberIds.includes(m.id));
  if (!balanceByRank) {
    const half = Math.ceil(pool.length / 2);
    return {
      groupA: pool.slice(0, half).map((m) => m.id),
      groupB: pool.slice(half).map((m) => m.id),
    };
  }
  const { groupA, groupB } = snakeDraftIntoTwoGroups(pool);
  return {
    groupA: groupA.map((m) => m.id),
    groupB: groupB.map((m) => m.id),
  };
}

/** Full cross A×B: each member plays every opponent on the other side (round-robin scheduling). */
export function scheduleBipartiteSinglesRounds(
  groupA: string[],
  groupB: string[],
): Array<Array<{ homeId: string; awayId: string }>> {
  const m = groupA.length;
  const n = groupB.length;
  if (m === 0 || n === 0) return [];

  const rounds: Array<Array<{ homeId: string; awayId: string }>> = [];

  if (m <= n) {
    for (let r = 0; r < n; r++) {
      const round: Array<{ homeId: string; awayId: string }> = [];
      for (let i = 0; i < m; i++) {
        round.push({ homeId: groupA[i], awayId: groupB[(i + r) % n] });
      }
      rounds.push(round);
    }
  } else {
    for (let r = 0; r < m; r++) {
      const round: Array<{ homeId: string; awayId: string }> = [];
      for (let j = 0; j < n; j++) {
        round.push({ homeId: groupA[(j + r) % m], awayId: groupB[j] });
      }
      rounds.push(round);
    }
  }

  return rounds;
}

/** Partner rotation within a group (each round = n/2 different pairs). */
export function roundRobinPartnerRounds(
  players: SchedulerMember[],
): [SchedulerMember, SchedulerMember][][] {
  const list = [...players];
  if (list.length < 2) return [];
  if (list.length % 2 === 1) {
    list.push({ id: "__BYE__", name: "BYE", rank: null, gender: null });
  }

  const n = list.length;
  const rounds: [SchedulerMember, SchedulerMember][][] = [];
  let rotating = list.slice(1);
  const fixed = list[0];

  for (let r = 0; r < n - 1; r++) {
    const current = [fixed, ...rotating];
    const round: [SchedulerMember, SchedulerMember][] = [];
    for (let i = 0; i < n / 2; i++) {
      const p1 = current[i];
      const p2 = current[n - 1 - i];
      if (p1.id !== "__BYE__" && p2.id !== "__BYE__") {
        round.push([p1, p2]);
      }
    }
    rounds.push(round);
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)];
  }

  return rounds;
}

function splitAbGroups(
  eligible: SchedulerMember[],
  customAb?: { groupA: string[]; groupB: string[] },
): { groupA: string[]; groupB: string[] } {
  if (customAb && (customAb.groupA.length > 0 || customAb.groupB.length > 0)) {
    const eligibleIds = new Set(eligible.map((m) => m.id));
    return {
      groupA: customAb.groupA.filter((id) => eligibleIds.has(id)),
      groupB: customAb.groupB.filter((id) => eligibleIds.has(id)),
    };
  }
  const draft = snakeDraftIntoTwoGroups(eligible);
  return {
    groupA: draft.groupA.map((m) => m.id),
    groupB: draft.groupB.map((m) => m.id),
  };
}

export function generateAbCrossSchedule(
  groupA: string[],
  groupB: string[],
  category: MatchCategory,
  config: Pick<TournamentScheduleConfig, "minGamesPerMember" | "targetGamesPerMember">,
  startOrder: number,
  membersById: Map<string, SchedulerMember>,
): {
  matches: GeneratedMatch[];
  brackets: GeneratedBracket[];
  nextOrder: number;
  warnings: string[];
} {
  const matches: GeneratedMatch[] = [];
  const brackets: GeneratedBracket[] = [];
  const scheduleWarnings: string[] = [];
  let order = startOrder;

  if (groupA.length < 1 || groupB.length < 1) {
    return { matches, brackets, nextOrder: order, warnings: scheduleWarnings };
  }

  const isDoubles = isDoublesCategory(category);
  const roundNum = 1;
  const counts = new Map<string, number>();
  const usedMemberPairs = new Set<string>();
  const target = config.targetGamesPerMember;

  const bipartiteRounds = scheduleBipartiteSinglesRounds(groupA, groupB);
  const membersA = groupA
    .map((id) => membersById.get(id))
    .filter((m): m is SchedulerMember => !!m);
  const membersB = groupB
    .map((id) => membersById.get(id))
    .filter((m): m is SchedulerMember => !!m);

  const partnerRoundsA = isDoubles ? roundRobinPartnerRounds(membersA) : [];
  const partnerRoundsB = isDoubles ? roundRobinPartnerRounds(membersB) : [];

  if (isDoubles) {
    const rotationCount = Math.max(partnerRoundsA.length, partnerRoundsB.length, 1);
    for (let r = 0; r < rotationCount; r++) {
      const homePairs = partnerRoundsA[r % partnerRoundsA.length] ?? [];
      const awayPairs = partnerRoundsB[r % partnerRoundsB.length] ?? [];
      if (homePairs.length === 0 || awayPairs.length === 0) continue;

      for (const [h1, h2] of homePairs) {
        for (const [a1, a2] of awayPairs) {
          const players = [h1.id, h2.id, a1.id, a2.id];
          if (!membersBelowTarget(counts, players, target)) continue;
          if (!canAddFixture(usedMemberPairs, players)) continue;
          matches.push({
            order: order++,
            round: roundNum,
            groupLabel: null,
            category,
            homeMemberId: h1.id,
            homeMember2Id: h2.id,
            awayMemberId: a1.id,
            awayMember2Id: a2.id,
          });
          registerFixture(usedMemberPairs, players);
          bumpMemberCounts(counts, players);
        }
      }
    }

    const firstHome = partnerRoundsA[0]?.[0];
    const firstAway = partnerRoundsB[0]?.[0];
    if (firstHome && firstAway) {
      brackets.push({
        order: 1,
        groupAMemberId: firstHome[0].id,
        groupBMemberId: firstAway[0].id,
      });
    }
  } else {
    for (const round of bipartiteRounds) {
      for (const { homeId, awayId } of round) {
        const players = [homeId, awayId];
        if (!membersBelowTarget(counts, players, target)) continue;
        if (!canAddFixture(usedMemberPairs, players)) continue;
        matches.push({
          order: order++,
          round: roundNum,
          groupLabel: null,
          category,
          homeMemberId: homeId,
          awayMemberId: awayId,
          homeMember2Id: null,
          awayMember2Id: null,
        });
        registerFixture(usedMemberPairs, players);
        bumpMemberCounts(counts, players);
      }
    }

    const first = bipartiteRounds[0]?.[0];
    if (first) {
      brackets.push({
        order: 1,
        groupAMemberId: first.homeId,
        groupBMemberId: first.awayId,
      });
    }
  }

  if (matches.length === 0) {
    scheduleWarnings.push("Không tạo được trận nào cho bảng A/B");
  }

  return { matches, brackets, nextOrder: order, warnings: scheduleWarnings };
}

export function matchesFromAbGroups(
  groupA: string[],
  groupB: string[],
  category: MatchCategory,
  startOrder: number,
  config?: Pick<TournamentScheduleConfig, "minGamesPerMember" | "targetGamesPerMember">,
  members?: SchedulerMember[],
): { matches: GeneratedMatch[]; brackets: GeneratedBracket[]; nextOrder: number } {
  const membersById = new Map(
    (members ?? []).map((m) => [m.id, m]),
  );
  for (const id of [...groupA, ...groupB]) {
    if (!membersById.has(id)) {
      membersById.set(id, { id, name: id, rank: null, gender: null });
    }
  }
  const result = generateAbCrossSchedule(
    groupA,
    groupB,
    category,
    {
      minGamesPerMember: config?.minGamesPerMember ?? 1,
      targetGamesPerMember: config?.targetGamesPerMember ?? 99,
    },
    startOrder,
    membersById,
  );
  return {
    matches: result.matches,
    brackets: result.brackets,
    nextOrder: result.nextOrder,
  };
}

function generateAbPairsSingles(
  eligible: SchedulerMember[],
  category: MatchCategory,
  startOrder: number,
  config: Pick<TournamentScheduleConfig, "minGamesPerMember" | "targetGamesPerMember">,
  customAb?: { groupA: string[]; groupB: string[] },
): {
  matches: GeneratedMatch[];
  brackets: GeneratedBracket[];
  nextOrder: number;
  warnings: string[];
} {
  const { groupA, groupB } = splitAbGroups(eligible, customAb);
  const membersById = new Map(eligible.map((m) => [m.id, m]));
  return generateAbCrossSchedule(
    groupA,
    groupB,
    category,
    config,
    startOrder,
    membersById,
  );
}

function generateRoundRobinSingles(
  eligible: SchedulerMember[],
  category: MatchCategory,
  config: TournamentScheduleConfig,
  startOrder: number,
  warnings: string[],
): { matches: GeneratedMatch[]; nextOrder: number } {
  const poolCount = config.groupCount ?? 1;
  const pools = assignToPools(eligible, poolCount);
  const matches: GeneratedMatch[] = [];
  let order = startOrder;

  for (let p = 0; p < pools.length; p++) {
    const pool = pools[p];
    if (pool.length < 2) continue;
    const allRounds = roundRobinRounds(pool);
    const { rounds: roundsToUse, fullRounds } = resolveRoundRobinRoundCount(
      pool.length,
      config.minGamesPerMember,
      config.targetGamesPerMember,
    );

    if (roundsToUse < config.minGamesPerMember) {
      warnings.push(
        `Bảng ${p + 1} (${category}): tối đa ${fullRounds} trận/người, không đạt tối thiểu ${config.minGamesPerMember}`,
      );
    }
    if (roundsToUse < fullRounds) {
      warnings.push(
        `Bảng ${p + 1} (${category}): ${roundsToUse}/${fullRounds} vòng (giới hạn mục tiêu ${config.targetGamesPerMember} trận/người)`,
      );
    }

    const label = poolCount > 1 ? `Bảng ${p + 1}` : null;
    for (let r = 0; r < roundsToUse; r++) {
      for (const [home, away] of allRounds[r]) {
        matches.push({
          order: order++,
          round: r + 1,
          groupLabel: label,
          category,
          homeMemberId: home.id,
          awayMemberId: away.id,
          homeMember2Id: null,
          awayMember2Id: null,
        });
      }
    }
  }

  return { matches, nextOrder: order };
}

function generateAbPairsDoubles(
  eligible: SchedulerMember[],
  category: MatchCategory,
  startOrder: number,
  config: Pick<TournamentScheduleConfig, "minGamesPerMember" | "targetGamesPerMember">,
  customAb?: { groupA: string[]; groupB: string[] },
): {
  matches: GeneratedMatch[];
  brackets: GeneratedBracket[];
  nextOrder: number;
  warnings: string[];
} {
  const { groupA, groupB } = splitAbGroups(eligible, customAb);
  if (groupA.length < 2 || groupB.length < 2) {
    return { matches: [], brackets: [], nextOrder: startOrder, warnings: [] };
  }
  const membersById = new Map(eligible.map((m) => [m.id, m]));
  return generateAbCrossSchedule(
    groupA,
    groupB,
    category,
    config,
    startOrder,
    membersById,
  );
}

function generateRoundRobinDoubles(
  pairs: [SchedulerMember, SchedulerMember][],
  category: MatchCategory,
  config: TournamentScheduleConfig,
  startOrder: number,
  warnings: string[],
): { matches: GeneratedMatch[]; nextOrder: number } {
  const pseudoMembers: SchedulerMember[] = pairs.map(([a, b]) => ({
    id: `team-${a.id}-${b.id}`,
    name: `${a.name} / ${b.name}`,
    rank: a.rank,
    gender: a.gender,
  }));
  const pairMap = new Map(pairs.map(([a, b]) => [`team-${a.id}-${b.id}`, [a, b] as const]));

  const poolCount = config.groupCount ?? 1;
  const pools = assignToPools(pseudoMembers, poolCount);
  const matches: GeneratedMatch[] = [];
  let order = startOrder;
  for (let p = 0; p < pools.length; p++) {
    const pool = pools[p];
    if (pool.length < 2) continue;
    const allRounds = roundRobinRounds(pool);
    const { rounds: roundsToUse, fullRounds } = resolveRoundRobinRoundCount(
      pool.length,
      config.minGamesPerMember,
      config.targetGamesPerMember,
    );

    if (roundsToUse < config.minGamesPerMember) {
      warnings.push(
        `Bảng ${p + 1} (${category}): tối đa ${fullRounds} trận/người, không đạt tối thiểu ${config.minGamesPerMember}`,
      );
    }
    if (roundsToUse < fullRounds) {
      warnings.push(
        `Bảng ${p + 1} (${category}): ${roundsToUse}/${fullRounds} vòng (giới hạn mục tiêu ${config.targetGamesPerMember})`,
      );
    }

    const label = poolCount > 1 ? `Bảng ${p + 1}` : null;
    for (let r = 0; r < roundsToUse; r++) {
      for (const [home, away] of allRounds[r]) {
        const homePair = pairMap.get(home.id)!;
        const awayPair = pairMap.get(away.id)!;
        matches.push({
          order: order++,
          round: r + 1,
          groupLabel: label,
          category,
          homeMemberId: homePair[0].id,
          homeMember2Id: homePair[1].id,
          awayMemberId: awayPair[0].id,
          awayMember2Id: awayPair[1].id,
        });
      }
    }
  }

  return { matches, nextOrder: order };
}

function isDoublesCategory(category: MatchCategory): boolean {
  return (
    category === "MENS_DOUBLES" ||
    category === "WOMENS_DOUBLES" ||
    category === "MIXED_DOUBLES"
  );
}

function buildPairsForCategory(
  eligible: SchedulerMember[],
  category: MatchCategory,
): { pairs: [SchedulerMember, SchedulerMember][]; error?: string } {
  if (category === "MENS_DOUBLES" || category === "WOMENS_DOUBLES") {
    return pairDoublesSameGender(sortMembersByRank(eligible));
  }
  if (category === "MIXED_DOUBLES") {
    const males = eligible.filter((m) => m.gender === "MALE");
    const females = eligible.filter((m) => m.gender === "FEMALE");
    return { pairs: pairMixedDoubles(males, females) };
  }
  return { pairs: [], error: "Không phải hạng mục đôi" };
}

export function generateTournamentSchedule(
  allMembers: SchedulerMember[],
  format: "AB_PAIRS" | "ROUND_ROBIN",
  config: TournamentScheduleConfig,
): ScheduleGenerationResult {
  const participants = allMembers.filter((m) =>
    config.participantMemberIds.includes(m.id),
  );
  if (participants.length < 2) {
    return {
      matches: [],
      brackets: [],
      warnings: ["Cần ít nhất 2 người tham gia"],
    };
  }

  const matches: GeneratedMatch[] = [];
  const brackets: GeneratedBracket[] = [];
  const warnings: string[] = [];
  let order = 1;
  let usedCustomAb = false;

  for (const category of config.categories) {
    const { eligible, error } = filterEligibleForCategory(participants, category);
    if (error) {
      warnings.push(`${category}: ${error}`);
      continue;
    }

    const doubles = isDoublesCategory(category);

    if (format === "AB_PAIRS") {
      if (doubles) {
        if (eligible.length < 4) {
          warnings.push(`${category}: cần ít nhất 4 người (2 mỗi bảng) cho đôi`);
          continue;
        }
        const customAb =
          !usedCustomAb && config.abGroups ? config.abGroups : undefined;
        const result = generateAbPairsDoubles(
          eligible,
          category,
          order,
          config,
          customAb,
        );
        if (customAb) usedCustomAb = true;
        matches.push(...result.matches);
        brackets.push(...result.brackets);
        order = result.nextOrder;
        warnings.push(...result.warnings);
      } else {
        const customAb =
          !usedCustomAb && config.abGroups ? config.abGroups : undefined;
        const result = generateAbPairsSingles(
          eligible,
          category,
          order,
          config,
          customAb,
        );
        if (customAb) usedCustomAb = true;
        matches.push(...result.matches);
        brackets.push(...result.brackets);
        order = result.nextOrder;
        warnings.push(...result.warnings);
      }
    } else {
      if (doubles) {
        const { pairs, error: pairErr } = buildPairsForCategory(eligible, category);
        if (pairErr || pairs.length < 2) {
          warnings.push(`${category}: ${pairErr ?? "Cần ít nhất 2 cặp"}`);
          continue;
        }
        const result = generateRoundRobinDoubles(pairs, category, config, order, warnings);
        matches.push(...result.matches);
        order = result.nextOrder;
      } else {
        const result = generateRoundRobinSingles(
          eligible,
          category,
          config,
          order,
          warnings,
        );
        matches.push(...result.matches);
        order = result.nextOrder;
      }
    }
  }

  if (matches.length === 0 && warnings.length === 0) {
    warnings.push("Không tạo được trận nào với cấu hình hiện tại");
  }

  const counts = countGamesPerMember(matches);
  for (const id of config.participantMemberIds) {
    const games = counts.get(id) ?? 0;
    if (games > 0 && games < config.minGamesPerMember) {
      const name = allMembers.find((m) => m.id === id)?.name ?? id;
      warnings.push(
        `${name}: chỉ ${games} trận (tối thiểu ${config.minGamesPerMember})`,
      );
    }
  }

  const abBrackets =
    format === "AB_PAIRS"
      ? brackets
      : [];

  return { matches, brackets: abBrackets, warnings };
}

export function countGamesPerMember(
  matches: GeneratedMatch[],
): Map<string, number> {
  const counts = new Map<string, number>();

  function add(id: string | null) {
    if (!id) return;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  for (const m of matches) {
    add(m.homeMemberId);
    add(m.awayMemberId);
    add(m.homeMember2Id);
    add(m.awayMember2Id);
  }

  return counts;
}
