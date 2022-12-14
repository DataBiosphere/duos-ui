// TODO: Delete this class
// Deprecated
export class SpinnerService {

  constructor() {
    this.spinnerCache = new Set();
  }

  _register(spinner) {
    this.spinnerCache.add(spinner);
  }

  show(spinnerName) {
    this.spinnerCache.forEach(spinner => {
      if (spinner.name === spinnerName) {
        spinner.show = true;
      }
    });
  }

  showAll() {
    this.spinnerCache.forEach(spinner => spinner.show = true);
  }

  hideAll() {
    this.spinnerCache.forEach(spinner => spinner.show = false);
  }

}

const spinnerService = new SpinnerService();
export { spinnerService };
