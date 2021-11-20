import fs from "fs"

interface GameOptionsInterface {
    locations: {
        [locationName: string]: {
            jobs: string[]
            imageRelativePath: string
        }
    }
}

const isFormattedCorrectly = (object: any): object is GameOptionsInterface => {
    try {
        const locationsPropCheck = "locations" in object;
        
        const locationObjCheck = Object.values(object.locations).every(location => {
            const condition1 = typeof location === "object";
            const condition2 = (location as any).jobs.constructor.name === "Array";
            const condition3 = (location as any).jobs.length > 0;
            const condition4 = typeof ((location as any).imageRelativePath) === "string"

            return condition1 && condition2 && condition3 && condition4
        })

        return locationsPropCheck && locationObjCheck
    }
    catch { return false }
}

export default () => {
    const gameOptionsJSON = JSON.parse(fs.readFileSync(process.cwd() + "/gameOptions.json") as unknown as string);

    if (!isFormattedCorrectly(gameOptionsJSON)) throw new Error("gameOptions.json is not formatted correctly")
}