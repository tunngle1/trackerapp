/** Карта изображений MeWeGo. Все файлы лежат в /public/img. */
import type { CharacterKind, CharacterState } from '../types';

export const img = (p: string) => `/img/${p}`;

export const robot = {
  // стадии 1–5
  stage1: img('robot/robot_stage1_wait.png'),
  stage1Alt: img('robot/robot_stage1_wait_adv.png'),
  stage2: img('robot/robot_stage2_symbol.png'),
  stage3: img('robot/robot_stage3_wait.png'),
  stage3Alt: img('robot/robot_stage3_sleep.png'),
  stage4: img('robot/robot_stage4_hero.png'),
  stage4Alt: img('robot/robot_stage4_explorer.png'),
  stage5: img('robot/robot_stage5_hero.png'),
  stage5Alt: img('robot/robot_stage5_friendly.png'),
  // состояния
  wait: img('robot/robot_stage1_wait.png'),
  sleep: img('robot/robot_sleep_transparent.png'),
  sleepLotus: img('robot/robot_sleep_lotus.png'),
  sleepAntenna: img('robot/robot_sleep_antenna.png'),
  sleepStage5: img('robot/robot_stage5_sleep.png'),
  celebrate: img('robot/robot_celebrate_smile.png'),
  celebrateWin: img('robot/robot_celebrate_winner.png'),
  celebrateTrophy: img('robot/robot_celebrate_trophy.png'),
  celebrateJoy: img('robot/robot_celebrate_joy.png'),
  celebrateCompanion: img('robot/robot_celebrate_companion.png'),
  return_: img('robot/robot_return.png'),
  returnGear: img('robot/robot_return_gear.png'),
  returnStage5: img('robot/robot_stage5_return.png'),
  returnAdventure: img('robot/robot_return_adventure.png'),
  returnAdventure1: img('robot/robot_return1.png'),
  explorer: img('robot/robot_stage4_explorer.png'),
  sportRoute: img('robot/robot_sport_route.png'),
};

export const cat = {
  stage1: img('cat/cat_stage1_wait.png'),
  stage1Alt: img('cat/cat_stage1_kitten1.png'),
  stage2: img('cat/cat_stage2_scarf.png'),
  stage3: img('cat/cat_stage3_elegant.png'),
  stage3Alt: img('cat/cat_stage3_magic.png'),
  stage4: img('cat/cat_stage4_palantine.png'),
  stage4Alt: img('cat/cat_stage4_silver.png'),
  stage4Symbol: img('cat/cat_stage4_symbol.png'),
  stage5: img('cat/cat_stage5_regal.png'),
  stage5Alt: img('cat/cat_stage5_mantle.png'),
  // состояния
  wait: img('cat/cat_stage1_wait.png'),
  sleep: img('cat/cat_sleep_mark.png'),
  sleepTail: img('cat/cat_sleep_tail.png'),
  sleepLuxury: img('cat/cat_sleep_luxury.png'),
  sleepMagic: img('cat/cat_sleep_magic.png'),
  sleepScarf: img('cat/cat_sleep_scarf.png'),
  celebrate: img('cat/cat_celebrate.png'),
  celebrateMeWeGo: img('cat/cat_celebrate_mewego.png'),
  celebrateWisdom: img('cat/cat_celebrate_wisdom.png'),
  celebrateScarf: img('cat/cat_celebrate_scarf.png'),
  celebrateJump: img('cat/cat_stage5_jump.png'),
  jumpScarf: img('cat/cat_jump_scarf.png'),
  autumn: img('cat/cat_autumn.png'),
  autumn1: img('cat/cat_autumn1.png'),
  autumnScarf: img('cat/cat_autumn_scarf.png'),
  return_: img('cat/cat_return_leaf.png'),
  return2: img('cat/cat_return_leaf2.png'),
  returnAutumn: img('cat/cat_return_autumn.png'),
};

