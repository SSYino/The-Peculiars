import { Collection, Snowflake, GuildMember, Guild, InteractionCollector, ButtonInteraction, MessageEmbed, Message, TextChannel, SelectMenuInteraction, CollectorFilter, Role, MessageComponentInteraction } from "discord.js"
import fs from "fs";
import readyButton from "../utils/buttons/ready";
import gameLocationsButtons from "../utils/buttons/gameLocations"
import gameLocationsEmbed from "../utils/messageEmbeds/gameLocations"
import gameLocations from "../utils/buttons/gameLocations";
import gameLocationsComponents from "../utils/buttons/gameLocationsComponents";
import spyLocationSelectMenu from "../utils/selectMenus/spyLocation";
import spyLocationConfirmation from "../utils/buttons/spyLocationConfirmation";
import victoryEmbed from "../utils/messageEmbeds/victory";
import SlashCommandEvent from "./events/SlashCommandEvent";
import invite from "../utils/messageEmbeds/invite";
import giveGameRole from "../utils/buttons/giveGameRole";
import startNewRoundAndEndGameButton from "../utils/buttons/startNewRoundAndEndGameButton";
import prepareVote from "../utils/messageEmbeds/prepareVote";
import poll from "../utils/buttons/poll";
import allPlayersSelectMenu from "../utils/selectMenus/allPlayers";
import voteResults from "../utils/messageEmbeds/voteResults";
import { promisify } from "util";

type GamePlayers = Collection<Snowflake, GuildMember>
type ReadyPlayers = Collection<Snowflake, { guildMember: GuildMember, playerData: PlayerGameData }>
type GameLocations = Collection<string, GameLocationInterface>
type LocationName = string
type CustomButtonID = string
type UserID = string
type PlayerMarkedOutLocations = Collection<Snowflake, CustomButtonID[]>
type RoundNumber = number
type GameRounds = Collection<RoundNumber, RoundInfoInterface | {}>
type PlayerGameData = PlayerGameDataInterface

interface GameLocationInterface {
    readonly name: string
    readonly jobs: Collection<string, { imageRelativePath: string }>
    readonly imageRelativePath: string
}

interface GameOptionsLocationInterface {
    [locationName: string]: {
        jobs: string[]
        imageRelativePath: string
    }
}

interface RoundInfoInterface {
    roundNumber: number
    players: ReadyPlayers
    location: string
    spy: GuildMember
    winningTeam: "Spy" | "The Innocents" | "Draw" | "None"
}

interface PlayerGameDataInterface {
    job: string | null
    vote?: UserID
}

class Game {
    public readonly locations: GameLocations
    private _players: GamePlayers | null
    public readonly guild: Guild
    public readonly gameTextChannel: TextChannel
    public readonly gameRole: Role
    public readonly inviteMessage: Message
    private _readyPlayers: ReadyPlayers | null
    private _markedOutLocations: PlayerMarkedOutLocations | null
    private _rounds: GameRounds
    private _currentRound: RoundInfoInterface | "Starting" | null

    private static _instances: Game[] = []

    constructor(guild: Guild, gameChannel: TextChannel, gameRole: Role, inviteMessage: Message) {
        this._players = null;
        this.guild = guild;
        this.gameTextChannel = gameChannel;
        this.gameRole = gameRole;
        this.inviteMessage = inviteMessage;
        this._readyPlayers = null;
        this._markedOutLocations = null;
        this._rounds = new Collection<0, {}>();
        this._currentRound = null;
        const startingLocations = JSON.parse(`${fs.readFileSync(`${process.cwd()}/gameOptions.json`)}`).locations as GameOptionsLocationInterface
        const locationMap = new Collection<LocationName, GameLocationInterface>()
        for (const locationName of Object.keys(startingLocations)) {
            const locationData: any = startingLocations[locationName]
            const jobs: string[] = locationData.jobs;
            const jobCollection = new Collection<string, { imageRelativePath: string }>()

            jobs.forEach(job => jobCollection.set(job, { imageRelativePath: "None" }))

            locationData.jobs = jobCollection
            locationData.name = locationName
            locationMap.set(locationName, locationData)
        }
        this.locations = locationMap
        Game._instances.push(this)
    }

