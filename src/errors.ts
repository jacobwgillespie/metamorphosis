import {CustomError} from './CustomError'

export class TimeoutError extends CustomError {
  constructor() {
    super()
    this.message = 'Stream timeout'
  }
}
