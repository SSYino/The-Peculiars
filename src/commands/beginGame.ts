import { CommandInteraction, MessageComponentInteraction, MessageEmbed, Role, TextChannel, CollectorFilter, InteractionCollector, ButtonInteraction, Message } from "discord.js";
import readyButton from "../utils/buttons/ready";
import Game from "../providers/Game";
import readyEmbed from "../utils/messageEmbeds/ready";

export default async (inviteMessage: Message, gameInteraction: CommandInteraction, playerRole: Role, gameChannel: TextChannel) => {
    // Disable "begin" Slash Command
    const beginSlashCommand = gameInteraction.guild?.commands.cache.find(command => command.name === 'begin')
    if (!beginSlashCommand) return gameInteraction.channel?.send("Error: Could not find \"begin\" Slash Command in cache\nbeginGame.ts")
    beginSlashCommand.permissions.set({ permissions: [] })

    // Update invite message
    const oldEmbed = (await inviteMessage.fetch()).embeds[0]
    const newEmbed = new MessageEmbed(oldEmbed)
    const [fieldPlayerCount,, fieldGameStatus] = newEmbed.fields
    const currentPlayerCount = fieldPlayerCount.value.match(/^\d+/)![0];
    
    fieldPlayerCount.name = "**Playing**";
    fieldPlayerCount.value = currentPlayerCount;
    fieldGameStatus.value = "In Progress";

    inviteMessage.edit({ embeds: [newEmbed] })
    
    // Disable players sending messages
    gameChannel.permissionOverwrites.edit(playerRole, { SEND_MESSAGES: false });

    // Send Ready Message
    const readyMessage = await gameInteraction.followUp({embeds: [readyEmbed("waiting", 0, parseInt(currentPlayerCount))], components: [readyButton("waiting")], fetchReply: true})

    // Ready Button Collector
    const filter: CollectorFilter<[MessageComponentInteraction]> = (i): boolean => {
        return i.isButton();
    }
    const buttonCollector = gameInteraction.channel?.createMessageComponentCollector({filter, componentType: "BUTTON"}) as InteractionCollector<ButtonInteraction>

    // Get Game instance
    const game = Game.get(gameInteraction.guildId!);
    if (!game) return gameInteraction.channel?.send("Error: Could not find game instance on the current guild");
    
    // Start Game
    game.start(buttonCollector, readyEmbed, readyMessage as Message, inviteMessage)
    // game.on("endRound", //update round in invite box)
    /*
    everyone pressed ready
    got interaction from every player
    send messages of all locations available
    random location
    random a player to become spy
    other players except for spy gets sent the random location from earlier
    the non spy players gets assigned a randomized job from that location
    send message (ephemeral) to spy to inform him of his role and his duties
    send message (ephemeral) to other players to inform them of the location, their jobs and their duty
    randomize the players to form a sequence of players (a queue)
    send a message to the channel to tell who the first person to ask questions is
    create a form for the person asking to be able to input a player to answer the question
    after choosing, send ephemeral msg to that player with a button to press after answering (the person asking also has the same button to confirm that the question has been answered)
    also send a message to the channel to inform everyone who is being asked
    after question has been answered (and buttons pressed), remove the buttons, and edit the message of the person asking back to normal (location and job message) (can stack embeds prior for easier removal)
    choose to next person to ask questions
    the spy always has an input form to answer the location
    if the spy answers correctly, end the round immediately, spy wins, otherwise, end the round, spy loses
    Show the avatar and name of the user who won
    */
}