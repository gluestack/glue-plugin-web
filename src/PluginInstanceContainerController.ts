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

  getEnv() {
    let db_config = {
      db_name: "default",
      username: "postgres",
      password: "goldtree9",
    };

    if (
      !this.callerInstance.gluePluginStore.get("db_config") ||
      !this.callerInstance.gluePluginStore.get("db_config").db_name
    )
      this.callerInstance.gluePluginStore.set("db_config", db_config);

    db_config = this.callerInstance.gluePluginStore.get("db_config");

    return {
      POSTGRES_USER: db_config.username,
      POSTGRES_PASSWORD: db_config.password,
      POSTGRES_DB: db_config.db_name,
    };
  }

  getScript() {
    let script = "npm run dev";
    return script;
  }

  getDockerJson() {
    return {
      Image: "postgres:12",
      WorkingDir: "/app",
      HostConfig: {
        PortBindings: {
          "5432/tcp": [
            {
              HostPort: this.getPortNumber(true).toString(),
            },
          ],
        },
      },
      ExposedPorts: {
        "5432/tcp": {},
      },
    };
  }

  getStatus(): "up" | "down" {
    return this.status;
  }

  getPortNumber(returnDefault?: boolean): number {
    if (this.portNumber) {
      return this.portNumber;
    }
    if (returnDefault) {
      return 5432;
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
    let ports =
      this.callerInstance.callerPlugin.gluePluginStore.get("ports") || [];

    await new Promise(async (resolve, reject) => {
      DockerodeHelper.getPort(this.getPortNumber(true), ports)
        .then((port: number) => {
          this.portNumber = port;
          NodemonHelper.up(
            this.callerInstance.getInstallationPath(),
            this.getScript(),
            this.portNumber,
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
                dockerfile: string;
              }) => {
                this.setStatus(status);
                this.setPortNumber(portNumber);
                this.setContainerId(processId);
                ports.push(portNumber);
                this.callerInstance.callerPlugin.gluePluginStore.set(
                  "ports",
                  ports,
                );
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

  async down() {
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
          this.callerInstance.callerPlugin.gluePluginStore.set("ports", ports);

          this.setPortNumber(null);
          this.setContainerId(null);
          return resolve(true);
        })
        .catch((e: any) => {
          return reject(e);
        });
    });
  }

  async build() {}
}
