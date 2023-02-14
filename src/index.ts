// @ts-ignore
import packageJSON from '../package.json';
import { PluginInstance } from './PluginInstance';
import IApp from '@gluestack/framework/types/app/interface/IApp';
import IPlugin from '@gluestack/framework/types/plugin/interface/IPlugin';
import IInstance from '@gluestack/framework/types/plugin/interface/IInstance';
import ILifeCycle from '@gluestack/framework/types/plugin/interface/ILifeCycle';
import IManagesInstances from '@gluestack/framework/types/plugin/interface/IManagesInstances';
import IGlueStorePlugin from '@gluestack/framework/types/store/interface/IGluePluginStore';

import { reWriteFile } from './helpers/rewrite-file';
import { selectTemplate } from './helpers/select-template';
import { updateWorkspaces } from './helpers/update-workspaces';

// Do not edit the name of this class
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
  }

  getInstallationPath(target: string): string {
    return `./${target}`;
  }

  async runPostInstall(instanceName: string, target: string) {
    const templateFolder = await selectTemplate();
    this.selectedTemplateFolderPath = templateFolder;

    const instance: PluginInstance =
      await this.app.createPluginInstance(
        this,
        instanceName,
        this.getTemplateFolderPath(),
        target
      );

    if (!instance) {
      return;
    }

    // rewrite router.js with the installed instance name
    const routerFile = `${instance.getInstallationPath()}/router.js`;
    await reWriteFile(routerFile, instanceName, 'INSTANCENAME');

    // update package.json'S name index with the new instance name
    const pluginPackage = `${instance.getInstallationPath()}/package.json`;
    await reWriteFile(pluginPackage, instanceName, 'INSTANCENAME');

    // update root package.json's workspaces with the new instance name
    const rootPackage = `${process.cwd()}/package.json`;
    await updateWorkspaces(rootPackage, instance.getInstallationPath());
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
