import { Collection, Snowflake, GuildMember, Guild, InteractionCollector, ButtonInteraction, MessageEmbed, Message, TextChannel, SelectMenuInteraction, CollectorFilter, Role } from "discord.js"
import fs from "fs";
import readyButton from "../utils/buttons/ready";
import gameLocationsButtons from "../utils/buttons/gameLocations"
import gameLocationsEmbed from "../utils/messageEmbeds/gameLocations"
import gameLocations from "../utils/buttons/gameLocations";
import showJobAndPrivateLocations from "../utils/buttons/showJobAndPrivateLocations";
import spyLocationSelectMenu from "../utils/selectMenus/spyLocation";
import spyLocationConfirmation from "../utils/buttons/spyLocationConfirmation";
import victoryEmbed from "../utils/messageEmbeds/victory";
import SlashCommandEvent from "./events/SlashCommandEvent";
import invite from "../utils/messageEmbeds/invite";
import giveGameRole from "../utils/buttons/giveGameRole";
import startNewRoundAndEndGameButton from "../utils/buttons/startNewRoundAndEndGameButton";

type GamePlayers = Collection<Snowflake, { guildMember: GuildMember, playerData: PlayerGameData }>
type GameLocations = Collection<string, GameLocationInterface>
type LocationName = string
type CustomButtonID = string
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
    players: GamePlayers
    location: string
    spy: GuildMember
    winningTeam: "Spy" | "The Innocents" | "None"
}

interface PlayerGameDataInterface {
    job: string | null
    privateLocationsButtonInteraction?: ButtonInteraction
    showJobButtonInteraction?: ButtonInteraction
    spySelectMenuInteractions?: { interaction: SelectMenuInteraction, guess: string }[]
}

