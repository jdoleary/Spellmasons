import * as Player from '../../entity/Player';
import { hexToString, lightenColor } from './colorUtil';
import { playerNoColor } from './colors';

export const elChatbox = document.getElementById('chatbox');
export const elChatinput = <HTMLInputElement>document.getElementById('chatinput');
export const elChatinner = document.getElementById('messages');

// send message when enter is pressed TODO: send message packet so players in the server can receive the message
elChatinput?.addEventListener('keypress', function (e) {
    if (e.key == 'Enter') {
        var chatname = "Unknown"; // name of chatter
        var chattercolor = hexToString(playerNoColor);
        var message; // input
        var timestamp; // TODO: Include time?
        if (globalThis.player?.name) {
            chatname = globalThis.player.name;
            chattercolor = globalThis.player?.color ? hexToString(lightenColor(globalThis.player.color, 0.3)) : chattercolor;
            console.log("chattercolor: " + chattercolor);
            console.log("playercolor: " + globalThis.player.color + " playerhex: " + hexToString(globalThis.player?.color));
        }
        message = elChatinput.value;
        if (elChatinner) {
            elChatinner.innerHTML += `<div class="message-speaker" style="color: ${chattercolor};">${chatname}:
            <span class="text" style="color: white;">${message}</span></div> <br>`;
        }
        elChatinput.value = ""; // clear chat after sending message
    }
})


export function focusChat() {
    elChatinput?.classList.toggle('disabled', true) // disable it so the first keypress doesn't go into chat
    elChatinput?.focus();
    elChatinput?.classList.toggle('disabled', false) // enable it again
}
