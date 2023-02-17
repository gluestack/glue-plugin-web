import IApp from '@gluestack/framework/types/app/interface/IApp';
import IInstance from '@gluestack/framework/types/plugin/interface/IInstance';
import IContainerController from '@gluestack/framework/types/plugin/interface/IContainerController';
export declare class PluginInstanceContainerController implements IContainerController {
    app: IApp;
    status: 'up' | 'down';
    portNumber: number;
    containerId: string;
    dockerfile: string;
    callerInstance: IInstance;
    constructor(app: IApp, callerInstance: IInstance);
    getCallerInstance(): IInstance;
    getEnv(): Promise<{}>;
    installScript(): string[];
    runScript(): Promise<string[]>;
    buildScript(): string[];
    getDockerJson(): Promise<{
        Image: string;
        HostConfig: {
            PortBindings: {
                "9000/tcp": {
                    HostPort: string;
                }[];
            };
            Binds: string[];
        };
        ExposedPorts: {
            "9000/tcp": {};
        };
        Cmd: string[];
        WorkingDir: string;
    }>;
    getStatus(): 'up' | 'down';
    getPortNumber(returnDefault?: boolean): Promise<unknown>;
    getContainerId(): string;
    setStatus(status: 'up' | 'down'): "up" | "down";
    setPortNumber(portNumber: number): number;
    setContainerId(containerId: string): string;
    setDockerfile(dockerfile: string): string;
    getConfig(): any;
    up(): Promise<void>;
    down(): Promise<void>;
    build(): Promise<void>;
}
