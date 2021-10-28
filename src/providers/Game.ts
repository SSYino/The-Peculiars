import { Collection, Snowflake, GuildMember, Guild } from "discord.js"
import fs from "fs";

type GamePlayers = Collection<Snowflake, GuildMember>
type GameLocations = Map<string, GameLocationInterface>

interface GameLocationInterface {
    readonly name: string
    readonly jobs: Map<string, { name: string, imagePath: string }>
    readonly imagePath: string
}

interface GameOptionsLocationInterface {
    [propName: string]: {
        jobs: string[]
        imagePath: string
    }
}

class Game {
    public readonly locations: GameLocations
    private players: GamePlayers | null
    public readonly guild: Guild

    private static instances: Game[] = []

    constructor(guild: Guild) {
        this.players = null;
        this.guild = guild;
        const startingLocations = JSON.parse(`${fs.readFileSync(`${process.cwd()}/gameOptions.json`)}`).locations as GameOptionsLocationInterface
        const locationMap = new Map()
        for (const name of Object.keys(startingLocations)) {
            const locationData = startingLocations[name]
            locationMap.set(name, locationData)
        }
        this.locations = locationMap
        Game.instances.push(this)
    }

    public addPlayer(player: GuildMember): GamePlayers | undefined {
        if (!this.players) {
            return this.players = new Collection<Snowflake, GuildMember>([[player.id, player]]);
        }
        else {
            return this.players.set(player.id, player)
        }
    }
    
    public getPlayers(): GamePlayers | null {
        return this.players;
    }

    public static get(guildId: string): Game | undefined {
        return this.instances.find(game => game.guild.id === guildId);
    }

    public static clearInstance(guildId?: string): Game | Game[] | undefined {
        if (!guildId) {
            const instances = this.instances;
            this.instances = [];
            return instances
        }
        return this.instances.find((game, index) => {
            if (game.guild.id === guildId) {
                this.instances.splice(index, 1)
                return true
            }
        })
    }

    public static getInstances(): Game[] {
        return this.instances;
    }
}

export default Game
