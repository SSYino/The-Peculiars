import { CommandInteraction, MessageEmbed, Role, TextChannel } from "discord.js";

export default async (inviteMessageInteraction: CommandInteraction, gameInteraction: CommandInteraction, inviteMessageEmbed: MessageEmbed, playerRole: Role, gameChannel: TextChannel) => {
    // Disable "begin" Slash Command
    const beginSlashCommand = gameInteraction.guild?.commands.cache.find(command => command.name === 'begin')
    if (!beginSlashCommand) return gameInteraction.channel?.send("Error: Could not find \"begin\" Slash Command in cache\nbeginGame.ts")
    beginSlashCommand.permissions.set({ permissions: [] })

    // Update invite message
    const newEmbed = new MessageEmbed(inviteMessageEmbed)
    const [fieldPlayerCount, fieldRound, fieldGameStatus] = newEmbed.fields
    const currentPlayerCount = fieldPlayerCount.value.match(/^\d+/)![0];

    fieldPlayerCount.name = "**Playing**";
    fieldPlayerCount.value = currentPlayerCount;
    fieldGameStatus.value = "In Progress";

    inviteMessageInteraction.editReply({ embeds: [newEmbed] })

    // Disable players sending messages
    gameChannel.permissionOverwrites.edit(playerRole, { SEND_MESSAGES: false });

    // Send Ready Message
    gameInteraction.followUp("Press button when ready\nEveryone needs to be ready before game can start")

    // Ready Button Collector
    
    // Game.start()

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
    */
}