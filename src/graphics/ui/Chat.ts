import * as Player from '../../entity/Player';
import { Overworld } from '../../Overworld';
import { hexToString, lightenColor } from './colorUtil';
import { playerNoColor } from './colors';
import { MESSAGE_TYPES } from '../../types/MessageTypes';

export const elChatbox = document.getElementById('chatbox');
export const elChatinput = <HTMLInputElement>document.getElementById('chatinput');
export const elChatinner = document.getElementById('messages');
var chatTimeout: NodeJS.Timeout;
var NotificationTime = 5000; // time in seconds the chat stays open after a message is sent

// send message when enter is pressed TODO: send message packet so players in the server can receive the message
export function sendChatHandler(overworld: Overworld, e: KeyboardEvent) {
  if (e.key == 'Enter') {
    if (elChatinput.value.trim().length) {
      // check for chat input after trimming whitespace
      const message = elChatinput.value;
      // send chat to multiplayer
      overworld.pie.sendData({
        type: MESSAGE_TYPES.CHAT_SENT,
        message,
      });
      elChatinput.value = ''; // clear chat after sending message
    } else {
      document.body.classList.toggle('showChat', false); // user hit enter while chat is empty, go ahead and hide it
    }
  }
}

export function ReceiveMessage(chatter: Player.IPlayer, message: String) {
  var chatname = chatter.name ? chatter.name : "Unknown" // name of chatter
  var chattercolor = chatter.color ? hexToString(lightenColor(chatter.color, 0.3)) : hexToString(playerNoColor);
  // var timestamp;  TODO: Include time?
  if (elChatinner) {
    elChatinner.innerHTML += `<div class="message-speaker" style="color: ${chattercolor};">${chatname}:
    <span class="text" style="color: white;">${message}</span></div> <br>`;
    document.body.classList.toggle('showChat', true); // display chat if it was hidden
    if (chatTimeout) {
      clearTimeout(chatTimeout);
    }
    chatTimeout = setTimeout(() => {
      if (document.activeElement !== elChatinput) {
        document.body.classList.toggle('showChat', false)
      }
    }, NotificationTime)
  }
}

export function focusChat(event: Event | undefined) {
  event?.preventDefault();
  elChatinput?.focus();
}
