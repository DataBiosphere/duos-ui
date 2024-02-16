import { Storage } from './storage';
import StackdriverErrorReporter from 'stackdriver-errors-js';
import { Config } from './config';
import * as ld from 'lodash';
import { isNil } from 'lodash/fp';

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
    const config = await StackdriverReporter.generateErrorConfig();
    if (!isNil(config) && !isNil(config.key)) {
      errorHandler.start(config);
    }
  },

  report: async (msg) => {
    const user = Storage.getCurrentUser();
    const formattedMsg = await StackdriverReporter.format(msg);
    errorHandler.setUser(ld.get(user, 'email', 'anonymous'));
    errorHandler.report(formattedMsg ? formattedMsg : 'There was an error in reporting this message.');
  },

  format: async (msg) => {
    const env = await Config.getEnv();
    return '['.concat(env)
      .concat('] ')
      .concat(msg)
      .concat(' ');
  }

};
