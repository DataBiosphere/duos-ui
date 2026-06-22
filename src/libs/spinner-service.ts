interface Spinner {
  name: string
  show: boolean
}

export class SpinnerService {
  private readonly spinnerCache: Set<Spinner>

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
}

const spinnerService = new SpinnerService()
export { spinnerService }