    public addPlayer(player: GuildMember): GamePlayers | undefined {
        if (!this._players) {
            return this._players = new Collection<Snowflake, GuildMember>([
                [player.id, player]
            ]);
        }
        else {
            return this._players.set(player.id, player)
        }
    }

    public getPlayers(): GamePlayers | null {
        return this._players;
    }

    private addReadyPlayer(player: GuildMember): ReadyPlayers | undefined {
        if (!this._readyPlayers) {
            return this._readyPlayers = new Collection<Snowflake, { guildMember: GuildMember, playerData: PlayerGameDataInterface }>([
                [player.id, { guildMember: player, playerData: { job: null } }]
            ]);
        }
        else {
            return this._readyPlayers.set(player.id, { guildMember: player, playerData: { job: null } })
        }
    }

    public getReadyPlayers(): ReadyPlayers | null {
        return this._readyPlayers;
    }

    public static get(guildId: string): Game | undefined {
        return this._instances.find(game => game.guild.id === guildId);
    }

    public static clearInstance(guildId?: string): Game | Game[] | undefined {
        if (!guildId) {
            const instances = this._instances;
            this._instances = [];
            return instances
        }
        return this._instances.find((game, index) => {
            if (game.guild.id === guildId) {
                this._instances.splice(index, 1)
                return true
            }
        })
    }

    public static getInstances(): Game[] {
        return this._instances;
    }

    private setPrivateMarkedOutLocations(playerId: string, markedOutButtons: CustomButtonID[]): void {
        let markedOutLocations = this._markedOutLocations;

        if (markedOutLocations) {
            markedOutLocations.delete(playerId)
        }
        else {
            const privateLocationsCollection = new Collection<string, CustomButtonID[]>();
            this._markedOutLocations = privateLocationsCollection;
        }

        this._markedOutLocations!.set(playerId, markedOutButtons);
    }

    private getPrivateMarkedOutLocations(playerId: string): CustomButtonID[] | null | undefined {
        if (!this._markedOutLocations) return null;

        const playerMarkedOutLocations = this._markedOutLocations.get(playerId);

        if (!playerMarkedOutLocations) return undefined
        else return playerMarkedOutLocations
    }

    public getCurrentRound() {
        return this._currentRound
    }

    private setCurrentRound(roundNumber: number, location: string, players: ReadyPlayers, spy: GuildMember, winningTeam: "Spy" | "The Innocents" | "Draw" | "None" = "None"): RoundInfoInterface {
        this._currentRound = { roundNumber, location, players, spy, winningTeam };
        return this._currentRound;
    }

    public startCurrentRound() {
        this._currentRound = "Starting";
    }

    private pushToRounds(round: RoundInfoInterface) {
        this._rounds.set(round.roundNumber, round)
    }

