//@ts-ignore
import packageJSON from '../package.json';
import { PluginInstance } from './PluginInstance';
import IApp from '@gluestack/framework/types/app/interface/IApp';
import IPlugin from '@gluestack/framework/types/plugin/interface/IPlugin';
import IInstance from '@gluestack/framework/types/plugin/interface/IInstance';
import ILifeCycle from '@gluestack/framework/types/plugin/interface/ILifeCycle';
import IManagesInstances from '@gluestack/framework/types/plugin/interface/IManagesInstances';
import IGlueStorePlugin from '@gluestack/framework/types/store/interface/IGluePluginStore';
import { selectTemplate } from './helpers/selectTemplate';
//Do not edit the name of this class
export class GlueStackPlugin implements IPlugin, IManagesInstances, ILifeCycle {
  app: IApp;
  instances: IInstance[];
  type: 'stateless' | 'stateful' | 'devonly' = 'stateless';
  gluePluginStore: IGlueStorePlugin;
  selectedTemplateFolderPath: string;
  constructor(app: IApp, gluePluginStore: IGlueStorePlugin) {
    this.app = app;
    this.instances = [];
    this.gluePluginStore = gluePluginStore;
  }

  init() {
    //
  }

  destroy() {
    //
  }

  getName(): string {
    return packageJSON.name;
  }

  getVersion(): string {
    return packageJSON.version;
  }

  getType(): 'stateless' | 'stateful' | 'devonly' {
    return this.type;
  }

  // @ts-ignore
  getTemplateFolderPath(): string {
    return `${process.cwd()}/node_modules/${this.getName()}/${
      this.selectedTemplateFolderPath
    }`;
    // return `${process.cwd()}/node_modules/${this.getName()}/${templateFolder}`;
  }

  getInstallationPath(target: string): string {
    return `./${target}`;
  }

  async runPostInstall(instanceName: string, target: string) {
    const templateFolder = await selectTemplate();
    console.log(templateFolder);
    this.selectedTemplateFolderPath = templateFolder;
    await this.app.createPluginInstance(
      this,
      instanceName,
      this.getTemplateFolderPath(),
      target
    );
  }

  createInstance(
    key: string,
    gluePluginStore: IGlueStorePlugin,
    installationPath: string
  ): IInstance {
    const instance = new PluginInstance(
      this.app,
      this,
      key,
      gluePluginStore,
      installationPath
    );
    this.instances.push(instance);
    return instance;
  }

  getInstances(): IInstance[] {
    return this.instances;
  }
}
