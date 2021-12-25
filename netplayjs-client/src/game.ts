import { DefaultInput } from "./defaultinput";
import { NetplayPlayer, NetplayState } from "./types";

export type GameClass = {
  new (canvas: HTMLCanvasElement, players: Array<NetplayPlayer>): Game;
  timestep: number;

  canvas: HTMLCanvasElement;

  /**
   * Is the game deterministic? By default, we assume no. If this is true,
   * certain netcode algorithms can perform more efficiently.
   */
  deterministic?: boolean;

  onURL(url: string): void;
};

export abstract class Game extends NetplayState<DefaultInput> {
  abstract draw(canvas: HTMLCanvasElement);
}
