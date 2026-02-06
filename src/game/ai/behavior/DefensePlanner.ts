import type { CarState } from '../../carPhysics';
import type { AiIntent, AiOpponentSnapshot, AiRuntimeContext, RacingLineSample } from '../types';
import { sub, len, dot, scale, add } from '../../math';
import { randBool } from '../../../devtools/determinism/Random';
import { GameClock } from '../../../devtools/determinism/GameClock';

export class DefensePlanner {
  private lastMoveTime = 0;

  plan(
    car: CarState,
    context: AiRuntimeContext,
    opponents: AiOpponentSnapshot[],
    lookahead: RacingLineSample,
  ): AiIntent | null {
    const now = GameClock.nowSec();
    const cooldown = 1.5 - context.skill.discipline * 0.5;
    if (now - this.lastMoveTime < cooldown) return null;

    const chaser = opponents
      .filter(o => o.s < context.line.totalLength && o.pos !== car.pos)
      .map(o => ({ o, gap: len(sub(o.pos, car.pos)) }))
      .sort((a, b) => a.gap - b.gap)[0];

    if (!chaser || chaser.gap > 12) return null;

    const relativeSpeed = len(sub(chaser.o.vel, car.vel));
    if (relativeSpeed < 2) return null;

    const awareness = context.skill.awareness * context.global.awareness;
    if (awareness < 0.3 && !randBool(awareness)) return null;

    const blockDirection = randBool(0.5) ? 1 : -1;
    const width = blockDirection > 0 ? lookahead.widthRight : lookahead.widthLeft;
    const target = add(lookahead.pos, scale(lookahead.normal, blockDirection * width * 0.5));
    this.lastMoveTime = now;
    return { type: 'defend_line', target, opponentId: chaser.o.id };
  }
}