    public start(buttonCollector: InteractionCollector<ButtonInteraction>, selectMenuCollector: InteractionCollector<SelectMenuInteraction>, readyEmbed: (state: ("waiting" | "started"), currentPlayers?: number, maxPlayers?: number) => MessageEmbed, readyMessage: Message, inviteMessage: Message): void {
        let gameLocationsMessage: Message; // TODO | later move this to game state (maybe)
        let pollData: { message: Message, user: GuildMember }; // TODO | later move this to game state (maybe)
        let pollLock: boolean = false;
        let pollSession: boolean = false; // TODO | later move this to game state (maybe)
        let readyStartLock: boolean = false;

        const randomizeLocationsAndJobs = (): boolean => {
            // Randomize Location
            const location = this.locations.random();

            // Randomize a single player to become the spy
            if (!this._readyPlayers) {
                readyMessage.channel.send("Error: Could not pick a spy (ReadyPlayers is null)");
                return false
            }
            const spy = this._readyPlayers.random()
            spy.playerData.job = "Spy"

            // Assign random jobs for players and set game location
            const nonSpyPlayerCount = this._readyPlayers.size - 1;
            const randomJobs = location.jobs.randomKey(nonSpyPlayerCount)
            let jobIndex = 0;

            this._readyPlayers.forEach(player => {
                if (player.playerData.job !== "Spy") {
                    player.playerData.job = randomJobs[jobIndex]
                    jobIndex++
                }
            })

            const latestRound = this._rounds.lastKey()!;
            this.setCurrentRound(latestRound + 1, location.name, this._readyPlayers, spy.guildMember)

            return true
        }

        buttonCollector.on("collect", async (buttonInteraction) => {
            if (buttonInteraction.customId === "ready") {
                if (!this._players) throw "Error in ready button collector: No players in game instance"
                // TODO | Allow players to unready
                if (this._readyPlayers?.has(buttonInteraction.user.id)) return buttonInteraction.reply({ ephemeral: true, content: "You cannot unready (yet)" })

                this.addReadyPlayer(buttonInteraction.member as GuildMember);
                if (!this._readyPlayers) throw "Error in ready button collector: No ready players in game instance"

                await buttonInteraction.reply(`<@${buttonInteraction.user.id}> is Ready!`)

                if (this._players.size !== this._readyPlayers.size) {
                    const currentPlayerCount = this._readyPlayers.size
                    const maxPlayerCount = this._players.size
                    readyMessage.edit({ embeds: [readyEmbed("waiting", currentPlayerCount, maxPlayerCount)] })
                } else {
                    if (readyStartLock) return
                    readyStartLock = true

                    readyMessage.edit({ embeds: [readyEmbed("started")], components: [readyButton("started")] })

                    const randomized = randomizeLocationsAndJobs();
                    if (!randomized) return

                    // Update Round on Invite Message
                    const oldEmbed = (await inviteMessage.fetch()).embeds[0]
                    const newEmbed = new MessageEmbed(oldEmbed)
                    let [, round] = newEmbed.fields;
                    round.value = `${parseInt(round.value) + 1}`
                    inviteMessage.edit({ embeds: [newEmbed] })

                    // Start Sending Locations
                    gameLocationsMessage = await readyMessage.channel.send({ embeds: [gameLocationsEmbed(this.locations)], components: [gameLocationsComponents()] })
                }
            }

            else if (buttonInteraction.customId === "showJob") {
                if (this._currentRound === "Starting") return buttonInteraction.reply("Error: Round Status is \"Starting\"");
                const location = this._currentRound?.location;
                const job = this._readyPlayers?.get(buttonInteraction.user.id)?.playerData.job

                if (!location) return buttonInteraction.reply("Error: Could not find location for current round");
                if (job === null) return buttonInteraction.reply("Error: User did not recieve a job")
                else if (job === undefined) return buttonInteraction.reply("Error: Could not find user in ReadyPlayers")

                if (job === "Spy") {
                    const selectMenu = spyLocationSelectMenu(this.locations);
                    buttonInteraction.reply({ content: `You are a **Spy**\nGuess the location correctly to win the game`, ephemeral: true, components: [selectMenu] })
                }
                else buttonInteraction.reply({ content: `We are currently at the **${location}**\nYou are a/an **${job}**`, ephemeral: true })
            }

            else if (buttonInteraction.customId === "showPrivateLocations") {
                const player = this._readyPlayers?.get(buttonInteraction.user.id)
                const markedOutButtons = this.getPrivateMarkedOutLocations(buttonInteraction.user.id);

                if (!player) { buttonInteraction.reply("Error: Could not find player in ReadyPlayers"); return }
                if (!markedOutButtons) buttonInteraction.reply({ content: "Locations", components: gameLocations(this.locations), ephemeral: true })
                else buttonInteraction.reply({ content: "Locations", components: gameLocations(this.locations, markedOutButtons), ephemeral: true })
            }

            else if (buttonInteraction.customId === "startVote") {
                if (pollLock) return
                pollLock = true;
                pollSession = true

                buttonInteraction.update({ components: [gameLocationsComponents(false, true)] })

                const displayName = (buttonInteraction.member as GuildMember).displayName;
                const userIconURL = buttonInteraction.user.displayAvatarURL({ dynamic: true, size: 1024 });
                const prepareVoteEmbed = prepareVote(displayName, userIconURL, this._readyPlayers!.size);

                const pollMessage = await buttonInteraction.channel!.send({ embeds: [prepareVoteEmbed], components: [poll] });
                pollData = { message: pollMessage, user: buttonInteraction.member as GuildMember };

                pollLock = false;
            }

            else if (buttonInteraction.customId === "vote") {
                buttonInteraction.reply({ ephemeral: true, content: "**VOTE**", components: [allPlayersSelectMenu(this._readyPlayers!)] })
            }

            else if (buttonInteraction.customId === "closePoll") {
                if (buttonInteraction.user.id !== pollData.user.id) return buttonInteraction.reply({ ephemeral: true, content: "Only the player who created this poll can close it" });

                (await gameLocationsMessage.fetch()).edit({ components: [gameLocationsComponents()] });
                (buttonInteraction.message as Message).delete().catch(err => console.error(err));
                pollSession = false;
                this._readyPlayers!.forEach(player => player.playerData.vote = undefined);
            }

            else if (buttonInteraction.customId.startsWith("location")) {
                const playerPrivateMarkedOutLocations = this.getPrivateMarkedOutLocations(buttonInteraction.user.id);

                if (!playerPrivateMarkedOutLocations) {
                    const newButtons = gameLocationsButtons(this.locations, [buttonInteraction.customId]);
                    this.setPrivateMarkedOutLocations(buttonInteraction.user.id, [buttonInteraction.customId]);

                    buttonInteraction.update({ components: newButtons });
                }
                else {
                    const markedOutLocationsCopy = playerPrivateMarkedOutLocations.slice();
                    const testArr = markedOutLocationsCopy.filter(ID => ID !== buttonInteraction.customId)

                    // markedOutLocationsCopy does not have the current buttonInteraction customId in it
                    if (testArr.length === markedOutLocationsCopy.length) {
                        markedOutLocationsCopy.push(buttonInteraction.customId)
                        const newButtons = gameLocationsButtons(this.locations, markedOutLocationsCopy)
                        buttonInteraction.update({ components: newButtons })
                        this.setPrivateMarkedOutLocations(buttonInteraction.user.id, markedOutLocationsCopy)
                    }
                    // current buttonInteraction's customId already exists in markedoutLocationsCopy
                    else {
                        const newButtons = gameLocationsButtons(this.locations, testArr) // Use testArr as the new marked out locations instead (unmarking the button from current buttonInteraction)
                        buttonInteraction.update({ components: newButtons })
                        this.setPrivateMarkedOutLocations(buttonInteraction.user.id, testArr)
                    }
                }
            }

            else if (buttonInteraction.customId.startsWith("confirmation")) {
                if (buttonInteraction.customId.startsWith('confirmationNo')) {
                    const selectMenu = spyLocationSelectMenu(this.locations);
                    buttonInteraction.update({ content: `You are a **Spy**\nGuess the location correctly to win the game`, components: [selectMenu] })
                }
                else if (buttonInteraction.customId.startsWith('confirmationYes')) {
                    if (pollSession) return buttonInteraction.reply({ ephemeral: true, content: "You are not allowed to guess the location during a poll session" });

                    buttonCollector.stop()
                    selectMenuCollector.stop()
                    gameLocationsMessage.edit({ components: [gameLocationsComponents(true)] })

                    const nextRoundButtonFilter: CollectorFilter<[ButtonInteraction]> = (i): boolean => {
                        return i.isButton() && (i.customId === "startNewRound" || i.customId === "endGame")
                    }
                    const gameButtonCollector = buttonInteraction.channel!.createMessageComponentCollector({ filter: nextRoundButtonFilter, componentType: "BUTTON", max: 1 })
                    const gameTextChannel = this.gameTextChannel;
                    const inviteMessage = this.inviteMessage;
                    const commands = buttonInteraction.guild!.commands.cache;

                    const beginCommand = commands.find(command => command.name == "begin");
                    if (!beginCommand) return buttonInteraction.reply("Error: Could not find the \"begin\" slash command")

                    gameButtonCollector.on("collect", (i) => {
                        i.update({ components: [startNewRoundAndEndGameButton(true)] });
                        SlashCommandEvent.emitter.emit("gameInteraction", i)

                        if (i.customId === "startNewRound") {
                            beginCommand.permissions.set({
                                permissions: [
                                    {
                                        id: this.gameRole.id,
                                        type: "ROLE",
                                        permission: false
                                    }
                                ]
                            })
                        }
                        else if (i.customId === "endGame") {
                            const endCommand = commands.find(command => command.name === "end")
                            if (!endCommand) return i.reply("Error: Could not find the \"end\" slash command")

                            endCommand.permissions.set({
                                permissions: [
                                    {
                                        id: this.gameRole.id,
                                        type: "ROLE",
                                        permission: false
                                    }
                                ]
                            })
                        }
                    })

                    buttonInteraction.update({ content: "You may now dismiss this message ( bottom left )", components: [] })

                    const guess = buttonInteraction.customId.replace(/^(confirmation(No|Yes))(.+)/, "$3");

                    const currentRound = this._currentRound
                    if (currentRound === "Starting") return buttonInteraction.channel?.send("Error: Current round status is \"Starting\"") as void
                    if (!currentRound) return buttonInteraction.channel?.send("Error: Current round property in Game class is null") as void

                    if (currentRound.location === guess) {
                        // Spy won the game

                        const round = this.setCurrentRound(currentRound.roundNumber, guess, currentRound.players, currentRound.spy, "Spy")
                        this.pushToRounds(round);
                        this._currentRound = null;

                        const vicEmbed = victoryEmbed("Spy", "spyGuess", { location: guess, playerCount: currentRound.players.size, spy: currentRound.spy, spyGuess: guess })
                        buttonInteraction.channel?.send({ embeds: [vicEmbed.embed], components: [startNewRoundAndEndGameButton()] })
                    }
                    else {
                        // Spy lost the game

                        const round = this.setCurrentRound(currentRound.roundNumber, currentRound.location, currentRound.players, currentRound.spy, "The Innocents")
                        this.pushToRounds(round);
                        this._currentRound = null;

                        const vicEmbed = victoryEmbed("The Innocents", "spyGuess", { location: currentRound.location, playerCount: currentRound.players.size, spy: currentRound.spy, spyGuess: guess })
                        buttonInteraction.channel?.send({ embeds: [vicEmbed.embed], components: [startNewRoundAndEndGameButton()], files: [vicEmbed.files || ""] })
                    }

                    await beginCommand.permissions.set({
                        permissions: [
                            {
                                id: this.gameRole.id,
                                type: "ROLE",
                                permission: true
                            }
                        ]
                    })

                    this._readyPlayers = null
                    this._markedOutLocations = null

                    gameTextChannel.permissionOverwrites.edit(this.gameRole, { SEND_MESSAGES: true })

                    const oldEmbed = (await inviteMessage.fetch()).embeds[0];
                    const [playerCount, roundNumber] = oldEmbed.fields
                    const newEmbed = invite();
                    const newInviteMessageEmbedFields = newEmbed.fields.map(field => {
                        if (field.name === "**In Lobby**") {
                            field.value = `${playerCount.value} / 10`
                            return field
                        }
                        else if (field.name === "**Round**") {
                            field.value = roundNumber.value
                            return field
                        }
                        else return field
                    })

                    newEmbed.fields = newInviteMessageEmbedFields;

                    inviteMessage.edit({ embeds: [newEmbed], components: [giveGameRole("waiting")] })
                }
            }

            else { console.log(buttonInteraction.customId, "custom Button ID") }
        })

        selectMenuCollector.on("collect", async (selectMenuInteraction) => {
            const player = this._readyPlayers?.get(selectMenuInteraction.user.id);

            if (selectMenuInteraction.customId === "spyLocation") {
                if (pollSession) return selectMenuInteraction.reply({ ephemeral: true, content: "You are not allowed to guess the location during a poll session" });
                if (!player) return selectMenuInteraction.reply("Error: Unable to retrieve the spy's player information");

                const locationSelected = selectMenuInteraction.values[0];
                const yesAndNoButtons = spyLocationConfirmation(locationSelected)

                selectMenuInteraction.update({ content: `Are you sure the location is **${locationSelected}**?\nYou have only **1** chance!`, components: [yesAndNoButtons] })
            }
            else if (selectMenuInteraction.customId === "allPlayers") {
                if (!player) return selectMenuInteraction.reply("Error: Unable to retrieve player information");

                try { await pollData.message.fetch() }
                catch (err) { return selectMenuInteraction.update({ content: "THE POLL HAS CLOSED", components: [] }) }

                const playerVote = player.playerData.vote
                player.playerData.vote = selectMenuInteraction.values[0]
                const currentVoted = this._readyPlayers!.filter(player => player.playerData.vote !== undefined).size;

                // User has not voted in this round
                if (!playerVote) {
                    try {
                        const oldEmbed = (await pollData.message.fetch()).embeds[0]
                        const newEmbed = new MessageEmbed(oldEmbed)
                        newEmbed.fields[0].value = `${currentVoted} / ${this._readyPlayers?.size}`

                        pollData.message.edit({ embeds: [newEmbed] })
                    }
                    catch (err) { return selectMenuInteraction.update({ content: "THE POLL HAS CLOSED", components: [] }) }

                    selectMenuInteraction.update({ content: "SUCCESSFULLY RECEIVED YOUR VOTE", components: [] })
                }
                // User has already voted in this round
                else {
                    try { await pollData.message.fetch() }
                    catch (err) { return selectMenuInteraction.update({ content: "THE POLL HAS CLOSED", components: [] }) }

                    selectMenuInteraction.update({ content: "SUCCESSFULLY UPDATED YOUR VOTE", components: [] })
                }

                if (currentVoted === this._readyPlayers?.size) {
                    buttonCollector.stop()
                    selectMenuCollector.stop()
                    gameLocationsMessage.edit({ components: [gameLocationsComponents(true)] })

                    selectMenuInteraction.channel?.send("Everyone has voted!")

                    const filter: CollectorFilter<[ButtonInteraction]> = (i): boolean => {
                        return i.isButton() && (i.customId === "startNewRound" || i.customId === "endGame")
                    }
                    const gameButtonCollector = selectMenuInteraction.channel!.createMessageComponentCollector({ filter, componentType: "BUTTON", max: 1 })
                    const gameTextChannel = this.gameTextChannel;
                    const inviteMessage = this.inviteMessage;
                    const commands = selectMenuInteraction.guild!.commands.cache;

                    const beginCommand = commands.find(command => command.name == "begin");
                    if (!beginCommand) return selectMenuInteraction.reply("Error: Could not find the \"begin\" slash command")

                    gameButtonCollector.on("collect", (i) => {
                        i.update({ components: [startNewRoundAndEndGameButton(true)] });
                        SlashCommandEvent.emitter.emit("gameInteraction", i)

                        if (i.customId === "startNewRound") {
                            beginCommand.permissions.set({
                                permissions: [
                                    {
                                        id: this.gameRole.id,
                                        type: "ROLE",
                                        permission: false
                                    }
                                ]
                            })
                        }
                        else if (i.customId === "endGame") {
                            const endCommand = commands.find(command => command.name === "end")
                            if (!endCommand) return i.reply("Error: Could not find the \"end\" slash command")

                            endCommand.permissions.set({
                                permissions: [
                                    {
                                        id: this.gameRole.id,
                                        type: "ROLE",
                                        permission: false
                                    }
                                ]
                            })
                        }
                    })

                    const currentRound = this._currentRound
                    if (currentRound === "Starting") return selectMenuInteraction.channel?.send("Error: Current round status is \"Starting\"") as void
                    if (!currentRound) return selectMenuInteraction.channel?.send("Error: Current round property in Game class is null") as void

                    // Function for editing round data to prepare for new round
                    const endRound = async (winningTeam: "Spy" | "The Innocents" | "Draw") => {
                        if (winningTeam === "Spy") {
                            // Spy won the game

                            const round = this.setCurrentRound(currentRound.roundNumber, currentRound.location, currentRound.players, currentRound.spy, "Spy");
                            this.pushToRounds(round);
                            this._currentRound = null;
                        }
                        else if (winningTeam === "The Innocents") {
                            // Spy lost the game

                            const round = this.setCurrentRound(currentRound.roundNumber, currentRound.location, currentRound.players, currentRound.spy, "The Innocents");
                            this.pushToRounds(round);
                            this._currentRound = null;
                        }
                        else {
                            // Its a draw

                            const round = this.setCurrentRound(currentRound.roundNumber, currentRound.location, currentRound.players, currentRound.spy, "Draw");
                            this.pushToRounds(round);
                            this._currentRound = null
                        }

                        await beginCommand.permissions.set({
                            permissions: [
                                {
                                    id: this.gameRole.id,
                                    type: "ROLE",
                                    permission: true
                                }
                            ]
                        })

                        this._readyPlayers = null
                        this._markedOutLocations = null

                        gameTextChannel.permissionOverwrites.edit(this.gameRole, { SEND_MESSAGES: true })

                        const oldEmbed = (await inviteMessage.fetch()).embeds[0];
                        const [playerCount, roundNumber] = oldEmbed.fields
                        const newEmbed = invite();
                        const newInviteMessageEmbedFields = newEmbed.fields.map(field => {
                            if (field.name === "**In Lobby**") {
                                field.value = `${playerCount.value} / 10`
                                return field
                            }
                            else if (field.name === "**Round**") {
                                field.value = roundNumber.value
                                return field
                            }
                            else return field
                        })

                        newEmbed.fields = newInviteMessageEmbedFields;

                        inviteMessage.edit({ embeds: [newEmbed], components: [giveGameRole("waiting")] })
                    }

                    // Function for implementing the vote checking
                    const processVote = () => {
                        const nominatedSpies = new Map<UserID, { displayName: string, userID: string, voters: UserID[] }>();

                        for (const player of this._readyPlayers!) {
                            const voteeUserID = player[1].playerData.vote!;

                            if (nominatedSpies.has(voteeUserID)) {
                                nominatedSpies.get(voteeUserID)!.voters.push(player[1].guildMember.id)
                            }
                            else {
                                const displayName = selectMenuInteraction.guild!.members.cache.get(voteeUserID)?.displayName;
                                if (!displayName) throw "Error: Could not find member in guild cache";

                                nominatedSpies.set(voteeUserID, { displayName, userID: voteeUserID, voters: [player[1].guildMember.id] })
                            }
                        }

                        return Array.from(nominatedSpies.values());
                    }

                    const spyUserId = currentRound.spy.id;
                    const nominees = processVote()
                    const voteResultsData = voteResults(nominees, selectMenuInteraction.guild!);

                    await selectMenuInteraction.channel?.send({ embeds: [voteResultsData.embed] })
                    await promisify(setTimeout)(2000);

                    if (voteResultsData.nominated.num === 0) return selectMenuInteraction.channel?.send("Error: There are 0 nominated players") as void
                    else if (voteResultsData.nominated.num === 1) {
                        const nominatedUserID = voteResultsData.nominated.userID![0]
                        let winner: "Spy" | "The Innocents";
                        if (nominatedUserID === spyUserId) winner = "The Innocents"
                        else winner = "Spy"

                        endRound(winner)

                        // send victory message
                        const vicEmbed = victoryEmbed(winner, "playerVotes", { location: currentRound.location, playerCount: this._readyPlayers.size, spy: currentRound.spy });
                        if (!vicEmbed.files) {
                            selectMenuInteraction.channel?.send({ embeds: [vicEmbed.embed], components: [startNewRoundAndEndGameButton()] })
                        }
                        else selectMenuInteraction.channel?.send({ embeds: [vicEmbed.embed], components: [startNewRoundAndEndGameButton()], files: [vicEmbed.files] });
                    }
                    else {
                        // Start a new vote
                        this._readyPlayers.forEach(player => player.playerData.vote = undefined);

                        const tieBreakerPlayers = this._readyPlayers.filter(player => voteResultsData.nominated.userID!.includes(player.guildMember.id));
                        const filter: CollectorFilter<[SelectMenuInteraction]> = (i): boolean => {
                            return i.isSelectMenu() && i.customId === "tieBreaker"
                        }
                        const tieBreakerCollector = selectMenuInteraction.channel!.createMessageComponentCollector({ filter, componentType: "SELECT_MENU" })

                        tieBreakerCollector.on("collect", async i => {
                            const player = this._readyPlayers?.get(i.user.id)
                            if (!player) return i.reply("Error: Unable to get ReadyPlayers data")

                            const playerVote = player.playerData.vote
                            player.playerData.vote = i.values[0]

                            const currentVoted = this._readyPlayers!.filter(player => player.playerData.vote !== undefined).size;

                            if (playerVote) {
                                return i.reply(`<@${i.user.id}> has changed their vote`)
                            }

                            i.reply(`<@${i.user.id}> has voted`)

                            if (currentVoted === this._readyPlayers?.size) {
                                tieBreakerCollector.stop()

                                i.channel?.send("Everyone has voted!")

                                const newNominees = processVote();
                                const newVoteResultsData = voteResults(newNominees, selectMenuInteraction.guild!);

                                await i.channel?.send({ embeds: [newVoteResultsData.embed] })
                                await promisify(setTimeout)(2000);

                                if (newVoteResultsData.nominated.num === 0) return i.channel?.send("Error: There are 0 nominated players") as void
                                else if (newVoteResultsData.nominated.num === 1) {
                                    const nominatedUserID = newVoteResultsData.nominated.userID![0]
                                    let winner: "Spy" | "The Innocents";
                                    if (nominatedUserID === spyUserId) winner = "The Innocents"
                                    else winner = "Spy"

                                    endRound(winner)

                                    // send victory message
                                    const vicEmbed = victoryEmbed(winner, "playerVotes", { location: currentRound.location, playerCount: this._readyPlayers.size, spy: currentRound.spy });
                                    if (!vicEmbed.files) {
                                        i.channel?.send({ embeds: [vicEmbed.embed], components: [startNewRoundAndEndGameButton()] })
                                    }
                                    else i.channel?.send({ embeds: [vicEmbed.embed], components: [startNewRoundAndEndGameButton()], files: [vicEmbed.files] });
                                }
                                else {
                                    // Its a draw
                                    endRound("Draw")

                                    const vicEmbed = victoryEmbed("Draw", "playerVotes", { location: currentRound.location, playerCount: this._readyPlayers.size, spy: currentRound.spy })
                                    if (!vicEmbed.files) {
                                        i.channel?.send({ embeds: [vicEmbed.embed], components: [startNewRoundAndEndGameButton()] })
                                    }
                                    else i.channel?.send({ embeds: [vicEmbed.embed], components: [startNewRoundAndEndGameButton()], files: [vicEmbed.files] });
                                }
                            }
                        })

                        // TODO | Change this to an embed
                        selectMenuInteraction.channel?.send({ content: "**TIE BREAKER**\nWho do you think is the spy?", components: [allPlayersSelectMenu(tieBreakerPlayers, true)] })
                    }
                }
            }
            else selectMenuInteraction.reply("Unknown Interaction");
        })
    }
}

export default Game
export { GameLocations, GameLocationInterface, GamePlayers, ReadyPlayers }