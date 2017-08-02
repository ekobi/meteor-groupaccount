import { gsiView } from './view-bootstrap.js';
import { gsiModel } from './model.js';
import { gsiIntent } from './intent.js';
import { gsiDriver } from './driver.js';

GSI = {
  driver: gsiDriver,
  main: (sources) => {
    return gsiView(gsiModel(gsiIntent(sources)));
  }
};
