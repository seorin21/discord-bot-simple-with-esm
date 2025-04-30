### 타입스크립트로 작성된 디스코드봇 예문!

[@seorin21/discord-bot-simple](https://github.com/seorin21/discord-bot-simple)에서 파생된, commonjs -> module로 변경된 EMS
discord.js 예제입니다.

## 0. npm 모듈 설치

`npm i --save`를 하여, 의존성 모듈을 전부 다운받습니다.

## 1. 설정 파일 변경

`src/config/bot.json`의 설정 파일을 자신에게 맞도록 변경합니다

```json
{
    "token": "",
    // 디스코드 봇 토큰
    "guildId": "",
    // 디스코드 서버 아이디 (입력하지 않으면, 슬래시 명령어가 공동으로 등록됩니다)
    "clientId": ""
    // 디스코드 봇 아이디
}
```

## 2. 봇 실행

`npm run dev`를 하여, 봇을 실행합니다.

<hr>

## + 명령어, 이벤트 추가 방법

### 명령어 추가

`'command/{category}/{commandName}.ts'`를 생성하고 `ChatCommand`를 상속 받는 클래스를 만듭니다.

```typescript
import ChatCommand from "../index.js";
import {ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";

export default class Ping extends ChatCommand {
    data = new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Ping Pong!"); // 멍청했다 .toJson 하고 안 된다고 생각하고 있었어 ㅋㅋ
    isDeferReply = false
    isEphemeral = false // 만일 isReferReply 가 true 라면, isPublic 이 그제서야 영향 받는다. 현상태는 아무 의미가 없다!

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        if (this.isDeferReply) {
            await interaction.editReply("Pong!"); // 타임아웃 오류 잠재적 발생 블럭. 무조건 답장은 editReply로
        } else {
            await interaction.reply("Pong!"); // 타임아웃 오류가 절대 안 나는 명령어라면 reply. CommandExecutor 에서 deferReply 안 함!
        }
    }
}
```

### 이벤트 추가

`'event/{eventName}.ts'`를 생성하고 `Event`를 상속 받는 클래스를 만듭니다.

```typescript
import {Client, Events} from "discord.js";
import DiscordEvent from "./index.js";

export default class Ready extends DiscordEvent {
    name = Events.ClientReady.toString();
    once = true;

    async execute(client: Client): Promise<void> {
        console.log(`Ready! Logged in as ${client.user?.tag}`);
    }
}
```

<br>

### 클라이언트 불어오기

`'index.ts'`를 살펴보면 알 수 있습니다.

```typescript
import loader from "./client/loader.js";

loader.client.start().then(() => console.log("Clear?"))

// loader.client는 CLIENT(:client/index)입니다.
```