export const scenes = {
  // мастерские робота
  workshopLight: img('scenes/bg_robot_workshop_light.png'),
  workshopDark: img('scenes/bg_robot_workshop_dark.png'),
  workshopEvening: img('scenes/bg_robot_workshop_evening.png'),
  workshopEvening1: img('scenes/bg_robot_workshop_evening1.png'),
  workshopSunset: img('scenes/bg_workshop_sunset.png'),
  workshopSunset1: img('scenes/bg_workshop_sunset1.png'),
  robotEveningDark: img('scenes/bg_robot_evening_dark.png'),
  // уют кота / дома
  catCorner: img('scenes/bg_cat_corner.png'),
  eveningWindow: img('scenes/bg_evening_window.png'),
  readingNook: img('scenes/bg_reading_nook.png'),
  readingNook1: img('scenes/bg_reading_nook1.png'),
  readingNook2: img('scenes/bg_reading_nook2.png'),
  nightCity: img('scenes/bg_night_city.png'),
};

export const botImgs = {
  duoGreeting: img('bot/bot_duo_greeting.png'),
  duo: img('bot/bot_duo.png'),
};

export const icons = {
  bolt: img('icons/icon_bolt.png'),
  chip: img('icons/icon_chip.png'),
  shell: img('icons/icon_shell.png'),
  stone: img('icons/icon_stone.png'),
  cone: img('icons/icon_cone.png'),
  gear: img('icons/icon_gear.png'),
  crystal: img('icons/icon_crystal.png'),
  spring: img('icons/icon_spring.png'),
  battery: img('icons/icon_battery.png'),
  quill: img('icons/deco_quill.png'),
  flower: img('icons/deco_flower.png'),
  maple: img('icons/deco_maple.png'),
};

/** Сцена «комнаты» персонажа по типу и времени суток */
export function roomScene(kind: CharacterKind, hour: number): string {
  if (kind === 'robot') {
    if (hour >= 20 || hour < 7) return scenes.robotEveningDark;
    if (hour >= 17) return scenes.workshopEvening;
    return hour % 2 === 0 ? scenes.workshopLight : scenes.workshopSunset;
  }
  if (hour >= 21 || hour < 7) return scenes.nightCity;
  if (hour >= 18) return scenes.eveningWindow;
  return hour % 2 === 0 ? scenes.catCorner : scenes.readingNook;
}

export function homeScene(kind: CharacterKind): string {
  return kind === 'robot' ? scenes.workshopSunset : scenes.catCorner;
}

/** Картинка стадии персонажа */
export function stageImage(kind: CharacterKind, stage: number): string {
  if (kind === 'robot') {
    switch (stage) {
      case 1: return robot.stage1;
      case 2: return robot.stage2;
      case 3: return robot.stage3;
      case 4: return robot.stage4;
      default: return robot.stage5;
    }
  }
  switch (stage) {
    case 1: return cat.stage1;
    case 2: return cat.stage2;
    case 3: return cat.stage3;
    case 4: return cat.stage4;
    case 5: return cat.stage5;
    default: return cat.stage1;
  }
}

/** Картинка текущего состояния персонажа */
export function stateImage(kind: CharacterKind, state: CharacterState, stage: number): string {
  const set = kind === 'robot' ? robot : cat;
  switch (state) {
    case 'sleep':
      if (kind === 'robot') {
        if (stage >= 5) return robot.sleepStage5;
        return robot.sleepLotus;
      }
      return stage >= 4 ? cat.sleepLuxury : cat.sleep;
    case 'celebrate': {
      const pool = kind === 'robot'
        ? [robot.celebrate, robot.celebrateWin, robot.celebrateTrophy, robot.celebrateJoy, robot.celebrateCompanion]
        : [cat.celebrate, cat.celebrateMeWeGo, cat.celebrateWisdom, cat.celebrateScarf, cat.jumpScarf];
      return pool[stage % pool.length];
    }
    case 'return':
      if (kind === 'robot') {
        return stage >= 5 ? robot.returnStage5 : robot.returnGear;
      }
      return cat.returnAutumn;
    default:
      return stageImage(kind, stage);
  }
}

export type { CharacterKind, CharacterState } from '../types';
