import {Client, Collection, Guild, IntentsBitField, REST} from "discord.js";
import {Routes} from 'discord-api-types/rest/v10';
import {readdir} from "fs/promises";
import path from "path";
import {fileURLToPath} from "url";
import ChatCommand from "../command/index.js";
import config from "../config/bot.json" with {type: "json"};
import DiscordEvent from "../event/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CommandPath = path.join(__dirname, '..', 'command');
const EventPath = path.join(__dirname, '..', 'event');

export class CLIENT extends Client {
    readonly commands: Collection<string, ChatCommand> = new Collection();
    public guild: Guild | undefined;

    private constructor() {
        super({
            intents: [
                IntentsBitField.Flags.Guilds,
                IntentsBitField.Flags.GuildMessages,
                IntentsBitField.Flags.MessageContent,
                IntentsBitField.Flags.GuildMembers
            ]
        });
    }

    static async create(): Promise<CLIENT> {
        const client = new CLIENT();
        await client.initialize();
        return client;
    }

    async start() {
        await this.login(config.token);
        // this.guild = this.guilds.cache.get(config.guildId) ?? await this.guilds.fetch(config.guildId);
    }

    async stop() {
        await this.destroy();
    }

    private async initialize() {
        await this.initCommands();
        await this.registerCommands();
        await this.initEvents();
    }

    private async initCommands(root: string = "") {
        const commandFiles: string[] = [];
        for (const dir of await readdir(path.join(CommandPath, root), {withFileTypes: true})) {
            const name = dir.name;
            if (dir.isFile()) {
                if (name === "index.ts" || name === "index.js") {
                    continue;
                }

                if (name.endsWith(".ts") || name.endsWith(".js")) {
                    commandFiles.push(name);
                }
            } else if (dir.isDirectory()) {
                await this.initCommands(path.join(root, name));
            }
        }

        for (const file of commandFiles) {
            try {
                const filePath = path.join(CommandPath, root, file);
                const module = await import(new URL(`file://${filePath}`).href);

                const command = new module.default() as ChatCommand;
                this.commands.set(command.data.name, command);
            } catch (error) {
                console.error(`[Command Loader] Error loading ${file}:`, error);
                console.log(`올바르지 않은 파일 ${file}은 무시되었습니다. 해당 위치는 ChatCommand 타입만 가능합니다!`);
            }
        }
    }

    private async registerCommands() {
        try {
            const commandDatas = this.commands.map(command => command.data.toJSON());
            const rest = new REST({version: '10'}).setToken(config.token);

            await rest.put(
                config.guildId === ""
                    ? Routes.applicationCommands(config.clientId)
                    : Routes.applicationGuildCommands(config.clientId, config.guildId),
                {body: commandDatas}
            );

            console.log(`총 ${commandDatas.length}개의 명령어를 등록했습니다.`);
        } catch (error) {
            console.error('[Command Registration Error]:', error);
        }
    }

    private async initEvents(root: string = "") {
        const eventFiles: string[] = [];
        for (const dir of await readdir(path.join(EventPath, root), {withFileTypes: true})) {
            const name = dir.name
            if (dir.isFile()) {
                if (name === "index.ts" || name === "index.js") {
                    continue
                }

                if (name.endsWith(".ts") || name.endsWith(".js")) {
                    eventFiles.push(name);
                }
            } else if (dir.isDirectory()) {
                this.initEvents(path.join(root, name));
            }
        }

        for (const file of eventFiles) {
            try {
                const filePath = path.join(EventPath, root, file);
                const module = await import(new URL(`file://${filePath}`).href);

                const event = new module.default() as DiscordEvent;
                const executor = (...args: any[]) => {
                    try {
                        event.execute(...args);
                    } catch (error) {
                        console.error(`[Event Execution Error] ${event.name}:`, error);
                    }
                };

                event.once
                    ? this.once(event.name, executor)
                    : this.on(event.name, executor);
            } catch (error) {
                console.error(`[Event Loader] Error loading ${file}:`, error);
                console.log(`올바르지 않은 파일 ${file}은 무시되었습니다. 해당 위치는 Event 타입만 가능합니다!`);
            }
        }
    }
}
