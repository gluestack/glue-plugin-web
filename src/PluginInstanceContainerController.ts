
const { SpawnHelper, DockerodeHelper } = require('@gluestack/helpers');
const os = require('os');

import { join } from 'path';
import IApp from '@gluestack/framework/types/app/interface/IApp';
import IInstance from '@gluestack/framework/types/plugin/interface/IInstance';
import IContainerController from '@gluestack/framework/types/plugin/interface/IContainerController';

export class PluginInstanceContainerController implements IContainerController {
  app: IApp;
  status: 'up' | 'down' = 'down';
  portNumber: number;
  containerId: string;
  dockerfile: string;
  callerInstance: IInstance;

  constructor(app: IApp, callerInstance: IInstance) {
    this.app = app;
    this.callerInstance = callerInstance;
    this.setStatus(this.callerInstance.gluePluginStore.get('status'));
    this.setPortNumber(this.callerInstance.gluePluginStore.get('port_number'));
    this.setContainerId(
      this.callerInstance.gluePluginStore.get('container_id')
    );
  }

  getCallerInstance(): IInstance {
    return this.callerInstance;
  }

  async getEnv() {
    return {};
  }

  installScript() {
    return ['npm', 'install', '--save', '--legacy-peer-deps'];
  }

  async runScript() {
    return ['npm', 'run', 'dev', '--', '-p', '9000'];
  }

  buildScript() {
    return ["npm", "run", "build"];
  }

  async getDockerJson() {
    const installCmd = this.installScript();
    const runCmd = await this.runScript();
    const Cmd = installCmd.join(' ') + ' && ' + runCmd.join(' ');

    const Binds = [
      `${process.cwd()}:/gluestack`,
    ];

    const json_data = {
      Image: "node:lts",
      HostConfig: {
        PortBindings: {
          "9000/tcp": [
            {
              HostPort: (await this.getPortNumber()).toString(),
            },
          ]
        },
        Binds: Binds
      },
      ExposedPorts: {
        "9000/tcp": {}
      },
      Cmd: [
        "sh",
        "-c",
        Cmd
      ],
      WorkingDir: join('/gluestack', this.callerInstance.getInstallationPath())
    };

    if (os.platform() === 'win32') {
      //@ts-ignore
      json_data.WorkingDir = json_data.WorkingDir.replaceAll('\\', '/');
    }
    return json_data;
  }

  getStatus(): 'up' | 'down' {
    return this.status;
  }

  // @ts-ignore
  async getPortNumber(returnDefault?: boolean) {
    return new Promise((resolve, reject) => {
      if (this.portNumber) {
        return resolve(this.portNumber);
      }
      let ports =
        this.callerInstance.callerPlugin.gluePluginStore.get("ports") || [];
      DockerodeHelper.getPort(3100, ports)
        .then((port: number) => {
          this.setPortNumber(port);
          ports.push(port);
          this.callerInstance.callerPlugin.gluePluginStore.set("ports", ports);
          return resolve(this.portNumber);
        })
        .catch((e: any) => {
          reject(e);
        });
    });
  }

  getContainerId(): string {
    return this.containerId;
  }

  setStatus(status: 'up' | 'down') {
    this.callerInstance.gluePluginStore.set('status', status || 'down');
    return (this.status = status || 'down');
  }

  setPortNumber(portNumber: number) {
    this.callerInstance.gluePluginStore.set('port_number', portNumber || null);
    return (this.portNumber = portNumber || null);
  }

  setContainerId(containerId: string) {
    this.callerInstance.gluePluginStore.set(
      'container_id',
      containerId || null
    );
    return (this.containerId = containerId || null);
  }

  setDockerfile(dockerfile: string) {
    this.callerInstance.gluePluginStore.set('dockerfile', dockerfile || null);
    return (this.dockerfile = dockerfile || null);
  }

  getConfig(): any { }

  async up() {
    await new Promise(async (resolve, reject) => {
      DockerodeHelper.up(
        await this.getDockerJson(),
        await this.getEnv(),
        await this.getPortNumber(),
        this.callerInstance.getName(),
      )
        .then(
          async ({
            status,
            containerId,
          }: {
            status: "up" | "down";
            containerId: string;
          }) => {
            this.setStatus(status);
            this.setContainerId(containerId);

            console.log("\x1b[32m");
            console.log(`API: http://localhost:${await this.getPortNumber()}`);
            console.log("\x1b[0m", "\x1b[36m");
            console.log("\x1b[0m");

            return resolve(true);
          },
        )
        .catch((e: any) => {
          console.log(">> catch:", e);
          return reject(e);
        })
        .catch((e: any) => {
          console.log(">> catch 2:", e);
          return reject(e);
        });
    });
  }

  async down() {
    await new Promise(async (resolve, reject) => {
      DockerodeHelper.down(this.getContainerId(), this.callerInstance.getName())
        .then(() => {
          this.setStatus("down");
          this.setContainerId(null);
          return resolve(true);
        })
        .catch((e: any) => {
          return reject(e);
        });
    });
  }

  async build() {
    await SpawnHelper.run(this.callerInstance.getInstallationPath(), this.installScript());
    await SpawnHelper.run(this.callerInstance.getInstallationPath(), this.buildScript());
  }
}
