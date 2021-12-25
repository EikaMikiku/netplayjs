import { DefaultInput, DefaultInputReader } from "./defaultinput";
import { NetplayPlayer, NetplayState } from "./types";

import * as log from "loglevel";
import { GameClass } from "./game";
import { DEV } from "./debugging";
import Peer from "peerjs";

import * as query from "query-string";
import { doc } from "prettier";
import { assert } from "chai";

export abstract class GameWrapper {
  gameClass: GameClass;

  /** The canvas that the game will be rendered onto. */
  canvas: HTMLCanvasElement;

  /** The network stats UI. */
  stats: HTMLDivElement;

  inputReader: DefaultInputReader;

  isChannelOrdered(channel: RTCDataChannel) {
    return channel.ordered;
  }

  isChannelReliable(channel: RTCDataChannel) {
    return (
      channel.maxPacketLifeTime === null && channel.maxRetransmits === null
    );
  }

  checkChannel(channel: RTCDataChannel) {
    assert.isTrue(
      this.isChannelOrdered(channel),
      "Data Channel must be ordered."
    );
    assert.isTrue(this.isChannelReliable(channel), "Channel must be reliable.");
  }

  constructor(gameClass: GameClass) {
    this.gameClass = gameClass;

    this.canvas = this.gameClass.canvas;

    // Create stats UI
    this.stats = document.createElement("div");
    if (DEV) {
      this.stats.style.zIndex = "1";
      this.stats.style.position = "absolute";
      this.stats.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      this.stats.style.color = "white";
      this.stats.style.padding = "5px";
      this.stats.style.display = "none";

      document.body.appendChild(this.stats);
    }

    this.inputReader = new DefaultInputReader();
  }

  peer?: Peer;

  start() {
    log.info("Creating a PeerJS instance.");

    this.peer = new Peer();
    this.peer.on("error", (err) => console.error(err));

    this.peer!.on("open", (id) => {
      // Try to parse the room from the hash. If we find one,
      // we are a client.
      const parsedHash = query.parse(window.location.hash);
      const isClient = !!parsedHash.room;

      if (isClient) {
        // We are a client, so connect to the room from the hash.
        log.info(`Connecting to room ${parsedHash.room}.`);

        const conn = this.peer!.connect(parsedHash.room as string, {
          serialization: "json",
          reliable: true,
          // @ts-ignore
          _payload: {
            // This is a hack to get around a bug in PeerJS
            originator: true,
            reliable: true,
          },
        });

        conn.on("error", (err) => console.error(err));

        // Construct the players array.
        const players = [
          new NetplayPlayer(0, false, true), // Player 0 is our peer, the host.
          new NetplayPlayer(1, true, false), // Player 1 is us, a client
        ];

        this.startClient(players, conn);
      } else {
        // We are host, so we need to show a join link.
        log.info("Showing join link.");

        // Show the join link.
        if (this.gameClass.onURL) {
          this.gameClass.onURL(`${window.location.href}#room=${id}`);
        }

        // Construct the players array.
        const players: Array<NetplayPlayer> = [
          new NetplayPlayer(0, true, true), // Player 0 is us, acting as a host.
          new NetplayPlayer(1, false, false), // Player 1 is our peer, acting as a client.
        ];

        // Wait for a connection from a client.
        this.peer!.on("connection", (conn) => {
          conn.on("error", (err) => console.error(err));

          this.startHost(players, conn);
        });
      }
    });
  }

  formatRTCStats(stats: RTCStatsReport): string {
    let output = "";
    stats.forEach((report) => {
      output += `<details>`;
      output += `<summary>${report.type}</summary>`;

      Object.keys(report).forEach((key) => {
        if (key !== "type") {
          output += `<div>${key}: ${report[key]}</div> `;
        }
      });

      output += `</details>`;
    });
    return output;
  }

  rtcStats: string = "";
  watchRTCStats(connection: RTCPeerConnection) {
    setInterval(() => {
      connection
        .getStats()
        .then((stats) => (this.rtcStats = this.formatRTCStats(stats)));
    }, 1000);
  }

  abstract startHost(players: Array<NetplayPlayer>, conn: Peer.DataConnection);
  abstract startClient(
    players: Array<NetplayPlayer>,
    conn: Peer.DataConnection
  );
}
