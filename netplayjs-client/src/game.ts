import { DefaultInput } from "./defaultinput";
import { NetplayPlayer, NetplayState } from "./types";

export type GameClass = {
  new (canvas: HTMLCanvasElement, players: Array<NetplayPlayer>): Game;
  timestep: number;

  /**
   * Canvases need to have a fixed pixel size.
   */
  canvasSize: { width: number; height: number };

  /**
   * Is the game deterministic? By default, we assume no. If this is true,
   * certain netcode algorithms can perform more efficiently.
   */
  deterministic?: boolean;
};

export abstract class Game extends NetplayState<DefaultInput> {
  abstract draw(canvas: HTMLCanvasElement);
}
