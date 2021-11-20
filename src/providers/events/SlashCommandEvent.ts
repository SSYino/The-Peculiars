import { EventEmitter } from 'events';

class SlashCommandEvent {

    public emitter: EventEmitter;

    constructor() {
        this.emitter = new EventEmitter();
    }

}

export default new SlashCommandEvent();