class Game {
    public readonly locations: GameLocations
    private _players: GamePlayers | null
    public readonly guild: Guild
    public readonly gameTextChannel: TextChannel
    public readonly gameRole: Role
    public readonly inviteMessage: Message
    private _readyPlayers: GamePlayers | null
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
            return this._players = new Collection<Snowflake, { guildMember: GuildMember, playerData: PlayerGameDataInterface }>([
                [player.id, { guildMember: player, playerData: { job: null } }]
            ]);
        }
        else {
            return this._players.set(player.id, { guildMember: player, playerData: { job: null } })
        }
    }

    public getPlayers(): GamePlayers | null {
        return this._players;
    }

    private addReadyPlayer(player: GuildMember): GamePlayers | undefined {
        if (!this._readyPlayers) {
            return this._readyPlayers = new Collection<Snowflake, { guildMember: GuildMember, playerData: PlayerGameDataInterface }>([
                [player.id, { guildMember: player, playerData: { job: null } }]
            ]);
        }
        else {
            return this._readyPlayers.set(player.id, { guildMember: player, playerData: { job: null } })
        }
    }

    public getReadyPlayers(): GamePlayers | null {
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

    private setCurrentRound(roundNumber: number, location: string, players: GamePlayers, spy: GuildMember, winningTeam: "Spy" | "The Innocents" | "None" = "None"): RoundInfoInterface {
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
        const randomizeLocationsAndJobs = (): boolean => {
            // Randomize Location
            const location = this.locations.random();

            // Randomize a single player to become the spy
            if (!this._players) {
                readyMessage.channel.send("Error: Could not pick a spy (GamePlayers is null)");
                return false
            }
            const spy = this._players.random()
            spy.playerData.job = "Spy"

            // Assign random jobs for players and set game location
            const nonSpyPlayerCount = this._players.size - 1;
            const randomJobs = location.jobs.randomKey(nonSpyPlayerCount)
            let jobIndex = 0;

            this._players.forEach(player => {
                if (player.playerData.job !== "Spy") {
                    player.playerData.job = randomJobs[jobIndex]
                    jobIndex++
                }
            })

            const latestRound = this._rounds.lastKey()!;
            this.setCurrentRound(latestRound + 1, location.name, this._players, spy.guildMember)

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
                    readyMessage.channel.send({ embeds: [gameLocationsEmbed(this.locations)], components: [showJobAndPrivateLocations] })
                }
            }

            else if (buttonInteraction.customId === "showJob") {
                if (this._currentRound === "Starting") return buttonInteraction.reply("Error: Round Status is \"Starting\"");
                const location = this._currentRound?.location;
                const job = this._players?.get(buttonInteraction.user.id)?.playerData.job

                if (!location) return buttonInteraction.reply("Error: Could not find location for current round");
                if (job === null) return buttonInteraction.reply("Error: User did not recieve a job")
                else if (job === undefined) return buttonInteraction.reply("Error: Could not find user in GamePlayers")

                if (job === "Spy") {
                    const selectMenu = spyLocationSelectMenu(this.locations);
                    buttonInteraction.reply({ content: `You are a **Spy**\nGuess the location correctly to win the game`, ephemeral: true, components: [selectMenu] })
                }
                else buttonInteraction.reply({ content: `We are currently at the **${location}**\nYou are a/an **${job}**`, ephemeral: true })
            }

            else if (buttonInteraction.customId === "showPrivateLocations") {
                const player = this._players?.get(buttonInteraction.user.id)
                const markedOutButtons = this.getPrivateMarkedOutLocations(buttonInteraction.user.id);

                if (!player) { buttonInteraction.reply("Error: Could not find player in GamePlayers"); return }
                if (!markedOutButtons) buttonInteraction.reply({ content: "Locations", components: gameLocations(this.locations), ephemeral: true })
                else buttonInteraction.reply({ content: "Locations", components: gameLocations(this.locations, markedOutButtons), ephemeral: true })

                player.playerData.privateLocationsButtonInteraction = buttonInteraction;
            }

            else if (buttonInteraction.customId.startsWith("location")) {
                const player = this._players?.get(buttonInteraction.user.id);
                if (!player) return buttonInteraction.reply("Error: Could not find player in GamePlayers");

                const privateLocationsButtonInteraction = player.playerData.privateLocationsButtonInteraction
                if (!privateLocationsButtonInteraction) return buttonInteraction.reply("Error: Private Locations Reply does not exist");

                const playerPrivateMarkedOutLocations = this.getPrivateMarkedOutLocations(buttonInteraction.user.id);

                if (!playerPrivateMarkedOutLocations) {
                    await buttonInteraction.reply("\u200b ");
                    buttonInteraction.deleteReply();
                    const newButtons = gameLocationsButtons(this.locations, [buttonInteraction.customId]);
                    this.setPrivateMarkedOutLocations(buttonInteraction.user.id, [buttonInteraction.customId]);

                    privateLocationsButtonInteraction.editReply({ components: newButtons });
                }
                else {
                    await buttonInteraction.reply("\u200b ");
                    buttonInteraction.deleteReply();
                    const markedOutLocationsCopy = playerPrivateMarkedOutLocations.slice();
                    const testArr = markedOutLocationsCopy.filter(ID => ID !== buttonInteraction.customId)

                    // markedOutLocationsCopy does not have the current buttonInteraction customId in it
                    if (testArr.length === markedOutLocationsCopy.length) {
                        markedOutLocationsCopy.push(buttonInteraction.customId)
                        const newButtons = gameLocationsButtons(this.locations, markedOutLocationsCopy)
                        privateLocationsButtonInteraction.editReply({ components: newButtons })
                        this.setPrivateMarkedOutLocations(buttonInteraction.user.id, markedOutLocationsCopy)
                    }
                    // current buttonInteraction's customId already exists in markedoutLocationsCopy
                    else {
                        const newButtons = gameLocationsButtons(this.locations, testArr) // Use testArr as the new marked out locations instead (unmarking the button from current buttonInteraction)
                        privateLocationsButtonInteraction.editReply({ components: newButtons })
                        this.setPrivateMarkedOutLocations(buttonInteraction.user.id, testArr)
                    }
                }
            }

            else if (buttonInteraction.customId.startsWith("confirmation")) {
                const player = this._players?.get(buttonInteraction.user.id);
                if (!player) return buttonInteraction.reply("Error: Unable to retrieve the spy's player information");

                const selectMenuInteractions = player.playerData.spySelectMenuInteractions
                if (!selectMenuInteractions) return buttonInteraction.reply("Error: The spy's spySelectMenuInteraction in playerData is undefined");

                const guess = buttonInteraction.customId.replace(/^(confirmation(No|Yes))(.+)/, "$3");
                const thisSelectMenuInteraction = selectMenuInteractions.find(interactions => interactions.guess === guess)
                if (!thisSelectMenuInteraction) return buttonInteraction.reply("Error: Could not find SelectMenuInteraction")

                if (buttonInteraction.customId.startsWith('confirmationNo')) {
                    thisSelectMenuInteraction.interaction.editReply({ content: "You may now dismiss this message ( bottom left )", components: [] })
                }
                else if (buttonInteraction.customId.startsWith('confirmationYes')) {
                    buttonCollector.stop()
                    selectMenuCollector.stop()

                    const nextRoundButtonFilter: CollectorFilter<[ButtonInteraction]> = (i): boolean => {
                        return i.isButton() && (i.customId === "startNewRound" || i.customId === "endGame")
                    }
                    const gameButtonCollector = buttonInteraction.channel!.createMessageComponentCollector({ filter: nextRoundButtonFilter, componentType: "BUTTON", max: 1 })
                    const gameTextChannel = this.gameTextChannel;
                    const inviteMessage = await this.inviteMessage.fetch();
                    const commands = buttonInteraction.guild!.commands.cache;

                    const beginCommand = commands.find(command => command.name == "begin");
                    if (!beginCommand) return buttonInteraction.reply("Error: Could not find the \"begin\" slash command")

                    gameButtonCollector.on("collect", (buttonInteraction) => {
                        SlashCommandEvent.emitter.emit("gameInteraction", buttonInteraction)

                        if (buttonInteraction.customId === "startNewRound") {
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
                        else if (buttonInteraction.customId === "endGame") {
                            const endCommand = commands.find(command => command.name === "end")
                            if (!endCommand) return buttonInteraction.reply("Error: Could not find the \"end\" slash command")

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

                    buttonInteraction.channel?.send(`The Spy guessed that the location was **"${guess}"**`) // TODO | Change this to an embed

                    const currentRound = this._currentRound
                    if (currentRound === "Starting") return buttonInteraction.channel?.send("Error: Current round status is \"Starting\"") as void
                    if (!currentRound) return buttonInteraction.channel?.send("Error: Current round property in Game class is null") as void

                    if (currentRound.location === guess) {
                        // Spy won the game

                        const round = this.setCurrentRound(currentRound.roundNumber, guess, currentRound.players, currentRound.spy, "Spy")
                        this.pushToRounds(round);
                        this._currentRound = null;

                        const embed = victoryEmbed("Spy", { location: guess, playerCount: currentRound.players.size, spy: currentRound.spy })
                        buttonInteraction.channel?.send({ embeds: [embed], components: [startNewRoundAndEndGameButton] })
                    }
                    else {
                        // Spy lost the game

                        const round = this.setCurrentRound(currentRound.roundNumber, currentRound.location, currentRound.players, currentRound.spy, "The Innocents")
                        this.pushToRounds(round);
                        this._currentRound = null;

                        const embed = victoryEmbed("The Innocents", { location: currentRound.location, playerCount: currentRound.players.size, spy: currentRound.spy })
                        buttonInteraction.channel?.send({ embeds: [embed], components: [startNewRoundAndEndGameButton] })
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

                    const oldEmbed = inviteMessage.embeds[0];
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
            } else { console.log(buttonInteraction.customId, "custom Button ID") }
        })

        selectMenuCollector.on("collect", async (selectMenuInteraction) => {
            const player = this._players?.get(selectMenuInteraction.user.id);
            if (!player) return selectMenuInteraction.reply("Error: Unable to retrieve the spy's player information");

            let selectMenuInteractions = player.playerData.spySelectMenuInteractions;
            if (!selectMenuInteractions) player.playerData.spySelectMenuInteractions = [];

            const locationSelected = selectMenuInteraction.values[0];
            const yesAndNoButtons = spyLocationConfirmation(locationSelected)

            player.playerData.spySelectMenuInteractions!.push({ interaction: selectMenuInteraction, guess: locationSelected });

            selectMenuInteraction.reply({ ephemeral: true, content: `Are you sure the location is **${locationSelected}**?\nYou have only **1** chance!`, components: [yesAndNoButtons] })
        })
    }
}

export default Game
export { GameLocations, GameLocationInterface }