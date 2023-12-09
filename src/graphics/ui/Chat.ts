import * as Player from '../../entity/Player';
import { Overworld } from '../../Overworld';
import { hexToString, lightenColor } from './colorUtil';
import { playerNoColor } from './colors';
import { MESSAGE_TYPES } from '../../types/MessageTypes';

export const elChatbox = document.getElementById('chatbox');
export const elChatinput = <HTMLInputElement>document.getElementById('chatinput');
export const elChatinner = document.getElementById('messages');
var chatTimeout: NodeJS.Timeout;
var NotificationTime = 5000;

// send message when enter is pressed TODO: send message packet so players in the server can receive the message
export function sendChatHandler(overworld: Overworld, e: KeyboardEvent) {
  if (e.key == 'Enter') {
    if (elChatinput.value.trim().length) {
      // check for chat input after trimming whitespace
      var chatname = 'Unknown'; // name of chatter
      var chattercolor = hexToString(playerNoColor);
      var message; // input
      // var timestamp;  TODO: Include time?
      if (globalThis.player?.name) {
        chatname = globalThis.player.name;
        chattercolor = globalThis.player?.color
          ? hexToString(lightenColor(globalThis.player.color, 0.3))
          : chattercolor;
      }
      message = elChatinput.value;
      if (elChatinner) {
        elChatinner.innerHTML += `<div class="message-speaker" style="color: ${chattercolor};">${chatname}:
            <span class="text" style="color: white;">${message}</span></div> <br>`;
      }
      // send chat to multiplayer
      overworld.pie.sendData({
        type: MESSAGE_TYPES.CHAT_SENT,
        message,
        chattercolor,
      });
      elChatinput.value = ''; // clear chat after sending message
    } else {
      document.body.classList.toggle('showChat', false); // user hit enter while chat is empty, go ahead and hide it
    }
  }
}

export function ReceiveMessage(
  chatter: String,
  message: String,
  chattercolor: String,
) {
  if (elChatinner) {
    elChatinner.innerHTML += `<div class="message-speaker" style="color: ${chattercolor};">${chatter}:
    <span class="text" style="color: white;">${message}</span></div> <br>`;
    document.body.classList.toggle('showChat', true); // display chat if it was hidden
    if (chatTimeout) {
      clearTimeout(chatTimeout);
      chatTimeout = setTimeout(() => {
        if (document.activeElement !== elChatinput) {
          document.body.classList.toggle('showChat', false)
        }
      }, NotificationTime)
    } else {
      chatTimeout = setTimeout(() => {
        if (document.activeElement !== elChatinput) {
          document.body.classList.toggle('showChat', false)
        }
      }, NotificationTime)
    }
  }
}

export function focusChat() {
  elChatinput?.classList.toggle('disabled', true) // disable it so the first keypress doesn't go into chat
  elChatinput?.focus();
  elChatinput?.classList.toggle('disabled', false) // enable it again
}
