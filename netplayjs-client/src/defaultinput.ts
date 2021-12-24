import { NetplayInput } from "./types";
import * as utils from "./utils";

export class DefaultInput extends NetplayInput<DefaultInput> {
  pressed: { [key: string]: boolean } = {};
}

export class DefaultInputReader {
  canvas: HTMLCanvasElement;

  PRESSED_KEYS = {};

  getCanvasScale(): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: this.canvas.width / rect.width,
      y: this.canvas.height / rect.height,
    };
  }

  projectClientPosition(
    clientX: number,
    clientY: number
  ): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scale = this.getCanvasScale();

    return {
      x: (clientX - rect.left) * scale.x,
      y: (clientY - rect.top) * scale.y,
    };
  }

  constructor(
    canvas: HTMLCanvasElement
  ) {
    this.canvas = canvas;

    document.addEventListener(
      "keydown",
      (event) => {
        this.PRESSED_KEYS[event.key] = true;
      },
      false
    );
    document.addEventListener(
      "keyup",
      (event) => {
        this.PRESSED_KEYS[event.key] = false;
      },
      false
    );
  }

  getInput(): DefaultInput {
    let input = new DefaultInput();

    for (let key in this.PRESSED_KEYS) {
      if (this.PRESSED_KEYS[key]) input.pressed[key] = true;
    }

    return input;
  }
}
