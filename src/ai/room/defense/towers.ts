function getNearestEnemy(tower: StructureTower, validTargets: ReadonlyArray<Creep>): Creep {
  return _.min(validTargets, (enemy: Creep) => tower.pos.getRangeTo(enemy));
}

function partHealPower(part: BodyPartDefinition, isNear: boolean): number {
  const partHeal = isNear ? HEAL_POWER : RANGED_HEAL_POWER;

  return part.boost ? partHeal * (BOOSTS.heal as any)[part.boost].heal : partHeal;
}

function healPower(creep: Creep, medic: Creep): number {
  const isNear = medic.pos.isNearTo(creep);
  const body = _.filter(medic.body, (part: BodyPartDefinition) => part.hits && part.type === HEAL);

  return _.sum(body, (part: BodyPartDefinition) => partHealPower(part, isNear));
}

function potentialHeal(creep: Creep): number {
  const creeps = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
  return _.sum(creeps, (medic: Creep) => healPower(creep, medic));
}

function damageMultiplier(creep: Creep, pureDamage: number): number {
  const activeParts = _.filter(creep.body, (part: BodyPartDefinition) => part.hits);
  // tslint:disable-next-line:no-let
  let adjustedDamage = 0;
  // tslint:disable-next-line:no-let
  let leftOverDamage = pureDamage;
  while (leftOverDamage > 0 && activeParts.length) {
    const part = activeParts.shift()!;
    const multiplier = part.type === TOUGH && part.boost ? (BOOSTS.tough as any)[part.boost].damage : 1;
    const damage = Math.min(part.hits / multiplier, leftOverDamage);

    adjustedDamage += damage * multiplier;
    leftOverDamage -= damage;
  }

  return adjustedDamage + leftOverDamage;
}

function potentialCreepDamage(creep: Creep): number {
  const militiaInRange = _.filter(creep.room.find(FIND_MY_CREEPS), (d: Creep) => d.pos.inRangeTo(creep, 3));

  return _.sum(militiaInRange, (militia: Creep) =>
      militia.getActiveBodyparts(RANGED_ATTACK) * 40 + militia.getActiveBodyparts(ATTACK) * 120);
}

function potentialTowerDamage(creep: Creep, towers: ReadonlyArray<StructureTower>): number {
  return _.sum(towers, (tower: StructureTower) => 750 - Math.max(Math.min(tower.pos.getRangeTo(creep), 20), 5) * 30);
}

function canKill(creep: Creep, towers: ReadonlyArray<StructureTower>): boolean {
  const pureDamage = potentialTowerDamage(creep, towers) + potentialCreepDamage(creep);
  const potentialDamage = damageMultiplier(creep, pureDamage);

  return potentialDamage > potentialHeal(creep);
}

function fireTowers(towers: ReadonlyArray<StructureTower>, targetingFunction: (tower: StructureTower) => Creep): void {
  _.forEach(towers, (tower: StructureTower) => tower.attack(targetingFunction(tower)));
}

function executeScatterFire(): boolean {
  // TODO: Constant
  return Game.time % 3 === 0;
}

function handleTowerTargeting(towers: StructureTower[], enemies: ReadonlyArray<Creep>): void {
  const validTargets = _.filter(enemies, (enemy: Creep) => canKill(enemy, towers));

  if (validTargets.length) {
    const randomness = Math.random();
    const mostDamagedEnemy = _.max(validTargets, (enemy: Creep) => enemy.hitsMax - enemy.hits);

    if (mostDamagedEnemy.hits < mostDamagedEnemy.hitsMax && randomness < 0.95) {
      fireTowers(towers, () => mostDamagedEnemy);
    } else if (randomness < 0.5) {
      fireTowers(towers, (tower: StructureTower) => getNearestEnemy(tower, validTargets));
    } else {
      const target = validTargets[Math.floor(randomness * validTargets.length)];
      fireTowers(towers, () => target);
    }
  } else if (executeScatterFire()) {
    fireTowers(towers, () => enemies[Math.floor(Math.random() * enemies.length)]);
  }
}

function findDamaged(room: Room): Creep | null {
  return _.find(room.find(FIND_MY_CREEPS), (creep: Creep) => creep.hits < creep.hitsMax) || null;
}

function findCreepToHeal(room: Room): Creep | null {
  return findDamaged(room);
}

export function towerAI(room: Room): void {
  const towers = _.filter(room.getStructures<StructureTower>(STRUCTURE_TOWER), (tower: StructureTower) => tower.energy);
  if (!towers.length) {
    return;
  }

  if (room.find(FIND_HOSTILE_CREEPS).length > 0) {
    handleTowerTargeting(towers, room.find(FIND_HOSTILE_CREEPS));
  } else {
    const creep = findCreepToHeal(room);
    if (creep) {
      _.forEach(towers, (tower: StructureTower) => tower.heal(creep));
    }
  }
}

function towerRepair(tower: StructureTower, objects: RoomObject[]): void {
  const target = tower.pos.findClosestByRange<RoomObject>(objects);
  tower.repair(target as Structure);
}
