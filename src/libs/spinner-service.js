export class SpinnerService {

  constructor() {
    this.spinnerCache = new Set();
  }

  _register(spinner) {
    this.spinnerCache.add(spinner);
  }

  _unregister(spinnerToRemove) {
    this.spinnerCache.forEach(spinner => {
      if (spinner === spinnerToRemove) {
        this.spinnerCache.delete(spinner);
      }
    });
  }

  _unregisterGroup(spinnerGroup) {
    this.spinnerCache.forEach(spinner => {
      if (spinner.group === spinnerGroup) {
        this.spinnerCache.delete(spinner);
      }
    });
  }

  _unregisterAll() {
    this.spinnerCache.clear();
  }

  show(spinnerName) {
    this.spinnerCache.forEach(spinner => {
      if (spinner.name === spinnerName) {
        spinner.show = true;
      }
    });
  }

  hide(spinnerName) {
    this.spinnerCache.forEach(spinner => {
      if (spinner.name === spinnerName) {
        spinner.show = false;
      }
    });
  }

  showGroup(spinnerGroup) {
    this.spinnerCache.forEach(spinner => {
      if (spinner.group === spinnerGroup) {
        spinner.show = true;
      }
    });
  }

  hideGroup(spinnerGroup) {
    this.spinnerCache.forEach(spinner => {
      if (spinner.group === spinnerGroup) {
        spinner.show = false;
      }
    });
  }

  showAll() {
    this.spinnerCache.forEach(spinner => spinner.show = true);
  }

  hideAll() {
    this.spinnerCache.forEach(spinner => spinner.show = false);
  }

  isShowing(spinnerName) {
    let showing;
    this.spinnerCache.forEach(spinner => {
      if (spinner.name === spinnerName) {
        showing = spinner.show;
      }
    });
    return showing;
  }
}

const spinnerService = new SpinnerService();
export { spinnerService }
