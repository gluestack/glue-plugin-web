const { NodemonHelper, DockerodeHelper } = require("@gluestack/helpers");
import IApp from "@gluestack/framework/types/app/interface/IApp";
import IInstance from "@gluestack/framework/types/plugin/interface/IInstance";
import IContainerController from "@gluestack/framework/types/plugin/interface/IContainerController";

export class PluginInstanceContainerController implements IContainerController {
  app: IApp;
  status: "up" | "down" = "down";
  portNumber: number;
  containerId: string;
  dockerfile: string;
  callerInstance: IInstance;

  constructor(app: IApp, callerInstance: IInstance) {
    this.app = app;
    this.callerInstance = callerInstance;
    this.setStatus(this.callerInstance.gluePluginStore.get("status"));
    this.setPortNumber(this.callerInstance.gluePluginStore.get("port_number"));
    this.setContainerId(
      this.callerInstance.gluePluginStore.get("container_id"),
    );
  }

  getCallerInstance(): IInstance {
    return this.callerInstance;
  }

  getEnv() {}

  getCommanderArray() {
    return ["npm", "run", "dev", "--", "-p", this.getPortNumber()];
  }

  getDockerJson() {
    return {};
  }

  getStatus(): "up" | "down" {
    return this.status;
  }

  getPortNumber(returnDefault?: boolean): number {
    if (this.portNumber) {
      return this.portNumber;
    }
    if (returnDefault) {
      return 3100;
    }
  }

  getContainerId(): string {
    return this.containerId;
  }

  setStatus(status: "up" | "down") {
    this.callerInstance.gluePluginStore.set("status", status || "down");
    return (this.status = status || "down");
  }

  setPortNumber(portNumber: number) {
    this.callerInstance.gluePluginStore.set("port_number", portNumber || null);
    return (this.portNumber = portNumber || null);
  }

  setContainerId(containerId: string) {
    this.callerInstance.gluePluginStore.set(
      "container_id",
      containerId || null,
    );
    return (this.containerId = containerId || null);
  }

  setDockerfile(dockerfile: string) {
    this.callerInstance.gluePluginStore.set("dockerfile", dockerfile || null);
    return (this.dockerfile = dockerfile || null);
  }

  getConfig(): any {}

  async up() {
    if (this.getStatus() != "up") {
      let ports =
        this.callerInstance.callerPlugin.gluePluginStore.get("ports") || [];

      await new Promise(async (resolve, reject) => {
        DockerodeHelper.getPort(this.getPortNumber(true), ports)

          .then((port: number) => {
            this.portNumber = port;
            NodemonHelper.up(
              this.callerInstance.getInstallationPath(),
              this.portNumber,
              this.getCommanderArray(),
            )
              .then(
                ({
                  status,
                  portNumber,
                  processId,
                }: {
                  status: "up" | "down";
                  portNumber: number;
                  processId: string;
                }) => {
                  this.setStatus(status);
                  this.setPortNumber(portNumber);
                  this.setContainerId(processId);
                  ports.push(portNumber);
                  this.callerInstance.callerPlugin.gluePluginStore.set(
                    "ports",
                    ports,
                  );
                  console.log("\x1b[32m");
                  console.log(
                    `Open http://localhost:${this.getPortNumber()}/ in browser`,
                  );
                  console.log("\x1b[0m");
                  return resolve(true);
                },
              )
              .catch((e: any) => {
                return reject(e);
              });
          })
          .catch((e: any) => {
            return reject(e);
          });
      });
    }
  }

  async down() {
    if (this.getStatus() == "up") {
      let ports =
        this.callerInstance.callerPlugin.gluePluginStore.get("ports") || [];
      await new Promise(async (resolve, reject) => {
        NodemonHelper.down(this.getContainerId(), this.callerInstance.getName())
          .then(() => {
            this.setStatus("down");
            var index = ports.indexOf(this.getPortNumber());
            if (index !== -1) {
              ports.splice(index, 1);
            }
            this.callerInstance.callerPlugin.gluePluginStore.set(
              "ports",
              ports,
            );

            this.setPortNumber(null);
            this.setContainerId(null);
            return resolve(true);
          })
          .catch((e: any) => {
            return reject(e);
          });
      });
    }
  }

  async build() {}
}
