const { SpawnHelper, DockerodeHelper } = require('@gluestack/helpers');
import IApp from '@gluestack/framework/types/app/interface/IApp';
import IInstance from '@gluestack/framework/types/plugin/interface/IInstance';
import IContainerController from '@gluestack/framework/types/plugin/interface/IContainerController';
import { generateDockerfile } from './create-dockerfile';

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

  getEnv() { }

  installScript() {
    return ['npm', 'install', '--save', '--legacy-peer-deps'];
  }

  async runScript() {
    return ['npm', 'run', 'dev', '--', '-p', await this.getPortNumber()];
  }

  buildScript() {
    return ["npm", "run", "build"];
  }

  getDockerJson() {
    return {};
  }

  getStatus(): 'up' | 'down' {
    return this.status;
  }
  
  //@ts-ignore
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
    if (this.getStatus() !== 'up') {
      await new Promise(async (resolve, reject) => {
        console.log('\x1b[33m');
        console.log(
          `${this.callerInstance.getName()}: Running ${this.installScript().join(
            ' '
          )}`
        );
        SpawnHelper.run(
          this.callerInstance.getInstallationPath(),
          this.installScript()
        )
          .then(async () => {
            console.log(
              `${this.callerInstance.getName()}: Running ${(await this.runScript()).join(
                ' '
              )}`
            );
            console.log('\x1b[0m');
            SpawnHelper.start(
              this.callerInstance.getInstallationPath(),
              (await this.runScript())
            )
              .then(async ({ processId }: { processId: string }) => {
                this.setStatus('up');
                this.setContainerId(processId);
                console.log('\x1b[32m');
                console.log(
                  `Open http://localhost:${await this.getPortNumber()}/ in browser`
                );
                console.log('\x1b[0m');
                return resolve(true);
              })
              .catch((e: any) => {
                return reject(e);
              });
          })
          .catch((e: any) => {
            return reject(e);
          });
      })
    }
  }

  async down() {
    if (this.getStatus() !== 'down') {
      await new Promise(async (resolve, reject) => {
        SpawnHelper.stop(this.getContainerId())
          .then(() => {
            this.setStatus('down');
            this.setContainerId(null);
            return resolve(true);
          })
          .catch((e: any) => {
            return reject(e);
          });
      });
    }
  }

  async build() {
    await generateDockerfile(this.callerInstance.getInstallationPath());
    await SpawnHelper.run(this.callerInstance.getInstallationPath(), this.installScript());
    await SpawnHelper.run(this.callerInstance.getInstallationPath(), this.buildScript());
  }
}
