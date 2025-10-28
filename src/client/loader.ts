import {CLIENT} from "./index.js";

class ClientLoader {
    private static instance: ClientLoader | null = null;

    private constructor() {
    }

    private _client: CLIENT | null = null;

    public get client(): CLIENT {
        return this._client!!;
    }

    public static async create(): Promise<ClientLoader> {
        const loader = new ClientLoader();
        loader._client = await CLIENT.create();
        return loader;
    }

    public static async getInstance(): Promise<ClientLoader> {
        if (!ClientLoader.instance) {
            ClientLoader.instance = await ClientLoader.create();
        }

        return ClientLoader.instance;
    }
}

export default await ClientLoader.getInstance();
