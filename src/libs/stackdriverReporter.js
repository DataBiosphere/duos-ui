import { Storage } from './storage';
import StackdriverErrorReporter from 'stackdriver-errors-js';
import { Config } from './config';
import * as ld from 'lodash';

const errorHandler = new StackdriverErrorReporter();

export const StackdriverReporter = {

  generateErrorConfig: async () => {
    const errorApiKey = await Config.getErrorApiKey();
    const project = await Config.getProject();
    const user = Storage.getCurrentUser();
    const hash = await Config.getHash();
    const tag = await Config.getTag();
    const env = await Config.getEnv();
    const version = tag
      .replace('production_', '')
      .replace('staging_', '')
      .concat('_').concat(hash)
      .concat('_').concat(env);
    return {
      key: errorApiKey,
      projectId: project,
      service: 'DUOS',
      version: version,
      reportUncaughtExceptions: false,
      reportUnhandledPromiseRejections: false,
      context: {user: ld.get(user, 'email', 'anonymous')},
    };
  },

  start: async () => {
    await StackdriverReporter.generateErrorConfig()
      .then(config => errorHandler.start(config));
  },

  report: async (msg) => {
    const user = Storage.getCurrentUser();
    errorHandler.setUser(ld.get(user, 'email', 'anonymous'));
    errorHandler.report(msg);
  },

};