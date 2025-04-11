import readline from 'readline'

export default class rl {
  #rlIns: readline.Interface

  constructor() {
    this.#rlIns = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
  }

  close() {
    this.#rlIns.close()
  }

  question(query: string): Promise<string> {
    return new Promise((resolve) => {
      this.#rlIns.question(query, (answer: string) => {
        resolve(answer)
      })
    })
  }

  select = async (message: string, options: string[]): Promise<number> => {
    const optionString = options
      .map((option, index) => `${index + 1}. ${option}`)
      .join('\n')
    const answer = await this.question(`${message}\n${optionString}\n选择：`)
    const index = parseInt(answer as string) - 1
    if (index >= 0 && index < options.length) {
      return index
    } else {
      console.log('无效输入，请重新选择')
      return this.select(message, options)
    }
  }

  confirm = async (message: string): Promise<boolean> => {
    const answer = await this.question(`${message} (y/n)`)
    if (answer === 'y' || answer === 'Y') {
      return true
    } else if (answer === 'n' || answer === 'N') {
      return false
    } else {
      console.log('无效输入，请输入 y 或 n')
      return this.confirm(message)
    }
  }

  input = async (message: string) => {
    const answer = await this.question(message)
    return answer
  }
}
