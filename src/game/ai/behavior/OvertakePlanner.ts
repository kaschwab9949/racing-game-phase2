import type { CarState } from '../../carPhysics';
import type { AiIntent, AiOpponentSnapshot, AiRuntimeContext, RacingLineSample } from '../types';
import { sub, len, dot, normalize, perp, add, scale } from '../../math';
import { randBool } from '../../../devtools/determinism/Random';

export class OvertakePlanner {
  private cooldown = 0;

  plan(
    car: CarState,
    context: AiRuntimeContext,
    opponents: AiOpponentSnapshot[],
    lookahead: RacingLineSample,
  ): AiIntent | null {
    this.cooldown = Math.max(0, this.cooldown - 0.016);
    if (this.cooldown > 0) return null;

    const targets = opponents
      .filter(o => !o.isPlayer)
      .map(o => ({ snapshot: o, delta: len(sub(o.pos, car.pos)) }))
      .sort((a, b) => a.delta - b.delta);

    const nearest = targets[0];
    if (!nearest) return null;
    if (nearest.delta > 25) return null;

    const relVel = len(sub(car.vel, nearest.snapshot.vel));
    const closing = relVel > 0 && dot(sub(nearest.snapshot.pos, car.pos), car.vel) > 0;
    if (!closing) return null;

    const skillAgg = context.skill.aggression * context.global.aggression;
    const passProbability = skillAgg * (1 - this.cooldown);
    if (!randBool(passProbability)) return null;

    const side = randBool(context.skill.bravery) ? 1 : -1;
    const offset = add(lookahead.pos, scale(lookahead.normal, side * 0.6 * lookahead.widthRight));

    this.cooldown = 2.5;
    return side > 0
      ? { type: 'overtake_outside', target: offset, opponentId: nearest.snapshot.id }
      : { type: 'overtake_inside', target: offset, opponentId: nearest.snapshot.id };
  }
}
