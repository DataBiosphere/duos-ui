// TODO: Delete this class
// Deprecated
interface Spinner {
  name: string
  show: boolean
}

export class SpinnerService {
  private spinnerCache: Set<Spinner>

  constructor() {
    this.spinnerCache = new Set()
  }

  _register(spinner: Spinner): void {
    this.spinnerCache.add(spinner)
  }

  show(spinnerName: string): void {
    this.spinnerCache.forEach((spinner) => {
      if (spinner.name === spinnerName) {
        spinner.show = true
      }
    })
  }

  showAll(): void {
    this.spinnerCache.forEach((spinner) => (spinner.show = true))
  }

  hideAll(): void {
    this.spinnerCache.forEach((spinner) => (spinner.show = false))
  }
}

const spinnerService = new SpinnerService()
export { spinnerService }
